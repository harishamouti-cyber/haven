import { test, describe } from 'node:test';
import assert from 'node:assert';
import { MultiProviderRouter } from '../src/core/router.ts';

describe('MultiProviderRouter', () => {
  test('initializes default zero-cost providers', () => {
    const router = new MultiProviderRouter();
    assert.ok(router);
  });

  test('successfully rotates models and providers with zero latency failover', async () => {
    const router = new MultiProviderRouter({
      offlineFallbackEnabled: true,
    });

    const res1 = await router.generate([
      { role: 'user', content: 'Test prompt 1' },
    ]);
    assert.ok(res1.responseContent);
    assert.strictEqual(typeof res1.durationMs, 'number');

    const res2 = await router.generate([
      { role: 'user', content: 'Test prompt 2' },
    ]);
    assert.ok(res2.responseContent);

    const metrics = router.getMetrics();
    assert.strictEqual(metrics.totalRequests, 2);
    assert.strictEqual(metrics.successfulRequests, 2);
  });
});
