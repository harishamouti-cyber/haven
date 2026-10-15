import { test, describe } from 'node:test';
import assert from 'node:assert';
import { HavenDispatcher } from '../src/core/dispatcher.ts';
import type { InquiryEventPayload } from '../src/types/index.ts';

describe('Module C: AI Search (GEO) & Q&A Optimization', () => {
  const dispatcher = new HavenDispatcher();

  test('answers customer questions factually with entity-based information', async () => {
    const payload: InquiryEventPayload = {
      eventId: 'evt_inq_01',
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

    const res = await dispatcher.dispatch(payload);
    assert.strictEqual(res.actionType, 'QEA_SEEDING');
    assert.strictEqual(res.sentimentCategory, 'NEUTRAL');
    assert.strictEqual(res.safeToAutoPublish, true);
    assert.ok(res.seoKeywordInjected?.includes('dental clinic'));
    assert.ok(res.contentOutput.length > 20);
    assert.strictEqual(res.ownerAlertSummary, null);
  });
});
