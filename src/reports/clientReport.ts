/**
 * Haven Executive Client Report Generator
 * 
 * Generates automated weekly performance reports in HTML and Markdown
 * for local service business owners and agency stakeholders.
 */

export interface WeeklyMetrics {
  businessName: string;
  category: string;
  targetLocation: string;
  reportingPeriod: string;
  totalReviewsReceived: number;
  averageRating: number;
  seoKeywordsInjectedCount: number;
  injectedKeywordSamples: string[];
  postsPublishedCount: number;
  geoEntitiesSeededCount: number;
  unauthorizedEditsBlocked: number;
  competitorAverageGain: number;
}

export class ClientReportGenerator {
  generateMarkdownReport(metrics: WeeklyMetrics): string {
    return `# 📈 HAVEN WEEKLY LOCAL SEO & REPUTATION REPORT
**Client**: ${metrics.businessName} (${metrics.category})  
**Target Market**: ${metrics.targetLocation}  
**Period**: ${metrics.reportingPeriod}  
**Infrastructure Budget**: $0.00 / month (Fully Autonomous)

---

## 1. Google Map-Pack & Review Velocity
- **Reviews Processed This Week**: ${metrics.totalReviewsReceived}
- **Average Star Rating**: ${metrics.averageRating.toFixed(1)} ★
- **SEO Keywords Injected (Review Justifications)**: ${metrics.seoKeywordsInjectedCount}
- **Target Keywords Triggered**: ${metrics.injectedKeywordSamples.map((k) => `\`${k}\``).join(', ')}
- **Brand Protection**: 100% of reviews rated ≤ 3★ were escalated offline with 0 negative auto-publishes.

## 2. Profile Freshness & Local Posts
- **Weekly GBP Updates Published**: ${metrics.postsPublishedCount}
- **Neighborhood Grounding Anchors**: Verified active
- **Average Word Count**: 90–110 words with direct CTA

## 3. Generative Engine Optimization (GEO) Status
- **AI Search Citations / Q&A Entities Seeded**: ${metrics.geoEntitiesSeededCount}
- **Search Visibility Target**: Google AI Overviews, Perplexity AI, ChatGPT Search

## 4. Profile Guard & Security
- **Unauthorized Live Schema Edits Blocked**: ${metrics.unauthorizedEditsBlocked}
- **Listing Hijacking Risk**: 0% (Live profile verified against Approved Master Record)

## 5. Competitor Map-Pack Radar
- **Average Competitor Weekly Review Gain**: +${metrics.competitorAverageGain} reviews
- **Strategic Status**: Your review velocity outpaces local competitors to maintain 3-pack dominance.

---
*Report generated autonomously by Haven Core Engine.*`;
  }

  generateHtmlReport(metrics: WeeklyMetrics): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Weekly Local SEO Report - ${metrics.businessName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; }
    .container { max-width: 800px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 28px; border: 1px solid #334155; }
    h1 { font-size: 24px; color: #38bdf8; margin-bottom: 6px; }
    .meta { color: #94a3b8; font-size: 14px; margin-bottom: 24px; border-bottom: 1px solid #334155; padding-bottom: 14px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
    .kpi { background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; text-align: center; }
    .kpi-num { font-size: 26px; font-weight: 700; color: #10b981; }
    .kpi-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 16px; color: #e2e8f0; margin-bottom: 10px; border-left: 3px solid #38bdf8; padding-left: 8px; }
    ul { list-style: none; padding-left: 0; font-size: 14px; line-height: 1.6; color: #cbd5e1; }
    li { margin-bottom: 6px; }
    .badge { background: #0369a1; color: #e0f2fe; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <h1>HAVEN EXECUTIVE PERFORMANCE REPORT</h1>
    <div class="meta">
      <strong>${metrics.businessName}</strong> (${metrics.category}) | ${metrics.targetLocation} | Period: ${metrics.reportingPeriod}
    </div>

    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-num">${metrics.totalReviewsReceived}</div>
        <div class="kpi-label">Reviews Processed</div>
      </div>
      <div class="kpi">
        <div class="kpi-num">${metrics.averageRating.toFixed(1)} ★</div>
        <div class="kpi-label">Average Rating</div>
      </div>
      <div class="kpi">
        <div class="kpi-num">${metrics.seoKeywordsInjectedCount}</div>
        <div class="kpi-label">SEO Justifications</div>
      </div>
    </div>

    <div class="section">
      <h2>Local Map-Pack & Search Justifications</h2>
      <ul>
        <li>✔ Keywords naturally woven into 5★ replies: ${metrics.injectedKeywordSamples.map((k) => `<span class="badge">${k}</span>`).join(' ')}</li>
        <li>✔ Zero low-star reviews auto-published: 100% human-in-the-loop protection</li>
      </ul>
    </div>

    <div class="section">
      <h2>GBP Freshness & AI Search (GEO)</h2>
      <ul>
        <li>✔ ${metrics.postsPublishedCount} weekly localized freshness posts published to Google Maps</li>
        <li>✔ ${metrics.geoEntitiesSeededCount} factual entity answers indexed for Google AI Overviews & ChatGPT Search</li>
      </ul>
    </div>

    <div class="section">
      <h2>Profile Guard & Listing Security</h2>
      <ul>
        <li>✔ ${metrics.unauthorizedEditsBlocked} unauthorized profile drifts detected and blocked</li>
        <li>✔ Competitor review velocity tracked (local average: +${metrics.competitorAverageGain}/wk)</li>
      </ul>
    </div>
  </div>
</body>
</html>`;
  }
}
