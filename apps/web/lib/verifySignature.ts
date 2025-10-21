// Separate file for signature verification to handle viem imports
import { recoverMessageAddress } from 'viem';

export async function verifyWalletSignature(
  message: string,
  signature: string,
  expectedAddress: string
): Promise<boolean> {
  try {
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    });
    
    console.log('[VERIFY] Message:', message);
    console.log('[VERIFY] Signature:', signature);
    console.log('[VERIFY] Expected address:', expectedAddress);
    console.log('[VERIFY] Recovered address:', recoveredAddress);
    
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('[VERIFY] Signature verification failed:', error);
    return false;
  }
}
