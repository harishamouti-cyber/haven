import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GbpAdapter } from '../src/adapters/gbpAdapter.ts';

describe('GbpAdapter', () => {
  test('records and simulates review reply publication', async () => {
    const adapter = new GbpAdapter();

    const result = await adapter.publishReviewReply(
      'accounts/123/locations/456',
      'rev_789',
      'Thank you for your visit!'
    );

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.platform, 'GOOGLE_BUSINESS_PROFILE');
    assert.strictEqual(adapter.getPublicationLog().length, 1);
  });

  test('records and simulates local post publication', async () => {
    const adapter = new GbpAdapter();

    const result = await adapter.publishLocalPost(
      'accounts/123/locations/456',
      'Weekly update from your local dental clinic!',
      'https://apexdentalcare.pk'
    );

    assert.strictEqual(result.success, true);
    assert.strictEqual(adapter.getPublicationLog().length, 1);
  });
});
