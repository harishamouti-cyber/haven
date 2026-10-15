/**
 * Haven Queue Orchestrator (Inngest / Trigger.dev Zero-Cost Integration)
 * 
 * Provides serverless event-driven background job orchestration at $0/month.
 * Eliminates persistent worker costs by relying on webhooks and serverless dispatch.
 */

import { HavenDispatcher } from '../core/dispatcher.ts';
import { HavenDatabaseClient } from '../db/supabaseClient.ts';
import type { HavenEventPayload, HavenResponse } from '../types/index.ts';

export interface InngestEventWrapper {
  name: string;
  data: HavenEventPayload;
  id?: string;
  ts?: number;
}

export class InngestQueueHandler {
  private dispatcher: HavenDispatcher;
  private db: HavenDatabaseClient;

  constructor(dispatcher?: HavenDispatcher, db?: HavenDatabaseClient) {
    this.dispatcher = dispatcher || new HavenDispatcher();
    this.db = db || new HavenDatabaseClient();
  }

  /**
   * Processes incoming Inngest / Trigger.dev queued job.
   */
  async handleQueueEvent(event: InngestEventWrapper): Promise<{
    status: 'COMPLETED' | 'ESCALATED';
    response: HavenResponse;
    recordId: string;
  }> {
    const payload = event.data;

    // Execute through Haven core dispatcher
    const result = await this.dispatcher.dispatch(payload);

    // Persist to Supabase
    const dbResult = await this.db.persistExecution(payload.businessId, result);

    const status = result.safeToAutoPublish ? 'COMPLETED' : 'ESCALATED';

    return {
      status,
      response: result,
      recordId: dbResult.id,
    };
  }
}
