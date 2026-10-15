/**
 * Haven Supabase PostgreSQL Database Client
 * Runs on Supabase free tier ($0/month) with zero-cost REST query interface.
 * Supports service_role and anon authentication with local in-memory fallback.
 */

try {
  process.loadEnvFile();
} catch {
  // Ignore if .env doesn't exist
}

import type { HavenResponse } from '../types/index.ts';

export interface DatabaseRecord {
  id: string;
  businessId: string;
  actionType: string;
  response: HavenResponse;
  createdAt: string;
}

export class HavenDatabaseClient {
  private supabaseUrl?: string;
  private supabaseKey?: string;
  private inMemoryStore: DatabaseRecord[] = [];

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    // Prefer service_role key to bypass RLS, fallback to anon
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  }

  async persistExecution(
    businessId: string,
    response: HavenResponse
  ): Promise<{ success: boolean; id: string }> {
    const record: DatabaseRecord = {
      id: `haven_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      businessId,
      actionType: response.actionType,
      response,
      createdAt: new Date().toISOString(),
    };

    if (this.supabaseUrl && this.supabaseKey) {
      try {
        let endpoint = `${this.supabaseUrl}/rest/v1/haven_reviews`;
        let payload: Record<string, unknown> = {
          business_id: businessId,
          reviewer_name: 'Customer',
          star_rating: 5,
          review_text: 'Logged via Haven engine',
          sentiment_category: response.sentimentCategory,
          generated_reply: response.contentOutput,
          seo_keyword_injected: response.seoKeywordInjected,
          safe_to_auto_publish: response.safeToAutoPublish,
          owner_alert_summary: response.ownerAlertSummary,
        };

        if (response.actionType === 'GBP_POST') {
          endpoint = `${this.supabaseUrl}/rest/v1/haven_posts`;
          payload = {
            business_id: businessId,
            neighborhood_or_landmark: 'Local Market',
            service_vector: response.seoKeywordInjected || 'General Service',
            post_content: response.contentOutput,
            word_count: response.contentOutput.trim().split(/\s+/).length,
            call_to_action: 'Contact us today',
          };
        } else if (response.actionType === 'COMPETITOR_AUDIT') {
          endpoint = `${this.supabaseUrl}/rest/v1/haven_audits`;
          payload = {
            business_id: businessId,
            audit_report_text: response.contentOutput,
            owner_alert_sent: !response.safeToAutoPublish,
          };
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.supabaseKey,
            Authorization: `Bearer ${this.supabaseKey}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          // If table doesn't exist yet, buffer to local memory
          this.inMemoryStore.push(record);
        }
      } catch (err) {
        console.warn(`Supabase network write failed, buffered to local memory:`, err);
        this.inMemoryStore.push(record);
      }
    } else {
      this.inMemoryStore.push(record);
    }

    return { success: true, id: record.id };
  }

  getInMemoryRecords(): DatabaseRecord[] {
    return [...this.inMemoryStore];
  }

  clearInMemoryStore(): void {
    this.inMemoryStore = [];
  }
}
