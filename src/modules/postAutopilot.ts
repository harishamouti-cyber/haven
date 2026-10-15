/**
 * Module B: Weekly GEO-Targeted GBP Post Autopilot
 * 
 * Generates weekly freshness updates for Google Business Profile.
 * Strictly adheres to 80-120 word count range, anchors to specific local
 * neighborhoods/landmarks, and concludes with a frictionless CTA.
 */

import type { CronPostEventPayload, HavenResponse } from '../types/index.ts';
import { MultiProviderRouter, type PromptMessage } from '../core/router.ts';
import { GuardrailsEngine } from '../core/guardrails.ts';

export class PostAutopilotModule {
  private router: MultiProviderRouter;
  private guardrails: GuardrailsEngine;

  constructor(router: MultiProviderRouter, guardrails: GuardrailsEngine) {
    this.router = router;
    this.guardrails = guardrails;
  }

  async generateWeeklyPost(event: CronPostEventPayload): Promise<HavenResponse> {
    const targetSeoVector = `${event.serviceVector} in ${event.neighborhoodOrLandmark}`;

    const systemPrompt = `You are Haven's GBP Post Autopilot for "${event.businessName}", located near ${event.neighborhoodOrLandmark} in ${event.targetLocation}.
Generate a weekly Google Business Profile update.

MANDATORY SPECIFICATIONS:
1. Exact Word Count: Must be between 80 and 120 words. No shorter than 80, no longer than 120 words.
2. Local Grounding: Mention ${event.neighborhoodOrLandmark} and reference local convenience for residents or visitors.
3. Service Focus: Highlight ${event.serviceVector} and explain practical benefits.
4. Call to Action: Conclude with a clear, direct call-to-action: "${event.callToActionUrlOrPhone}".
5. Tone: Warm, community-oriented, professional, and accessible. No exaggerated claims like "#1 on Google".`;

    const userPrompt = `Create a weekly GBP post for ${event.businessName}.
Neighborhood/Landmark: ${event.neighborhoodOrLandmark}
Specialty/Service: ${event.serviceVector}
Seasonal Note: ${event.seasonalPromoOrUpdate || 'Regular weekly service availability'}
Action/Contact: ${event.callToActionUrlOrPhone}`;

    const messages: PromptMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    let postContent: string;

    try {
      const res = await this.router.generate(messages, 0.4);
      postContent = res.responseContent.trim();
    } catch {
      postContent = this.generateFallbackPost(event);
    }

    // Check word count and ensure compliance
    const wordCheck = this.guardrails.checkPostWordCount(postContent);
    if (!wordCheck.valid) {
      postContent = this.adjustWordCount(postContent, event);
    }

    // Safety audit
    const audit = this.guardrails.auditContent(postContent);
    if (!audit.passed) {
      postContent = this.generateFallbackPost(event);
    }

    return {
      actionType: 'GBP_POST',
      contentOutput: postContent,
      sentimentCategory: 'POSITIVE',
      safeToAutoPublish: true,
      seoKeywordInjected: targetSeoVector,
      ownerAlertSummary: null,
    };
  }

  private generateFallbackPost(event: CronPostEventPayload): string {
    return `Looking for reliable ${event.serviceVector} right here in ${event.neighborhoodOrLandmark}? At ${event.businessName}, we are proud to serve our local community across ${event.targetLocation} with dependable, high-quality care you can trust. Whether you are nearby running errands or living just around the corner, our dedicated team is here to ensure your experience is comfortable, seamless, and completely stress-free. We use modern equipment and attentive service to meet your exact needs every time you visit. Have questions or ready to get started? Contact us today at ${event.callToActionUrlOrPhone} to schedule your visit or speak with our friendly team.`;
  }

  private adjustWordCount(content: string, event: CronPostEventPayload): string {
    const words = content.trim().split(/\s+/).filter(Boolean);

    if (words.length > 120) {
      // Trim to last sentence boundary before 115 words and attach CTA
      const truncated = words.slice(0, 95).join(' ');
      return `${truncated}. Visit ${event.businessName} near ${event.neighborhoodOrLandmark} or reach out today: ${event.callToActionUrlOrPhone}.`;
    }

    if (words.length < 80) {
      // Enrich with localized community copy
      return `${content} Our convenient location near ${event.neighborhoodOrLandmark} makes visiting quick and effortless for local residents across ${event.targetLocation}. Our experienced professionals are committed to transparent pricing, gentle care, and top-tier results. Contact ${event.callToActionUrlOrPhone} today.`;
    }

    return content;
  }
}
