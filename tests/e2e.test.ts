import { test, describe } from 'node:test';
import assert from 'node:assert';
import { HavenDispatcher } from '../src/core/dispatcher.ts';
import { InngestQueueHandler } from '../src/queue/inngestHandler.ts';
import { HavenDatabaseClient } from '../src/db/supabaseClient.ts';
import { validateHavenResponse, type ReviewEventPayload } from '../src/types/index.ts';

describe('Haven End-to-End & Schema Compliance', () => {
  const dispatcher = new HavenDispatcher();
  const db = new HavenDatabaseClient();
  const queue = new InngestQueueHandler(dispatcher, db);

  test('queue processing dispatches, validates schema, and stores to Supabase repository', async () => {
    const payload: ReviewEventPayload = {
      eventId: 'evt_queue_01',
      eventType: 'REVIEW_EVENT',
      businessId: 'biz_e2e_01',
      businessName: 'Apex Dental Care',
      businessCategory: 'Dental Clinic',
      targetLocation: 'DHA Lahore',
      timestamp: new Date().toISOString(),
      reviewerName: 'Mariam Qureshi',
      starRating: 5,
      reviewText: 'Outstanding teeth whitening and very friendly staff!',
      targetKeywords: ['teeth whitening specialist Lahore'],
    };

    const queueResult = await queue.handleQueueEvent({
      name: 'haven/review.received',
      data: payload,
    });

    assert.strictEqual(queueResult.status, 'COMPLETED');
    const validation = validateHavenResponse(queueResult.response);
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(validation.errors.length, 0);

    const stored = db.getInMemoryRecords();
    assert.ok(stored.length >= 1);
    assert.strictEqual(stored[0].businessId, 'biz_e2e_01');
  });

  test('missing or corrupt payload produces ESCALATION satisfying Haven schema', async () => {
    const corruptPayload = {} as unknown as ReviewEventPayload;
    const res = await dispatcher.dispatch(corruptPayload);

    const validation = validateHavenResponse(res);
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(res.actionType, 'ESCALATION');
    assert.strictEqual(res.safeToAutoPublish, false);
    assert.ok(res.ownerAlertSummary?.includes('REQUIRES_HUMAN_REVIEW'));
  });
});
