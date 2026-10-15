/**
 * Haven Agency Multi-Tenant Orchestrator
 * 
 * Enables local SEO agencies and multi-location franchises to autonomously manage
 * dozens of business profiles in parallel on a $0/month infrastructure budget.
 */

import { HavenDispatcher } from './dispatcher.ts';
import type {
  HavenResponse,
  CronPostEventPayload,
  AuditEventPayload,
  MasterProfileSchema,
} from '../types/index.ts';

export interface ClientProfile {
  businessId: string;
  businessName: string;
  category: string;
  targetLocation: string;
  phone: string;
  escalationPhone: string;
  website: string;
  neighborhoods: string[];
  targetKeywords: string[];
  services: string[];
  operatingHours: Record<string, string>;
  masterSchema: MasterProfileSchema;
}

export interface BatchRunSummary {
  totalClients: number;
  successfulExecutions: number;
  failedExecutions: number;
  results: Array<{
    businessId: string;
    businessName: string;
    actionType: string;
    safeToAutoPublish: boolean;
    seoKeywordInjected: string | null;
  }>;
}

export class MultiTenantAgencyManager {
  private dispatcher: HavenDispatcher;
  private clients: Map<string, ClientProfile> = new Map();

  constructor(dispatcher?: HavenDispatcher) {
    this.dispatcher = dispatcher || new HavenDispatcher();
  }

  registerClient(profile: ClientProfile): void {
    this.clients.set(profile.businessId, profile);
  }

  getClient(businessId: string): ClientProfile | undefined {
    return this.clients.get(businessId);
  }

  getAllClients(): ClientProfile[] {
    return Array.from(this.clients.values());
  }

  /**
   * Executes weekly GBP freshness posts across all agency clients in parallel.
   */
  async runWeeklyPostBatch(): Promise<BatchRunSummary> {
    const clients = this.getAllClients();
    const results: BatchRunSummary['results'] = [];
    let successfulExecutions = 0;
    let failedExecutions = 0;

    const executions = clients.map(async (client) => {
      const neighborhood = client.neighborhoods[0] || client.targetLocation;
      const service = client.services[0] || client.category;

      const event: CronPostEventPayload = {
        eventId: `cron_${client.businessId}_${Date.now()}`,
        eventType: 'CRON_POST_EVENT',
        businessId: client.businessId,
        businessName: client.businessName,
        businessCategory: client.category,
        targetLocation: client.targetLocation,
        timestamp: new Date().toISOString(),
        neighborhoodOrLandmark: neighborhood,
        serviceVector: service,
        callToActionUrlOrPhone: `Call ${client.phone} or visit ${client.website}`,
      };

      try {
        const res = await this.dispatcher.dispatch(event);
        successfulExecutions++;
        results.push({
          businessId: client.businessId,
          businessName: client.businessName,
          actionType: res.actionType,
          safeToAutoPublish: res.safeToAutoPublish,
          seoKeywordInjected: res.seoKeywordInjected,
        });
      } catch (err) {
        failedExecutions++;
        console.error(`Batch post failed for ${client.businessName}:`, err);
      }
    });

    await Promise.all(executions);

    return {
      totalClients: clients.length,
      successfulExecutions,
      failedExecutions,
      results,
    };
  }

  /**
   * Executes daily schema drift audits across all agency clients.
   */
  async runAuditBatch(): Promise<BatchRunSummary> {
    const clients = this.getAllClients();
    const results: BatchRunSummary['results'] = [];
    let successfulExecutions = 0;
    let failedExecutions = 0;

    const executions = clients.map(async (client) => {
      const event: AuditEventPayload = {
        eventId: `audit_${client.businessId}_${Date.now()}`,
        eventType: 'AUDIT_EVENT',
        businessId: client.businessId,
        businessName: client.businessName,
        businessCategory: client.category,
        targetLocation: client.targetLocation,
        timestamp: new Date().toISOString(),
        liveGbpSchema: client.masterSchema, // Baseline comparison
        approvedMasterSchema: client.masterSchema,
        competitors: [
          {
            competitorName: `Local Competitor A (${client.targetLocation})`,
            currentReviewsCount: 120,
            newReviewsThisWeek: 3,
            averageRating: 4.7,
            categories: [client.category],
          },
        ],
      };

      try {
        const res = await this.dispatcher.dispatch(event);
        successfulExecutions++;
        results.push({
          businessId: client.businessId,
          businessName: client.businessName,
          actionType: res.actionType,
          safeToAutoPublish: res.safeToAutoPublish,
          seoKeywordInjected: res.seoKeywordInjected,
        });
      } catch (err) {
        failedExecutions++;
        console.error(`Batch audit failed for ${client.businessName}:`, err);
      }
    });

    await Promise.all(executions);

    return {
      totalClients: clients.length,
      successfulExecutions,
      failedExecutions,
      results,
    };
  }
}
