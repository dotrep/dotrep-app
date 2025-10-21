import { verifyMessage, getAddress } from 'viem';

export async function verifyWalletSignature({
  address,
  message,
  signature,
}: {
  address: string;
  message: string;
  signature: `0x${string}`;
}) {
  const addr = getAddress(address); // checksum normalize
  const ok = await verifyMessage({
    address: addr,
    message,
    signature,
  });
  return { ok, address: addr };
}
