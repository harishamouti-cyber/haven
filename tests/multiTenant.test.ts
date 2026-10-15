import { test, describe } from 'node:test';
import assert from 'node:assert';
import { MultiTenantAgencyManager, type ClientProfile } from '../src/core/multiTenant.ts';

describe('MultiTenantAgencyManager', () => {
  const manager = new MultiTenantAgencyManager();

  const client1: ClientProfile = {
    businessId: 'biz_01',
    businessName: 'Apex Dental Care',
    category: 'Dental Clinic',
    targetLocation: 'DHA Lahore',
    phone: '+92-300-1234567',
    escalationPhone: '+92-300-7654321',
    website: 'https://apexdentalcare.pk',
    neighborhoods: ['DHA Phase 5'],
    targetKeywords: ['emergency dentist in Lahore'],
    services: ['Emergency Dental Pain Relief'],
    operatingHours: { 'Mon-Fri': '9am-9pm' },
    masterSchema: {
      businessName: 'Apex Dental Care',
      primaryCategory: 'Dental Clinic',
      secondaryCategories: [],
      address: 'Phase 5 DHA',
      phone: '+92-300-1234567',
      website: 'https://apexdentalcare.pk',
      regularHours: {},
      servicesList: ['Teeth Whitening'],
    },
  };

  const client2: ClientProfile = {
    businessId: 'biz_02',
    businessName: 'PolarAir HVAC',
    category: 'HVAC Contractor',
    targetLocation: 'Gulberg Lahore',
    phone: '+92-300-8881234',
    escalationPhone: '+92-300-9994321',
    website: 'https://polarair.pk',
    neighborhoods: ['Main Boulevard Gulberg'],
    targetKeywords: ['HVAC repair in Gulberg'],
    services: ['Emergency AC Compressor Repair'],
    operatingHours: { 'Mon-Sun': '24/7' },
    masterSchema: {
      businessName: 'PolarAir HVAC',
      primaryCategory: 'HVAC Contractor',
      secondaryCategories: [],
      address: 'Gulberg 3',
      phone: '+92-300-8881234',
      website: 'https://polarair.pk',
      regularHours: {},
      servicesList: ['AC Repair'],
    },
  };

  test('registers and manages multiple agency clients', () => {
    manager.registerClient(client1);
    manager.registerClient(client2);

    assert.strictEqual(manager.getAllClients().length, 2);
    assert.strictEqual(manager.getClient('biz_01')?.businessName, 'Apex Dental Care');
  });

  test('executes weekly post generation batch across all agency clients', async () => {
    const summary = await manager.runWeeklyPostBatch();

    assert.strictEqual(summary.totalClients, 2);
    assert.strictEqual(summary.successfulExecutions, 2);
    assert.strictEqual(summary.failedExecutions, 0);
    assert.strictEqual(summary.results.length, 2);
    assert.strictEqual(summary.results[0].actionType, 'GBP_POST');
    assert.strictEqual(summary.results[0].safeToAutoPublish, true);
  });

  test('executes competitor audit batch across all agency clients', async () => {
    const summary = await manager.runAuditBatch();

    assert.strictEqual(summary.totalClients, 2);
    assert.strictEqual(summary.successfulExecutions, 2);
    assert.strictEqual(summary.results[0].actionType, 'COMPETITOR_AUDIT');
  });
});
