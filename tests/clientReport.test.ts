import { test, describe } from 'node:test';
import assert from 'node:assert';
import { ClientReportGenerator, type WeeklyMetrics } from '../src/reports/clientReport.ts';

describe('ClientReportGenerator', () => {
  const generator = new ClientReportGenerator();

  const metrics: WeeklyMetrics = {
    businessName: 'Apex Dental Care',
    category: 'Dental Clinic',
    targetLocation: 'DHA Lahore',
    reportingPeriod: 'Oct 8 - Oct 15, 2026',
    totalReviewsReceived: 14,
    averageRating: 4.9,
    seoKeywordsInjectedCount: 12,
    injectedKeywordSamples: ['emergency dentist in Lahore', 'root canal specialist DHA'],
    postsPublishedCount: 1,
    geoEntitiesSeededCount: 4,
    unauthorizedEditsBlocked: 1,
    competitorAverageGain: 3.5,
  };

  test('generates structured Markdown executive report', () => {
    const md = generator.generateMarkdownReport(metrics);

    assert.ok(md.includes('# 📈 HAVEN WEEKLY LOCAL SEO & REPUTATION REPORT'));
    assert.ok(md.includes('Apex Dental Care'));
    assert.ok(md.includes('emergency dentist in Lahore'));
    assert.ok(md.includes('$0.00 / month'));
    assert.ok(md.includes('Average Star Rating**: 4.9 ★'));
  });

  test('generates branded HTML executive report', () => {
    const html = generator.generateHtmlReport(metrics);

    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('HAVEN EXECUTIVE PERFORMANCE REPORT'));
    assert.ok(html.includes('Apex Dental Care'));
    assert.ok(html.includes('14'));
    assert.ok(html.includes('4.9 ★'));
  });
});
