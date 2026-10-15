/**
 * Haven Safety, Ethics & Guardrails Engine
 * Strictly enforces Google policy, brand safety, and local SEO compliance.
 */

import type { HavenResponse, HavenEventPayload } from '../types/index.ts';

export interface GuardrailResult {
  passed: boolean;
  violations: string[];
  sanitizedContent?: string;
}

const PROHIBITED_RANKING_PATTERNS = [
  /#1\s+on\s+google/i,
  /#1\s+ranking/i,
  /guarantee\w*\s+(first\s+page|#1|top\s+spot|rankings?)/i,
  /promise\w*\s+(first\s+page|#1|top\s+rankings?)/i,
  /top\s+result\s+guaranteed/i,
];

const SPAM_SIGNALS = [
  /whatsapp\s*me\s*at/i,
  /t\.me\//i,
  /bit\.ly\//i,
  /crypto\s*investment/i,
  /casino|lottery|poker/i,
  /buy\s+cheap\s+followers/i,
  /(http|https):\/\/[^\s]{20,}/i,
];

export class GuardrailsEngine {
  /**
   * Validates incoming event payload integrity.
   */
  validateIncomingEvent(event: Partial<HavenEventPayload>): {
    valid: boolean;
    isSpam: boolean;
    reason?: string;
  } {
    if (!event || typeof event !== 'object') {
      return { valid: false, isSpam: false, reason: 'Empty or malformed event object' };
    }

    if (!event.eventType) {
      return { valid: false, isSpam: false, reason: 'Missing eventType property' };
    }

    if (!event.businessName || event.businessName.trim() === '') {
      return { valid: false, isSpam: false, reason: 'Missing businessName' };
    }

    if (event.eventType === 'REVIEW_EVENT') {
      const reviewText = event.reviewText ?? '';
      const reviewerName = event.reviewerName ?? '';

      if (!reviewerName.trim() && !reviewText.trim()) {
        return { valid: false, isSpam: false, reason: 'Review missing reviewerName and text' };
      }

      // Check for obvious spam bot injection
      for (const pattern of SPAM_SIGNALS) {
        if (pattern.test(reviewText) || pattern.test(reviewerName)) {
          return { valid: false, isSpam: true, reason: `Spam signature detected: ${pattern.source}` };
        }
      }
    }

    return { valid: true, isSpam: false };
  }

  /**
   * Scans content for misleading ranking claims or unethical guarantees.
   */
  auditContent(content: string): GuardrailResult {
    const violations: string[] = [];

    for (const pattern of PROHIBITED_RANKING_PATTERNS) {
      if (pattern.test(content)) {
        violations.push(
          `Violates Policy: Disallowed ranking guarantee or claim matching '${pattern.source}'. Local rank depends on distance and relevance.`
        );
      }
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  /**
   * Enforces publication gating based on review star ratings and sentiment.
   */
  enforceRatingGuardrail(
    response: HavenResponse,
    starRating?: number
  ): HavenResponse {
    const result: HavenResponse = { ...response };

    // Strict safety override: 1, 2, or 3-Star Reviews can NEVER be auto-published
    if (typeof starRating === 'number' && starRating <= 3) {
      result.safeToAutoPublish = false;
      result.seoKeywordInjected = null; // No keyword stuffing on complaints

      if (!result.ownerAlertSummary) {
        result.ownerAlertSummary = `URGENT OWNER ALERT: ${starRating}-star review received requiring offline intervention and owner approval.`;
      }
    }

    return result;
  }

  /**
   * Checks post word count (between 80 to 120 words).
   */
  checkPostWordCount(postText: string): { valid: boolean; wordCount: number; advice?: string } {
    const words = postText.trim().split(/\s+/).filter(Boolean);
    const count = words.length;

    if (count < 80) {
      return {
        valid: false,
        wordCount: count,
        advice: `Post length (${count} words) is below minimum of 80 words for optimal GBP engagement.`,
      };
    }

    if (count > 120) {
      return {
        valid: false,
        wordCount: count,
        advice: `Post length (${count} words) exceeds maximum of 120 words for punchy mobile GBP feeds.`,
      };
    }

    return { valid: true, wordCount: count };
  }
}
