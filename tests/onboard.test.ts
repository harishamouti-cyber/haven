import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import { onboardClient } from '../src/cli/onboard.ts';
import type { ClientProfile } from '../src/core/multiTenant.ts';

describe('Client Onboarding Wizard', () => {
  const profile: ClientProfile = {
    businessId: 'test_client_onboard',
    businessName: 'GreenTree Landscaping',
    category: 'Landscaping Service',
    targetLocation: 'Model Town Lahore',
    phone: '+92-300-5551234',
    escalationPhone: '+92-300-5554321',
    website: 'https://greentreelandscaping.pk',
    neighborhoods: ['Model Town Block A', 'Model Town Circular Park'],
    targetKeywords: ['lawn maintenance Model Town', 'garden landscaping Lahore'],
    services: ['Lawn Care & Mowing', 'Tree Trimming'],
    operatingHours: { 'Mon-Sat': '8am-6pm' },
    masterSchema: {
      businessName: 'GreenTree Landscaping',
      primaryCategory: 'Landscaping Service',
      secondaryCategories: [],
      address: 'Model Town Block A',
      phone: '+92-300-5551234',
      website: 'https://greentreelandscaping.pk',
      regularHours: {},
      servicesList: ['Lawn Care', 'Tree Trimming'],
    },
  };

  test('provisions client profile to disk and pre-generates inaugural GBP post', async () => {
    const result = await onboardClient(profile);

    assert.strictEqual(result.success, true);
    assert.ok(result.savedPath.includes('test_client_onboard.json'));
    assert.ok(result.inauguralPost.length > 50);

    // Verify file written to disk
    const content = await fs.readFile(result.savedPath, 'utf-8');
    const parsed = JSON.parse(content);
    assert.strictEqual(parsed.businessName, 'GreenTree Landscaping');

    // Cleanup
    await fs.unlink(result.savedPath);
  });
});
