// Separate file for signature verification to handle viem ESM imports
export async function verifyWalletSignature(
  message: string,
  signature: string,
  expectedAddress: string
): Promise<boolean> {
  try {
    // Dynamic import to handle ESM
    const { recoverMessageAddress } = await import('viem');
    
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    });
    
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}
