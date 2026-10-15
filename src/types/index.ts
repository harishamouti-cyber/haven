/**
 * Haven Core Engine - Strict Type Definitions & Contracts
 */

export type ActionType =
  | 'REVIEW_REPLY'
  | 'GBP_POST'
  | 'QEA_SEEDING'
  | 'ESCALATION'
  | 'COMPETITOR_AUDIT';

export type SentimentCategory =
  | 'POSITIVE'
  | 'NEUTRAL'
  | 'COMPLAINT'
  | 'SPAM';

export interface HavenResponse {
  actionType: ActionType;
  contentOutput: string;
  sentimentCategory: SentimentCategory;
  safeToAutoPublish: boolean;
  seoKeywordInjected: string | null;
  ownerAlertSummary: string | null;
}

export type EventType =
  | 'REVIEW_EVENT'
  | 'INQUIRY_EVENT'
  | 'CRON_POST_EVENT'
  | 'AUDIT_EVENT';

export interface BaseEvent {
  eventId: string;
  businessId: string;
  businessName: string;
  businessCategory: string; // e.g. "Dental Clinic", "HVAC Contractor"
  targetLocation: string;   // e.g. "DHA Lahore", "Gulberg Lahore", "Austin TX"
  timestamp: string;
}

export interface ReviewEventPayload extends BaseEvent {
  eventType: 'REVIEW_EVENT';
  reviewerName: string;
  starRating: number;       // 1 to 5
  reviewText: string;
  targetKeywords?: string[]; // e.g. ["emergency dentist in Lahore", "teeth whitening clinic"]
  phoneNumberForEscalation?: string;
}

export interface InquiryEventPayload extends BaseEvent {
  eventType: 'INQUIRY_EVENT';
  senderName: string;
  source: 'GMAIL' | 'GBP_MESSAGING';
  customerQuestion: string;
  verifiedBusinessFacts?: Record<string, string>; // Services, hours, equipment, address
}

export interface CronPostEventPayload extends BaseEvent {
  eventType: 'CRON_POST_EVENT';
  neighborhoodOrLandmark: string; // e.g. "Y-Block DHA", "Liberty Roundabout"
  serviceVector: string;          // e.g. "Dental Implants & Root Canal", "Emergency AC Duct Cleaning"
  callToActionUrlOrPhone: string;
  seasonalPromoOrUpdate?: string;
}

export interface MasterProfileSchema {
  businessName: string;
  primaryCategory: string;
  secondaryCategories: string[];
  address: string;
  phone: string;
  website: string;
  regularHours: Record<string, string>;
  servicesList: string[];
}

export interface CompetitorData {
  competitorName: string;
  currentReviewsCount: number;
  newReviewsThisWeek: number;
  averageRating: number;
  categories: string[];
  recentPostDate?: string;
}

export interface AuditEventPayload extends BaseEvent {
  eventType: 'AUDIT_EVENT';
  liveGbpSchema: MasterProfileSchema;
  approvedMasterSchema: MasterProfileSchema;
  competitors: CompetitorData[];
}

export type HavenEventPayload =
  | ReviewEventPayload
  | InquiryEventPayload
  | CronPostEventPayload
  | AuditEventPayload;

/**
 * Validates that an object strictly adheres to HavenResponse schema.
 */
export function validateHavenResponse(obj: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['Response must be a non-null object'] };
  }

  const record = obj as Record<string, unknown>;

  const validActionTypes: ActionType[] = [
    'REVIEW_REPLY',
    'GBP_POST',
    'QEA_SEEDING',
    'ESCALATION',
    'COMPETITOR_AUDIT',
  ];
  if (!validActionTypes.includes(record.actionType as ActionType)) {
    errors.push(`Invalid actionType: ${record.actionType}`);
  }

  const validSentiments: SentimentCategory[] = [
    'POSITIVE',
    'NEUTRAL',
    'COMPLAINT',
    'SPAM',
  ];
  if (!validSentiments.includes(record.sentimentCategory as SentimentCategory)) {
    errors.push(`Invalid sentimentCategory: ${record.sentimentCategory}`);
  }

  if (typeof record.contentOutput !== 'string' || record.contentOutput.trim() === '') {
    errors.push('contentOutput must be a non-empty string');
  }

  if (typeof record.safeToAutoPublish !== 'boolean') {
    errors.push('safeToAutoPublish must be a boolean');
  }

  if (record.seoKeywordInjected !== null && typeof record.seoKeywordInjected !== 'string') {
    errors.push('seoKeywordInjected must be a string or null');
  }

  // Schema rule: ownerAlertSummary is mandatory if safeToAutoPublish is false
  if (record.safeToAutoPublish === false) {
    if (typeof record.ownerAlertSummary !== 'string' || record.ownerAlertSummary.trim() === '') {
      errors.push('ownerAlertSummary is mandatory and cannot be empty when safeToAutoPublish is false');
    }
  } else if (record.ownerAlertSummary !== null && typeof record.ownerAlertSummary !== 'string') {
    errors.push('ownerAlertSummary must be null or string when safeToAutoPublish is true');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
