/**
 * Haven HTTP Webhook & API Server
 * 
 * Lightweight, zero-dependency server utilizing Node.js native `node:http`.
 * Ingests webhooks from GBP, Inngest, Gmail, and serves the business owner dashboard.
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { HavenDispatcher } from '../core/dispatcher.ts';
import { HavenDatabaseClient } from '../db/supabaseClient.ts';
import { AlertService } from '../services/alertService.ts';
import { GbpAdapter } from '../adapters/gbpAdapter.ts';

export class HavenServer {
  private server: http.Server;
  private dispatcher: HavenDispatcher;
  private db: HavenDatabaseClient;
  private alertService: AlertService;
  private gbpAdapter: GbpAdapter;

  constructor() {
    this.dispatcher = new HavenDispatcher();
    this.db = new HavenDatabaseClient();
    this.alertService = new AlertService();
    this.gbpAdapter = new GbpAdapter();

    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res).catch((err) => {
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ error: errorMsg }));
      });
    });
  }

  async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // 1. Health check
    if (req.method === 'GET' && url.pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'HEALTHY',
          clusterBudget: '$0.00/mo',
          providers: [
            { id: 'zai', model: 'glm-4.7-flash', tier: 'unlimited_free' },
            { id: 'groq', model: 'llama-3.3-70b-rotation', tier: 'high_speed' },
            { id: 'mistral', model: 'mistral-small-latest', tier: 'experiment' },
          ],
          database: 'Supabase PostgreSQL (Active)',
          queue: 'Inngest / Trigger.dev (Active)',
          uptimeSeconds: process.uptime(),
        })
      );
      return;
    }

    // 2. Metrics
    if (req.method === 'GET' && url.pathname === '/api/metrics') {
      const records = this.db.getInMemoryRecords();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          totalExecutions: records.length,
          autoPublished: records.filter((r) => r.response.safeToAutoPublish).length,
          escalations: records.filter((r) => !r.response.safeToAutoPublish).length,
          alertsDispatched: this.alertService.getAlertHistory().length,
        })
      );
      return;
    }

    // 3. Webhook Ingestion API
    if (req.method === 'POST' && url.pathname === '/api/events') {
      const body = await this.readRequestBody(req);
      const payload = JSON.parse(body);

      const result = await this.dispatcher.dispatch(payload);

      // If safeToAutoPublish is false, dispatch alert to owner
      if (!result.safeToAutoPublish && result.ownerAlertSummary) {
        await this.alertService.sendOwnerAlert({
          businessName: payload.businessName || 'Your Business',
          severity: result.actionType === 'COMPETITOR_AUDIT' ? 'WARNING' : 'URGENT',
          summary: result.ownerAlertSummary,
          actionRequired: 'Review draft response or profile schema in dashboard.',
          timestamp: new Date().toISOString(),
        });
      }

      // If safeToAutoPublish is true and GBP token present, auto-publish
      if (result.safeToAutoPublish && payload.businessId) {
        if (result.actionType === 'REVIEW_REPLY' && payload.googleReviewId) {
          await this.gbpAdapter.publishReviewReply(
            payload.businessId,
            payload.googleReviewId,
            result.contentOutput
          );
        } else if (result.actionType === 'GBP_POST') {
          await this.gbpAdapter.publishLocalPost(
            payload.businessId,
            result.contentOutput,
            payload.callToActionUrlOrPhone
          );
        }
      }

      await this.db.persistExecution(payload.businessId || 'default', result);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // 4. Dashboard Simulator API
    if (req.method === 'POST' && url.pathname === '/api/events/simulate') {
      const body = await this.readRequestBody(req);
      const { action } = JSON.parse(body || '{}');

      let sampleEvent: any;
      if (action === 'POS_REVIEW') {
        sampleEvent = {
          eventId: `sim_${Date.now()}`,
          eventType: 'REVIEW_EVENT',
          businessId: 'biz_01',
          businessName: 'Apex Dental Care',
          businessCategory: 'Dental Clinic',
          targetLocation: 'DHA Lahore',
          timestamp: new Date().toISOString(),
          reviewerName: 'Farhan Tariq',
          starRating: 5,
          reviewText: 'Dr. Tariq was very gentle during my root canal treatment yesterday.',
          targetKeywords: ['emergency dentist in Lahore'],
        };
      } else if (action === 'NEG_REVIEW') {
        sampleEvent = {
          eventId: `sim_${Date.now()}`,
          eventType: 'REVIEW_EVENT',
          businessId: 'biz_01',
          businessName: 'Apex Dental Care',
          businessCategory: 'Dental Clinic',
          targetLocation: 'DHA Lahore',
          timestamp: new Date().toISOString(),
          reviewerName: 'Ayesha Malik',
          starRating: 1,
          reviewText: 'Waited over 45 minutes past my scheduled appointment time.',
          phoneNumberForEscalation: '+92-300-1234567',
        };
      } else if (action === 'WEEKLY_POST') {
        sampleEvent = {
          eventId: `sim_${Date.now()}`,
          eventType: 'CRON_POST_EVENT',
          businessId: 'biz_01',
          businessName: 'Apex Dental Care',
          businessCategory: 'Dental Clinic',
          targetLocation: 'DHA Lahore',
          timestamp: new Date().toISOString(),
          neighborhoodOrLandmark: 'Y-Block DHA Phase 3',
          serviceVector: 'Emergency Tooth Extraction & Whitening',
          callToActionUrlOrPhone: 'Call +92-300-1234567 or visit apexdentalcare.pk',
        };
      } else if (action === 'GEO_QNA') {
        sampleEvent = {
          eventId: `sim_${Date.now()}`,
          eventType: 'INQUIRY_EVENT',
          businessId: 'biz_01',
          businessName: 'Apex Dental Care',
          businessCategory: 'Dental Clinic',
          targetLocation: 'DHA Lahore',
          timestamp: new Date().toISOString(),
          senderName: 'Hamza Sheikh',
          source: 'GBP_MESSAGING',
          customerQuestion: 'Do you offer emergency dental services on Sunday?',
        };
      } else {
        sampleEvent = {
          eventId: `sim_${Date.now()}`,
          eventType: 'AUDIT_EVENT',
          businessId: 'biz_01',
          businessName: 'Apex Dental Care',
          businessCategory: 'Dental Clinic',
          targetLocation: 'DHA Lahore',
          timestamp: new Date().toISOString(),
          liveGbpSchema: {
            businessName: 'Apex Dental Care',
            primaryCategory: 'Dental Clinic',
            secondaryCategories: [],
            address: 'Phase 5 DHA',
            phone: '+92-300-9999999',
            website: 'https://apexdentalcare.pk',
            regularHours: {},
            servicesList: ['Teeth Whitening', 'Botox'],
          },
          approvedMasterSchema: {
            businessName: 'Apex Dental Care',
            primaryCategory: 'Dental Clinic',
            secondaryCategories: [],
            address: 'Phase 5 DHA',
            phone: '+92-300-1234567',
            website: 'https://apexdentalcare.pk',
            regularHours: {},
            servicesList: ['Teeth Whitening'],
          },
          competitors: [
            {
              competitorName: 'DHA Smile Studio',
              currentReviewsCount: 140,
              newReviewsThisWeek: 5,
              averageRating: 4.8,
              categories: ['Dental Clinic'],
            },
          ],
        };
      }

      const result = await this.dispatcher.dispatch(sampleEvent);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // 5. Serve Static Dashboard
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      const htmlPath = path.join(process.cwd(), 'public', 'index.html');
      const content = await fs.readFile(htmlPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  }

  private readRequestBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });
  }

  listen(port: number | string): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(port, () => {
        resolve();
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => resolve());
    });
  }

  getServer(): http.Server {
    return this.server;
  }
}
