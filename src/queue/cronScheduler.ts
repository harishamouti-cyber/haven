/**
 * Haven Background Cron Scheduler
 * 
 * Orchestrates autonomous recurring triggers on a $0/month budget:
 * 1. Weekly GBP Freshness Post generation (CRON_POST_EVENT)
 * 2. Daily Competitor Map-Pack Audit & Schema Drift Scan (AUDIT_EVENT)
 */

import { HavenDispatcher } from '../core/dispatcher.ts';
import type { CronPostEventPayload, AuditEventPayload, HavenResponse } from '../types/index.ts';

export interface SchedulerConfig {
  postIntervalMs: number; // Defaults to 7 days (or test interval)
  auditIntervalMs: number; // Defaults to 24 hours (or test interval)
}

export class HavenScheduler {
  private dispatcher: HavenDispatcher;
  private postTimer?: NodeJS.Timeout;
  private auditTimer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(dispatcher?: HavenDispatcher) {
    this.dispatcher = dispatcher || new HavenDispatcher();
  }

  start(
    samplePostEvent: CronPostEventPayload,
    sampleAuditEvent: AuditEventPayload,
    config: SchedulerConfig = {
      postIntervalMs: 7 * 24 * 60 * 60 * 1000, // 7 days
      auditIntervalMs: 24 * 60 * 60 * 1000,    // 24 hours
    }
  ): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Schedule weekly post trigger
    this.postTimer = setInterval(async () => {
      try {
        await this.dispatcher.dispatch({
          ...samplePostEvent,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Scheduled GBP Post generation failed:', err);
      }
    }, config.postIntervalMs);

    // Schedule daily audit trigger
    this.auditTimer = setInterval(async () => {
      try {
        await this.dispatcher.dispatch({
          ...sampleAuditEvent,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Scheduled Map-Pack Audit failed:', err);
      }
    }, config.auditIntervalMs);
  }

  stop(): void {
    if (this.postTimer) clearInterval(this.postTimer);
    if (this.auditTimer) clearInterval(this.auditTimer);
    this.isRunning = false;
  }

  async triggerImmediatePost(event: CronPostEventPayload): Promise<HavenResponse> {
    return this.dispatcher.dispatch(event);
  }

  async triggerImmediateAudit(event: AuditEventPayload): Promise<HavenResponse> {
    return this.dispatcher.dispatch(event);
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}
