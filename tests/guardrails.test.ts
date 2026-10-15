import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GuardrailsEngine } from '../src/core/guardrails.ts';

describe('GuardrailsEngine', () => {
  const guard = new GuardrailsEngine();

  test('prohibits #1 ranking on Google claims', () => {
    const claim1 = 'We guarantee you will be #1 on Google Maps within two weeks!';
    const audit1 = guard.auditContent(claim1);
    assert.strictEqual(audit1.passed, false);
    assert.ok(audit1.violations.length > 0);

    const safeText = 'We provide gentle dental cleaning and root canals in Lahore.';
    const audit2 = guard.auditContent(safeText);
    assert.strictEqual(audit2.passed, true);
  });

  test('identifies spam injection signatures', () => {
    const spamEvent = {
      eventType: 'REVIEW_EVENT' as const,
      businessName: 'Apex Clinic',
      reviewerName: 'SpamBot',
      reviewText: 'Join our telegram channel t.me/freecrypto for 100x return',
    };
    const res = guard.validateIncomingEvent(spamEvent);
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.isSpam, true);
  });
});
