import { test, describe } from 'node:test';
import assert from 'node:assert';
import { HavenDispatcher } from '../src/core/dispatcher.ts';
import type { AuditEventPayload } from '../src/types/index.ts';

describe('Module D: Profile Guard & Competitor Spy', () => {
  const dispatcher = new HavenDispatcher();

  test('detects unauthorized schema edits and flags critical drift', async () => {
    const payload: AuditEventPayload = {
      eventId: 'evt_aud_01',
      eventType: 'AUDIT_EVENT',
      businessId: 'biz_01',
      businessName: 'Apex Dental Care',
      businessCategory: 'Dental Clinic',
      targetLocation: 'DHA Lahore',
      timestamp: new Date().toISOString(),
      liveGbpSchema: {
        businessName: 'Apex Dental Care',
        primaryCategory: 'Dental Clinic',
        secondaryCategories: ['Cosmetic Dentist'],
        address: 'Building 14, Commercial Broadway, DHA Phase 5, Lahore',
        phone: '+92-300-9999999', // Malicious hijacked phone
        website: 'https://apexdentalcare.pk',
        regularHours: { Mon: '9am-8pm' },
        servicesList: ['Teeth Whitening', 'Root Canal'],
      },
      approvedMasterSchema: {
        businessName: 'Apex Dental Care',
        primaryCategory: 'Dental Clinic',
        secondaryCategories: ['Cosmetic Dentist'],
        address: 'Building 14, Commercial Broadway, DHA Phase 5, Lahore',
        phone: '+92-300-1234567',
        website: 'https://apexdentalcare.pk',
        regularHours: { Mon: '9am-8pm' },
        servicesList: ['Teeth Whitening', 'Root Canal'],
      },
      competitors: [
        {
          competitorName: 'DHA Smile Studio',
          currentReviewsCount: 120,
          newReviewsThisWeek: 4,
          averageRating: 4.8,
          categories: ['Dental Clinic'],
        },
      ],
    };

    const res = await dispatcher.dispatch(payload);
    assert.strictEqual(res.actionType, 'COMPETITOR_AUDIT');
    assert.strictEqual(res.safeToAutoPublish, false);
    assert.ok(res.ownerAlertSummary?.includes('CRITICAL GBP DRIFT'));
    assert.ok(res.contentOutput.includes('ALERT: UNAUTHORIZED EDITS DETECTED'));
  });
});
