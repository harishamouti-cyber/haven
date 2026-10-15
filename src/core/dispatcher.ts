/**
 * Haven Core Event Dispatcher & Orchestration Pipeline
 * 
 * Ingests backend events, routes to specialized modules, passes output
 * through the guardrails layer, and guarantees strict JSON output schema conformity.
 */

import {
  type HavenEventPayload,
  type HavenResponse,
  validateHavenResponse,
} from '../types/index.ts';
import { MultiProviderRouter } from './router.ts';
import { GuardrailsEngine } from './guardrails.ts';
import { ReviewResponderModule } from '../modules/reviewResponder.ts';
import { PostAutopilotModule } from '../modules/postAutopilot.ts';
import { GeoSearchOptimizerModule } from '../modules/geoSearchOptimizer.ts';
import { ProfileGuardModule } from '../modules/profileGuard.ts';

export class HavenDispatcher {
  private router: MultiProviderRouter;
  private guardrails: GuardrailsEngine;
  private reviewModule: ReviewResponderModule;
  private postModule: PostAutopilotModule;
  private geoModule: GeoSearchOptimizerModule;
  private guardModule: ProfileGuardModule;

  constructor(router?: MultiProviderRouter, guardrails?: GuardrailsEngine) {
    this.router = router || new MultiProviderRouter();
    this.guardrails = guardrails || new GuardrailsEngine();
    this.reviewModule = new ReviewResponderModule(this.router, this.guardrails);
    this.postModule = new PostAutopilotModule(this.router, this.guardrails);
    this.geoModule = new GeoSearchOptimizerModule(this.router, this.guardrails);
    this.guardModule = new ProfileGuardModule();
  }

  async dispatch(event: Partial<HavenEventPayload>): Promise<HavenResponse> {
    // 1. Guardrail input validation (handles missing, corrupt, or spam data)
    const inputCheck = this.guardrails.validateIncomingEvent(event);
    if (!inputCheck.valid) {
      const response: HavenResponse = {
        actionType: 'ESCALATION',
        contentOutput: `STATUS: REQUIRES_HUMAN_REVIEW. ${inputCheck.reason || 'Invalid or corrupt incoming event data.'}`,
        sentimentCategory: inputCheck.isSpam ? 'SPAM' : 'NEUTRAL',
        safeToAutoPublish: false,
        seoKeywordInjected: null,
        ownerAlertSummary: `REQUIRES_HUMAN_REVIEW: Automated processing halted. ${inputCheck.reason || 'Corrupt or unverified event payload.'}`,
      };
      return this.finalizeAndValidate(response);
    }

    const payload = event as HavenEventPayload;
    let response: HavenResponse;

    switch (payload.eventType) {
      case 'REVIEW_EVENT': {
        const initial = await this.reviewModule.processReview(payload);
        response = this.guardrails.enforceRatingGuardrail(initial, payload.starRating);
        break;
      }

      case 'INQUIRY_EVENT': {
        response = await this.geoModule.optimizeQuestionAnswer(payload);
        break;
      }

      case 'CRON_POST_EVENT': {
        response = await this.postModule.generateWeeklyPost(payload);
        break;
      }

      case 'AUDIT_EVENT': {
        response = this.guardModule.processAudit(payload);
        break;
      }

      default: {
        response = {
          actionType: 'ESCALATION',
          contentOutput: `STATUS: REQUIRES_HUMAN_REVIEW. Unknown eventType "${(event as Record<string, unknown>).eventType}".`,
          sentimentCategory: 'NEUTRAL',
          safeToAutoPublish: false,
          seoKeywordInjected: null,
          ownerAlertSummary: 'REQUIRES_HUMAN_REVIEW: Unrecognized event trigger received.',
        };
      }
    }

    return this.finalizeAndValidate(response);
  }

  private finalizeAndValidate(response: HavenResponse): HavenResponse {
    const validation = validateHavenResponse(response);
    if (!validation.valid) {
      throw new Error(
        `HavenResponse schema contract violation: ${validation.errors.join('; ')}`
      );
    }
    return response;
  }
}
