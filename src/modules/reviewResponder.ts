/**
 * Module A: Review Responder & SEO "Justification" Engine
 * 
 * Handles incoming Google Maps customer reviews.
 * Injects natural local service/location keywords on 4-5 star reviews to trigger
 * bolded review justifications in Google Local Pack search results.
 * Enforces strict empathetic, offline resolution protocols for <= 3 star reviews.
 */

import type { ReviewEventPayload, HavenResponse } from '../types/index.ts';
import { MultiProviderRouter, type PromptMessage } from '../core/router.ts';
import { GuardrailsEngine } from '../core/guardrails.ts';

export class ReviewResponderModule {
  private router: MultiProviderRouter;
  private guardrails: GuardrailsEngine;

  constructor(router: MultiProviderRouter, guardrails: GuardrailsEngine) {
    this.router = router;
    this.guardrails = guardrails;
  }

  async processReview(event: ReviewEventPayload): Promise<HavenResponse> {
    const starRating = event.starRating;
    const isPositive = starRating >= 4;

    // Pick target keyword if positive review
    const targetKeyword = isPositive && event.targetKeywords && event.targetKeywords.length > 0
      ? event.targetKeywords[0]
      : isPositive
      ? `${event.businessCategory.toLowerCase()} in ${event.targetLocation}`
      : null;

    const systemPrompt = `You are Haven's Review Responder & SEO Justification Engine for "${event.businessName}", a ${event.businessCategory} in ${event.targetLocation}.
Generate a publication-ready public response to the Google Maps customer review.

STRICT OPERATIONAL RULES:
${
  isPositive
    ? `1. Thank reviewer warmly by name (${event.reviewerName}).
2. Cite a specific detail/service they mentioned in their review text: "${event.reviewText}".
3. Seamlessly weave in exactly ONE natural target local keyword: "${targetKeyword}" to trigger Google review justifications. Never make it robotic.
4. Keep the response between 2 to 4 friendly, professional sentences.`
    : `1. Strict safety protocol: Do NOT inject any SEO keywords, hashtags, or marketing offers.
2. Tone must be deeply empathetic, calm, accountable, and courteous.
3. Sincerely apologize for their frustration regarding their experience.
4. Provide a direct, frictionless invitation to resolve this offline: call or message directly at ${event.phoneNumberForEscalation || 'our clinic/office direct line'} so management can make things right immediately.
5. Keep it concise, respectful, and private.`
}`;

    const userPrompt = `Reviewer: ${event.reviewerName}
Rating: ${starRating} Stars
Review Text: "${event.reviewText}"`;

    const messages: PromptMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    let replyText: string;

    try {
      const res = await this.router.generate(messages, 0.25);
      replyText = res.responseContent.trim();
    } catch {
      // Deterministic rule-based template fallback
      replyText = isPositive
        ? `Dear ${event.reviewerName}, thank you so much for your kind words! We are delighted that you had such a great experience with our team. Providing top-tier ${targetKeyword} is always our highest priority. We look forward to seeing you again at ${event.businessName}!`
        : `Dear ${event.reviewerName}, we sincerely apologize for falling short of your expectations during your recent visit. Your experience is very important to us, and we would appreciate the opportunity to discuss this directly and make it right. Please call us at ${event.phoneNumberForEscalation || 'our main office'} or message us directly so we can resolve this with you right away.`;
    }

    // Safety audit
    const audit = this.guardrails.auditContent(replyText);
    if (!audit.passed) {
      replyText = isPositive
        ? `Thank you so much, ${event.reviewerName}! We truly appreciate your feedback and are proud to serve our community with dedicated ${targetKeyword}. We look forward to welcoming you back!`
        : `Dear ${event.reviewerName}, thank you for bringing this to our attention. We are truly sorry for your experience. Please reach out to us directly at ${event.phoneNumberForEscalation || 'our office'} so we can address your concerns immediately.`;
    }

    if (isPositive) {
      return {
        actionType: 'REVIEW_REPLY',
        contentOutput: replyText,
        sentimentCategory: 'POSITIVE',
        safeToAutoPublish: true,
        seoKeywordInjected: targetKeyword,
        ownerAlertSummary: null,
      };
    } else {
      const sentimentCategory = 'COMPLAINT';
      const ownerAlertSummary = `URGENT CUSTOMER ESCALATION: ${event.reviewerName} posted a ${starRating}-star review for ${event.businessName}. Review: "${event.reviewText}". Drafted response ready for owner approval. Offline contact suggested.`;

      return {
        actionType: 'REVIEW_REPLY',
        contentOutput: replyText,
        sentimentCategory,
        safeToAutoPublish: false,
        seoKeywordInjected: null,
        ownerAlertSummary,
      };
    }
  }
}
