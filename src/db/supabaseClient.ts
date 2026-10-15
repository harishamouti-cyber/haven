/**
 * Haven Supabase PostgreSQL Database Client
 * Runs on Supabase free tier ($0/month) with zero-cost REST query interface.
 * Includes in-memory mock fallback for airgapped sandboxes and deterministic tests.
 */

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
  private supabaseAnonKey?: string;
  private inMemoryStore: DatabaseRecord[] = [];

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
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

    if (this.supabaseUrl && this.supabaseAnonKey) {
      try {
        const res = await fetch(`${this.supabaseUrl}/rest/v1/haven_executions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.supabaseAnonKey,
            Authorization: `Bearer ${this.supabaseAnonKey}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(record),
        });

        if (!res.ok) {
          // Log and fallback to local buffer
          console.warn(`Supabase HTTP ${res.status}: falling back to in-memory store`);
          this.inMemoryStore.push(record);
        }
      } catch (err) {
        console.warn(`Supabase network error, stored in local fallback:`, err);
        this.inMemoryStore.push(record);
      }
    } else {
      // Local zero-cost sandbox buffer
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
