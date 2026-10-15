import { test, describe } from 'node:test';
import assert from 'node:assert';
import { HavenDispatcher } from '../src/core/dispatcher.ts';
import type { CronPostEventPayload } from '../src/types/index.ts';

describe('Module B: Weekly GBP Post Autopilot', () => {
  const dispatcher = new HavenDispatcher();

  test('generates post within 80 to 120 words with local anchor and CTA', async () => {
    const payload: CronPostEventPayload = {
      eventId: 'evt_post_01',
      eventType: 'CRON_POST_EVENT',
      businessId: 'biz_02',
      businessName: 'Lahore Pro Plumbers',
      businessCategory: 'Plumbing Service',
      targetLocation: 'Johar Town Lahore',
      timestamp: new Date().toISOString(),
      neighborhoodOrLandmark: 'Shaukat Khanum Chowk',
      serviceVector: 'Emergency Water Leak & Pipe Burst Repair',
      callToActionUrlOrPhone: 'Call +92-321-9876543 today',
    };

    const res = await dispatcher.dispatch(payload);
    assert.strictEqual(res.actionType, 'GBP_POST');
    assert.strictEqual(res.sentimentCategory, 'POSITIVE');
    assert.strictEqual(res.safeToAutoPublish, true);
    assert.ok(res.seoKeywordInjected?.includes('Shaukat Khanum Chowk'));

    const words = res.contentOutput.trim().split(/\s+/).filter(Boolean);
    assert.ok(
      words.length >= 80 && words.length <= 120,
      `Word count was ${words.length}, expected between 80 and 120`
    );
  });
});
