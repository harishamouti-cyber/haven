# Haven Core Reasoning, Execution & Operations Engine

> Autonomous Google Business Profile (GBP), Local SEO, Reputation, and GEO (Generative Engine Optimization) Agent startup designed for local service businesses (dental clinics, medical practices, home contractors, and retail shops).
> Operates on a strict **$0/month infrastructure budget**.

---

## 0. Zero-Cost Infrastructure & Cluster Architecture

Haven utilizes a multi-provider unthrottled LLM cluster running on permanent free tiers:
1. **Z.ai (Zhipu AI)**: Permanent free tier with `glm-4.7-flash` (unlimited monthly tokens, high concurrency).
2. **Groq Cloud**: High-speed Llama & Qwen models (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `qwen-2.5-32b`) using model ID rotation to avoid rate limits.
3. **Mistral La Plateforme**: Experiment tier (`mistral-small-latest`).
4. **Router**: Round-robin load distribution with instant zero-latency failover (`maxRetries: 0`) and deterministic local sandbox fallback.
5. **Database**: Supabase PostgreSQL free tier (`src/db/schema.sql`).
6. **Background Queues**: Inngest / Trigger.dev serverless webhook dispatch (`src/queue/inngestHandler.ts`).
7. **Alerting**: $0 WhatsApp (CallMeBot / Twilio Free Sandbox) & Slack webhooks.

---

## 1. Trigger Modes & Modules

| Event Type | Module | Purpose | Safe to Auto-Publish? |
|---|---|---|---|
| `REVIEW_EVENT` (4-5★) | Module A | Warm thank-you, references review detail, weaves in 1 local SEO keyword for Google review justifications | `true` |
| `REVIEW_EVENT` (1-3★) | Module A | Empathetic apology, invites offline resolution, blocks keywords, generates urgent WhatsApp/Slack owner alert | `false` |
| `CRON_POST_EVENT` | Module B | Weekly GBP freshness update (strictly 80-120 words), anchored to neighborhood/landmark, frictionless CTA | `true` |
| `INQUIRY_EVENT` | Module C | Generative Engine Optimization (GEO) direct factual entity answers for ChatGPT Search, Perplexity & AI Overviews | `true` |
| `AUDIT_EVENT` | Module D | Profile Guard (detects unauthorized phone/address/service drift against master records) + Competitor Map Spy | `false` |
| Missing / Spam / Corrupt | Guardrails | Halts execution, returns `REQUIRES_HUMAN_REVIEW` with `actionType: ESCALATION` | `false` |

---

## 2. Multi-Tenant Agency & Reporting Suite

- **Agency Multi-Tenant Manager** (`src/core/multiTenant.ts`): Orchestrates parallel weekly post generation and schema audits across hundreds of business locations.
- **Client Onboarding Wizard** (`src/cli/onboard.ts`): Provisions a new local business profile and pre-generates the inaugural post in under 60 seconds.
- **Executive Report Generator** (`src/reports/clientReport.ts`): Formats client-ready HTML and Markdown performance reports detailing review velocity, SEO justifications triggered, and competitor shifts.

---

## 3. Required JSON Output Contract

Every Haven action strictly conforms to this schema:
```json
{
  "actionType": "REVIEW_REPLY | GBP_POST | QEA_SEEDING | ESCALATION | COMPETITOR_AUDIT",
  "contentOutput": "The exact publication-ready text.",
  "sentimentCategory": "POSITIVE | NEUTRAL | COMPLAINT | SPAM",
  "safeToAutoPublish": boolean,
  "seoKeywordInjected": "string or null",
  "ownerAlertSummary": "string or null (mandatory if safeToAutoPublish is false)"
}
```

---

## 4. Quickstart & Verification

```bash
# Run complete test suite (25 tests across 13 test suites)
npm test

# Run demo suite across all 4 event types
npm run demo

# Start Webhook API Server & Business Owner Dashboard at http://localhost:3000
npm run serve
```
