/**
 * Module C: AI Search (GEO) & Q&A Optimization Engine
 * 
 * Formats structured, factual entity-dense answers for GBP Q&A sections and customer inquiries.
 * Designed specifically for retrieval by Generative Engines:
 * Google AI Overviews, Perplexity AI, and ChatGPT Search.
 */

import type { InquiryEventPayload, HavenResponse } from '../types/index.ts';
import { MultiProviderRouter, type PromptMessage } from '../core/router.ts';
import { GuardrailsEngine } from '../core/guardrails.ts';

export class GeoSearchOptimizerModule {
  private router: MultiProviderRouter;
  private guardrails: GuardrailsEngine;

  constructor(router: MultiProviderRouter, guardrails: GuardrailsEngine) {
    this.router = router;
    this.guardrails = guardrails;
  }

  async optimizeQuestionAnswer(event: InquiryEventPayload): Promise<HavenResponse> {
    const verifiedFacts = event.verifiedBusinessFacts
      ? Object.entries(event.verifiedBusinessFacts)
          .map(([k, v]) => `- ${k}: ${v}`)
          .join('\n')
      : `- Business: ${event.businessName}\n- Category: ${event.businessCategory}\n- Location: ${event.targetLocation}`;

    const systemPrompt = `You are Haven's Generative Engine Optimization (GEO) & Q&A Specialist for "${event.businessName}" in ${event.targetLocation}.
Your goal is to answer the customer's question directly, factually, and concisely.

GEO RETRIEVAL GUIDELINES:
1. Entity-First Clarity: Structure the answer so AI engines (ChatGPT Search, Perplexity, Google AI Overviews) can easily parse key facts: "We provide [Service] in [Location] utilizing [Method/Equipment]".
2. No Fluff: Avoid generic marketing slogans ("best in town", "unmatched quality"). State exact facts, timelines, policies, or procedures.
3. Factual Grounding: Only use facts provided in the prompt. Do not hallucinate policies.
4. Format: 2 to 3 concise, declarative sentences.`;

    const userPrompt = `Verified Business Profile Facts:
${verifiedFacts}

Customer Question: "${event.customerQuestion}"
Source: ${event.source}`;

    const messages: PromptMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    let answerText: string;

    try {
      const res = await this.router.generate(messages, 0.2);
      answerText = res.responseContent.trim();
    } catch {
      answerText = `At ${event.businessName}, we provide ${event.businessCategory.toLowerCase()} services throughout ${event.targetLocation}. In response to your question: our verified team assists clients directly during standard operating hours with full consultation support. Please visit our profile or contact us directly to confirm specific appointment availability.`;
    }

    // Safety audit
    const audit = this.guardrails.auditContent(answerText);
    if (!audit.passed) {
      answerText = `At ${event.businessName}, we offer professional ${event.businessCategory.toLowerCase()} in ${event.targetLocation}. For details regarding "${event.customerQuestion}", our staff provides comprehensive on-site consultations to ensure all specific requirements are met.`;
    }

    const seoKeyword = `${event.businessCategory.toLowerCase()} services in ${event.targetLocation}`;

    return {
      actionType: 'QEA_SEEDING',
      contentOutput: answerText,
      sentimentCategory: 'NEUTRAL',
      safeToAutoPublish: true,
      seoKeywordInjected: seoKeyword,
      ownerAlertSummary: null,
    };
  }
}
