import { test, describe } from 'node:test';
import assert from 'node:assert';
import { HavenDispatcher } from '../src/core/dispatcher.ts';
import type { ReviewEventPayload } from '../src/types/index.ts';

describe('Module A: Review Responder & SEO Justification', () => {
  const dispatcher = new HavenDispatcher();

  test('5-star review injects local SEO keyword and allows auto-publishing', async () => {
    const payload: ReviewEventPayload = {
      eventId: 'evt_test_01',
      eventType: 'REVIEW_EVENT',
      businessId: 'biz_01',
      businessName: 'Apex Dental Care',
      businessCategory: 'Dental Clinic',
      targetLocation: 'DHA Lahore',
      timestamp: new Date().toISOString(),
      reviewerName: 'Ali Raza',
      starRating: 5,
      reviewText: 'Great tooth cleaning and courteous doctors.',
      targetKeywords: ['emergency dentist in Lahore'],
    };

    const res = await dispatcher.dispatch(payload);
    assert.strictEqual(res.actionType, 'REVIEW_REPLY');
    assert.strictEqual(res.sentimentCategory, 'POSITIVE');
    assert.strictEqual(res.safeToAutoPublish, true);
    assert.strictEqual(res.seoKeywordInjected, 'emergency dentist in Lahore');
    assert.strictEqual(res.ownerAlertSummary, null);
    assert.ok(res.contentOutput.includes('Ali Raza'));
  });

  test('1-star review blocks auto-publish, omits keywords, and generates owner alert', async () => {
    const payload: ReviewEventPayload = {
      eventId: 'evt_test_02',
      eventType: 'REVIEW_EVENT',
      businessId: 'biz_01',
      businessName: 'Apex Dental Care',
      businessCategory: 'Dental Clinic',
      targetLocation: 'DHA Lahore',
      timestamp: new Date().toISOString(),
      reviewerName: 'Zainab Bibi',
      starRating: 1,
      reviewText: 'Terrible experience, billing was totally unclear.',
      phoneNumberForEscalation: '+92-300-1112233',
    };

    const res = await dispatcher.dispatch(payload);
    assert.strictEqual(res.actionType, 'REVIEW_REPLY');
    assert.strictEqual(res.sentimentCategory, 'COMPLAINT');
    assert.strictEqual(res.safeToAutoPublish, false);
    assert.strictEqual(res.seoKeywordInjected, null);
    assert.ok(res.ownerAlertSummary && res.ownerAlertSummary.includes('URGENT'));
    assert.ok(res.contentOutput.includes('apologize'));
  });

  test('Spam review triggers ESCALATION with REQUIRES_HUMAN_REVIEW', async () => {
    const payload: ReviewEventPayload = {
      eventId: 'evt_test_03',
      eventType: 'REVIEW_EVENT',
      businessId: 'biz_01',
      businessName: 'Apex Dental Care',
      businessCategory: 'Dental Clinic',
      targetLocation: 'DHA Lahore',
      timestamp: new Date().toISOString(),
      reviewerName: 'CryptoBot',
      starRating: 5,
      reviewText: 'Earn 500% daily with crypto investment whatsapp me at +1234567890',
    };

    const res = await dispatcher.dispatch(payload);
    assert.strictEqual(res.actionType, 'ESCALATION');
    assert.strictEqual(res.sentimentCategory, 'SPAM');
    assert.strictEqual(res.safeToAutoPublish, false);
    assert.ok(res.ownerAlertSummary?.includes('REQUIRES_HUMAN_REVIEW'));
  });
});
