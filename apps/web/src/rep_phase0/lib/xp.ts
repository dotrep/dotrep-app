import { db } from '../../../db/client.js';
import { repPhase0Missions, repPhase0Progress, repPhase0Heartbeat } from '../../../shared/schema.js';
import { PHASE0_MISSIONS } from '../constants/missions.js';
import { eq, and, gte, sql } from 'drizzle-orm';

export function now() {
  return new Date();
}

export async function seedMissions() {
  for (const mission of PHASE0_MISSIONS) {
    await db
      .insert(repPhase0Missions)
      .values({
        slug: mission.slug,
        title: mission.title,
        description: mission.description,
        xp: mission.xp,
      })
      .onConflictDoNothing();
  }
}

export async function setProgress(
  user: string,
  mission: string,
  status: 'available' | 'completed',
  meta?: any
) {
  const metaStr = meta ? JSON.stringify(meta) : null;
  
  await db
    .insert(repPhase0Progress)
    .values({
      userWallet: user.toLowerCase(),
      missionSlug: mission,
      status,
      updatedAt: now(),
      meta: metaStr,
    })
    .onConflictDoUpdate({
      target: [repPhase0Progress.userWallet, repPhase0Progress.missionSlug],
      set: {
        status,
        updatedAt: now(),
        meta: metaStr,
      },
    });
}

export async function getUserState(user: string) {
  const userLower = user.toLowerCase();
  
  const missions = await db
    .select()
    .from(repPhase0Missions);

  const progress = await db
    .select()
    .from(repPhase0Progress)
    .where(eq(repPhase0Progress.userWallet, userLower));

  const pMap = new Map(progress.map(p => [p.missionSlug, p]));
  
  // Get heartbeat data for "go-live" mission
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fromISO = sevenDaysAgo.toISOString().split('T')[0];
  const loginDays = await countHeartbeatDays(userLower, fromISO);
  
  // Check if go-live should be auto-completed and persist it
  const goLiveProgress = pMap.get('go-live');
  if (loginDays >= 3 && goLiveProgress?.status !== 'completed') {
    await setProgress(userLower, 'go-live', 'completed', { loginDays, target: 3 });
    // Refresh progress map
    const updatedProgress = await db
      .select()
      .from(repPhase0Progress)
      .where(eq(repPhase0Progress.userWallet, userLower));
    pMap.clear();
    updatedProgress.forEach(p => pMap.set(p.missionSlug, p));
  }
  
  const computed = missions.map(m => {
    const p = pMap.get(m.slug);
    const missionDef = PHASE0_MISSIONS.find(md => md.slug === m.slug);
    
    let calculatedStatus = p?.status ?? 'available';
    let meta = p?.meta ? JSON.parse(p.meta) : null;
    
    // Special handling for "go-live" mission - show real progress
    if (m.slug === 'go-live') {
      meta = { loginDays, target: 3 };
    }
    
    if (!p && missionDef?.gatedBy) {
      const gatesMet = missionDef.gatedBy.every(gate => {
        const gateProgress = pMap.get(gate);
        return gateProgress?.status === 'completed';
      });
      calculatedStatus = gatesMet ? 'available' : 'locked';
    }
    
    return {
      slug: m.slug,
      title: m.title,
      description: m.description,
      xp: m.xp,
      status: calculatedStatus,
      updatedAt: p?.updatedAt ?? null,
      meta,
      gatedBy: missionDef?.gatedBy ?? [],
    };
  });

  const totalXP = computed
    .filter(c => c.status === 'completed')
    .reduce((sum, c) => sum + (c.xp || 0), 0);

  return { missions: computed, totalXP };
}

export async function recordHeartbeat(user: string, dayISO: string) {
  await db
    .insert(repPhase0Heartbeat)
    .values({
      userWallet: user.toLowerCase(),
      day: dayISO,
      createdAt: now(),
    })
    .onConflictDoNothing();
}

export async function countHeartbeatDays(user: string, fromISO: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(repPhase0Heartbeat)
    .where(
      and(
        eq(repPhase0Heartbeat.userWallet, user.toLowerCase()),
        gte(repPhase0Heartbeat.day, fromISO)
      )
    );

  return Number(result[0]?.count ?? 0);
}
