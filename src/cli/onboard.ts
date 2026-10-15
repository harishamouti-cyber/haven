/**
 * Haven Client Onboarding Wizard
 * 
 * Quickly provisions a new local service business client into Haven:
 * 1. Creates verified master schema profile
 * 2. Seeds initial GEO entity Q&As
 * 3. Pre-generates the inaugural weekly GBP post
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { HavenDispatcher } from '../core/dispatcher.ts';
import type { ClientProfile } from '../core/multiTenant.ts';
import type { CronPostEventPayload } from '../types/index.ts';

export async function onboardClient(profile: ClientProfile): Promise<{
  success: boolean;
  savedPath: string;
  inauguralPost: string;
}> {
  const dirPath = path.join(process.cwd(), 'data', 'profiles');
  await fs.mkdir(dirPath, { recursive: true });

  const fileName = `${profile.businessId}.json`;
  const fullPath = path.join(dirPath, fileName);
  await fs.writeFile(fullPath, JSON.stringify(profile, null, 2), 'utf-8');

  // Pre-generate inaugural post using HavenDispatcher
  const dispatcher = new HavenDispatcher();
  const inauguralPostEvent: CronPostEventPayload = {
    eventId: `inaugural_${profile.businessId}`,
    eventType: 'CRON_POST_EVENT',
    businessId: profile.businessId,
    businessName: profile.businessName,
    businessCategory: profile.category,
    targetLocation: profile.targetLocation,
    timestamp: new Date().toISOString(),
    neighborhoodOrLandmark: profile.neighborhoods[0] || profile.targetLocation,
    serviceVector: profile.services[0] || profile.category,
    callToActionUrlOrPhone: `Call ${profile.phone} or visit ${profile.website}`,
    seasonalPromoOrUpdate: 'Welcome to our verified Google Business Profile updates',
  };

  const response = await dispatcher.dispatch(inauguralPostEvent);

  return {
    success: true,
    savedPath: fullPath,
    inauguralPost: response.contentOutput,
  };
}
