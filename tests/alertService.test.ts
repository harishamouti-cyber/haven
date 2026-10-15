import { test, describe } from 'node:test';
import assert from 'node:assert';
import { AlertService } from '../src/services/alertService.ts';

describe('AlertService', () => {
  test('dispatches owner alert and records in history buffer', async () => {
    const alertService = new AlertService();

    const res = await alertService.sendOwnerAlert({
      businessName: 'Apex Dental Care',
      severity: 'URGENT',
      summary: '1-Star review from disgruntled customer received.',
      actionRequired: 'Review draft response immediately.',
      timestamp: new Date().toISOString(),
    });

    assert.strictEqual(res.delivered, true);
    assert.strictEqual(res.channel, 'LOCAL_BUFFER');

    const history = alertService.getAlertHistory();
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].severity, 'URGENT');
  });
});
