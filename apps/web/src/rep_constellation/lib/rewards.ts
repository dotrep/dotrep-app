import { db } from '../../../shared/db.js';
import { repConstellationSignal } from '../../../shared/schema.js';
import { eq, gte, and, sql } from 'drizzle-orm';

export interface UpsertSignalParams {
  wallet: string;
  repName?: string | null;
  seenAt: number;
}

export interface ActiveNode {
  wallet: string;
  name: string | null;
  xp: number;
  signalActive: boolean;
  beaconClaimed: boolean;
}

export async function upsertSignalRow(params: UpsertSignalParams): Promise<void> {
  const { wallet, repName, seenAt } = params;
  
  await db
    .insert(repConstellationSignal)
    .values({
      userWallet: wallet.toLowerCase(),
      repName: repName || null,
      xp: 0,
      signalActive: true,
      beaconClaimed: false,
      lastSeenMs: new Date(seenAt),
    })
    .onConflictDoUpdate({
      target: repConstellationSignal.userWallet,
      set: {
        repName: repName || sql`${repConstellationSignal.repName}`,
        signalActive: true,
        lastSeenMs: new Date(seenAt),
      },
    });
}

export async function listActiveNodes(nowMS: number): Promise<ActiveNode[]> {
  const timeout = nowMS - 10 * 60 * 1000; // active if seen in last 10 minutes
  
  const results = await db
    .select({
      wallet: repConstellationSignal.userWallet,
      name: repConstellationSignal.repName,
      xp: repConstellationSignal.xp,
      signalActive: repConstellationSignal.signalActive,
      beaconClaimed: repConstellationSignal.beaconClaimed,
    })
    .from(repConstellationSignal)
    .where(gte(repConstellationSignal.lastSeenMs, new Date(timeout)));
  
  return results;
}

export async function awardBeacon(wallet: string, amountXP: number): Promise<boolean> {
  const result = await db
    .update(repConstellationSignal)
    .set({
      xp: sql`${repConstellationSignal.xp} + ${amountXP}`,
      beaconClaimed: true,
    })
    .where(
      and(
        eq(repConstellationSignal.userWallet, wallet.toLowerCase()),
        eq(repConstellationSignal.beaconClaimed, false)
      )
    );
  
  return result.rowCount !== null && result.rowCount > 0;
}
