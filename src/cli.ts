/**
 * Haven CLI Runner & Demo Suite
 * Demonstrates live execution across all 4 backend trigger modes.
 */

import { HavenDispatcher } from './core/dispatcher.ts';
import type {
  ReviewEventPayload,
  InquiryEventPayload,
  CronPostEventPayload,
  AuditEventPayload,
} from './types/index.ts';

async function main() {
  const dispatcher = new HavenDispatcher();
  const args = process.argv.slice(2);
  const mode = args[0] || 'demo';

  console.log(`=======================================================`);
  console.log(` HAVEN ENGINE: Zero-Cost Autonomous GBP & GEO Cluster`);
  console.log(`=======================================================\n`);

  if (mode === 'demo') {
    // 1. Positive Review Event
    console.log(`>>> [DEMO 1: 5-Star REVIEW_EVENT - Dental Clinic]`);
    const posReview: ReviewEventPayload = {
      eventId: 'evt_rev_001',
      eventType: 'REVIEW_EVENT',
      businessId: 'biz_dental_01',
      businessName: 'Apex Dental Care',
      businessCategory: 'Dental Clinic',
      targetLocation: 'DHA Lahore',
      timestamp: new Date().toISOString(),
      reviewerName: 'Farhan Tariq',
      starRating: 5,
      reviewText: 'Dr. Tariq was very gentle during my root canal treatment yesterday. Great clinic and clean environment!',
      targetKeywords: ['emergency dentist in Lahore', 'root canal specialist DHA'],
    };
    const res1 = await dispatcher.dispatch(posReview);
    console.log(JSON.stringify(res1, null, 2));
    console.log('\n-------------------------------------------------------\n');

    // 2. Negative Review Event (1-Star Complaint)
    console.log(`>>> [DEMO 2: 1-Star REVIEW_EVENT - Escalation & Safety Override]`);
    const negReview: ReviewEventPayload = {
      eventId: 'evt_rev_002',
      eventType: 'REVIEW_EVENT',
      businessId: 'biz_dental_01',
      businessName: 'Apex Dental Care',
      businessCategory: 'Dental Clinic',
      targetLocation: 'DHA Lahore',
      timestamp: new Date().toISOString(),
      reviewerName: 'Ayesha Malik',
      starRating: 1,
      reviewText: 'Waited over 45 minutes past my scheduled appointment time and the receptionist was dismissive.',
      phoneNumberForEscalation: '+92-300-1234567',
    };
    const res2 = await dispatcher.dispatch(negReview);
    console.log(JSON.stringify(res2, null, 2));
    console.log('\n-------------------------------------------------------\n');

    // 3. Weekly Cron Post Event
    console.log(`>>> [DEMO 3: CRON_POST_EVENT - 80-120 Words Local Anchored Post]`);
    const cronPost: CronPostEventPayload = {
      eventId: 'evt_cron_001',
      eventType: 'CRON_POST_EVENT',
      businessId: 'biz_hvac_01',
      businessName: 'PolarAir HVAC Solutions',
      businessCategory: 'HVAC Contractor',
      targetLocation: 'Gulberg Lahore',
      timestamp: new Date().toISOString(),
      neighborhoodOrLandmark: 'Main Boulevard Gulberg',
      serviceVector: 'Emergency AC Compressor & Inverter Repair',
      callToActionUrlOrPhone: 'Call +92-300-7654321 or visit polarair.pk',
      seasonalPromoOrUpdate: 'Summer heatwave prep and 24/7 technician dispatch',
    };
    const res3 = await dispatcher.dispatch(cronPost);
    console.log(JSON.stringify(res3, null, 2));
    console.log('\n-------------------------------------------------------\n');

    // 4. Inquiry / GEO Q&A Event
    console.log(`>>> [DEMO 4: INQUIRY_EVENT - Generative Engine Optimization (GEO)]`);
    const qnaEvent: InquiryEventPayload = {
      eventId: 'evt_qna_001',
      eventType: 'INQUIRY_EVENT',
      businessId: 'biz_dental_01',
      businessName: 'Apex Dental Care',
      businessCategory: 'Dental Clinic',
      targetLocation: 'DHA Lahore',
      timestamp: new Date().toISOString(),
      senderName: 'Usman Ghani',
      source: 'GBP_MESSAGING',
      customerQuestion: 'Do you offer same-day emergency dental appointments on weekends?',
      verifiedBusinessFacts: {
        'Emergency Service': 'Yes, dedicated on-call dentist available Saturday & Sunday',
        'Weekend Hours': '10:00 AM to 8:00 PM',
        'Address': 'Building 14, Commercial Broadway, DHA Phase 5, Lahore',
      },
    };
    const res4 = await dispatcher.dispatch(qnaEvent);
    console.log(JSON.stringify(res4, null, 2));
    console.log('\n-------------------------------------------------------\n');

    // 5. Competitor Audit & Profile Drift
    console.log(`>>> [DEMO 5: AUDIT_EVENT - Profile Guard & Competitor Spy]`);
    const auditEvent: AuditEventPayload = {
      eventId: 'evt_audit_001',
      eventType: 'AUDIT_EVENT',
      businessId: 'biz_dental_01',
      businessName: 'Apex Dental Care',
      businessCategory: 'Dental Clinic',
      targetLocation: 'DHA Lahore',
      timestamp: new Date().toISOString(),
      liveGbpSchema: {
        businessName: 'Apex Dental Care',
        primaryCategory: 'Dental Clinic',
        secondaryCategories: ['Cosmetic Dentist'],
        address: 'Building 14, Commercial Broadway, DHA Phase 5, Lahore',
        phone: '+92-300-9999999', // Malicious edit! Does not match master
        website: 'https://apexdentalcare.pk',
        regularHours: { Mon: '9am-8pm' },
        servicesList: ['Teeth Whitening', 'Root Canal', 'Botox Injections'], // Injected unauthorized service
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
          currentReviewsCount: 142,
          newReviewsThisWeek: 6,
          averageRating: 4.8,
          categories: ['Dental Clinic'],
        },
        {
          competitorName: 'Lahore Dental Associates',
          currentReviewsCount: 88,
          newReviewsThisWeek: 1,
          averageRating: 4.6,
          categories: ['Dentist'],
        },
      ],
    };
    const res5 = await dispatcher.dispatch(auditEvent);
    console.log(JSON.stringify(res5, null, 2));
    console.log('\n=======================================================\n');
  }
}

main().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
