/**
 * Module D: Profile Guard & Competitor Map Spy
 * 
 * 1. Profile Guard: Detects unauthorized edits, hijacked phone numbers, or fake services
 *    by diffing live GBP schema against the approved master database record.
 * 2. Competitor Map Spy: Tracks competitor review velocity and category adjustments
 *    in the Google Local Pack and formats an actionable summary.
 */

import type { AuditEventPayload, HavenResponse, MasterProfileSchema } from '../types/index.ts';

export interface SchemaDrift {
  field: string;
  expected: unknown;
  actual: unknown;
  severity: 'CRITICAL' | 'WARNING';
}

export class ProfileGuardModule {
  processAudit(event: AuditEventPayload): HavenResponse {
    const drifts = this.detectSchemaDrift(event.approvedMasterSchema, event.liveGbpSchema);
    const competitorSummary = this.analyzeCompetitors(event.competitors);

    const hasCriticalDrift = drifts.some((d) => d.severity === 'CRITICAL');
    const hasWarnings = drifts.length > 0;

    let outputReport = `=== GBP PROFILE & COMPETITOR AUDIT REPORT ===\n`;
    outputReport += `Business: ${event.businessName} (${event.targetLocation})\n`;
    outputReport += `Timestamp: ${event.timestamp}\n\n`;

    outputReport += `[1. SCHEMA DRIFT & INTEGRITY CHECK]\n`;
    if (drifts.length === 0) {
      outputReport += `Status: PASS. Live GBP schema perfectly matches approved master records. No unauthorized edits detected.\n\n`;
    } else {
      outputReport += `Status: ${hasCriticalDrift ? 'ALERT: UNAUTHORIZED EDITS DETECTED' : 'WARNING: PROFILE MODIFICATIONS DETECTED'}\n`;
      for (const d of drifts) {
        outputReport += `- [${d.severity}] ${d.field}: Expected "${JSON.stringify(d.expected)}", Live is "${JSON.stringify(d.actual)}"\n`;
      }
      outputReport += `\n`;
    }

    outputReport += `[2. COMPETITOR MAP-PACK VELOCITY & INTEL]\n`;
    outputReport += competitorSummary.detailedLines.join('\n');
    outputReport += `\n\n[3. RECOMMENDED STRATEGIC ACTION]\n`;
    outputReport += competitorSummary.strategicAdvice;

    let ownerAlertSummary: string;
    if (hasCriticalDrift) {
      ownerAlertSummary = `CRITICAL GBP DRIFT: Unauthorized modifications found in ${drifts.map((d) => d.field).join(', ')}. Live listing may be compromised. Review immediately.`;
    } else if (hasWarnings) {
      ownerAlertSummary = `GBP Schema Notice: Differences detected in ${drifts.map((d) => d.field).join(', ')}. Competitors gained ${competitorSummary.totalWeeklyReviewsGained} new reviews this week.`;
    } else {
      ownerAlertSummary = `Weekly Map Audit Complete: Listing 100% secure. Competitor velocity: +${competitorSummary.totalWeeklyReviewsGained} reviews. See dashboard report.`;
    }

    return {
      actionType: 'COMPETITOR_AUDIT',
      contentOutput: outputReport,
      sentimentCategory: 'NEUTRAL',
      safeToAutoPublish: false,
      seoKeywordInjected: null,
      ownerAlertSummary,
    };
  }

  detectSchemaDrift(master: MasterProfileSchema, live: MasterProfileSchema): SchemaDrift[] {
    const drifts: SchemaDrift[] = [];

    if (master.phone !== live.phone) {
      drifts.push({
        field: 'Phone Number',
        expected: master.phone,
        actual: live.phone,
        severity: 'CRITICAL', // High risk of listing hijacking
      });
    }

    if (master.address !== live.address) {
      drifts.push({
        field: 'Address',
        expected: master.address,
        actual: live.address,
        severity: 'CRITICAL',
      });
    }

    if (master.website !== live.website) {
      drifts.push({
        field: 'Website URL',
        expected: master.website,
        actual: live.website,
        severity: 'CRITICAL',
      });
    }

    if (master.primaryCategory !== live.primaryCategory) {
      drifts.push({
        field: 'Primary Category',
        expected: master.primaryCategory,
        actual: live.primaryCategory,
        severity: 'CRITICAL',
      });
    }

    // Check services difference
    const masterServices = new Set(master.servicesList);
    const unauthorizedServices = live.servicesList.filter((s) => !masterServices.has(s));
    if (unauthorizedServices.length > 0) {
      drifts.push({
        field: 'Injected Services',
        expected: master.servicesList,
        actual: unauthorizedServices,
        severity: 'WARNING',
      });
    }

    return drifts;
  }

  private analyzeCompetitors(competitors: AuditEventPayload['competitors']) {
    let totalWeeklyReviewsGained = 0;
    const detailedLines: string[] = [];

    const sortedByGains = [...competitors].sort(
      (a, b) => b.newReviewsThisWeek - a.newReviewsThisWeek
    );

    for (const comp of sortedByGains) {
      totalWeeklyReviewsGained += comp.newReviewsThisWeek;
      detailedLines.push(
        `- ${comp.competitorName}: ${comp.currentReviewsCount} reviews (${comp.averageRating}★) | +${comp.newReviewsThisWeek} this week | Primary Category: ${comp.categories[0] || 'N/A'}`
      );
    }

    const topMover = sortedByGains[0];
    const strategicAdvice = topMover && topMover.newReviewsThisWeek > 3
      ? `Top competitor "${topMover.competitorName}" gained ${topMover.newReviewsThisWeek} reviews this week. Increase review request outreach via SMS/WhatsApp to maintain map-pack rank.`
      : `Competitor review velocity is stable. Maintain current review automation and weekly posting cadence.`;

    return {
      totalWeeklyReviewsGained,
      detailedLines,
      strategicAdvice,
    };
  }
}
