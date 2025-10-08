import { db } from '../db';
import { rewardEvents } from '../../shared/schema';
import rewardsConfig from '../config/rewardsConfig';
import { randomUUID } from 'crypto';

// Log a reward event for UI feedback (additive only - doesn't change XP math)
export async function logRewardEvent(
  userId: number,
  amount: number,
  reasonKey: string,
  customTxnId?: string
) {
  try {
    // Only log if rewards UI is enabled
    if (!rewardsConfig.enabled) {
      return null;
    }

    // Validate reasonKey
    if (!rewardsConfig.reasonKeys[reasonKey]) {
      console.warn(`Unknown reward reason key: ${reasonKey}`);
    }

    const txnId = customTxnId || `${reasonKey}_${userId}_${Date.now()}_${randomUUID().slice(0, 8)}`;

    // Insert reward event (unique constraint on txnId prevents duplicates)
    const result = await db
      .insert(rewardEvents)
      .values({
        userId,
        amount,
        reasonKey,
        txnId,
      })
      .returning()
      .catch((error) => {
        // If duplicate txnId, just return null (already logged)
        if (error.code === '23505') { // PostgreSQL unique violation
          console.log(`Reward event already logged: ${txnId}`);
          return null;
        }
        throw error;
      });

    if (result && result.length > 0) {
      console.log(`Reward event logged: ${amount} XP for ${reasonKey} (user ${userId})`);
      return {
        ...result[0],
        friendlyReason: rewardsConfig.getFriendlyReason(reasonKey)
      };
    }

    return null;
  } catch (error) {
    console.error('Error logging reward event:', error);
    return null;
  }
}

export default logRewardEvent;