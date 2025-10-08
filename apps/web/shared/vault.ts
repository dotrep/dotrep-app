/**
 * FSN Vault - Crypto-native storage system
 * 
 * This module provides a secure storage vault that uses the FSN name
 * as the universal pseudonym for accessing encrypted data, signed messages,
 * and other cryptographic assets.
 */

import { z } from "zod";

// Vault item types
export enum VaultItemType {
  SIGNED_MESSAGE = "signed_message",
  PRIVATE_KEY_SHARD = "private_key_shard",
  KEY_ROTATION_LOG = "key_rotation_log",
  MULTISIG_CONFIG = "multisig_config",
  APPROVAL = "approval",
}

// Validation schemas for vault items
export const signedMessageSchema = z.object({
  type: z.literal(VaultItemType.SIGNED_MESSAGE),
  message: z.string(),
  signature: z.string(),
  timestamp: z.number(),
  description: z.string().optional(),
});

export const privateKeyShardSchema = z.object({
  type: z.literal(VaultItemType.PRIVATE_KEY_SHARD),
  shardIndex: z.number(),
  totalShards: z.number(),
  encryptedData: z.string(),
  threshold: z.number(),
  algorithm: z.string(),
  timestamp: z.number(),
});

export const keyRotationLogSchema = z.object({
  type: z.literal(VaultItemType.KEY_ROTATION_LOG),
  previousKeyId: z.string(),
  newKeyId: z.string(),
  reason: z.string().optional(),
  timestamp: z.number(),
  approvals: z.array(z.string()).optional(),
});

export const multisigConfigSchema = z.object({
  type: z.literal(VaultItemType.MULTISIG_CONFIG),
  name: z.string(),
  participants: z.array(z.string()),
  threshold: z.number(),
  configuration: z.record(z.string()).optional(),
  timestamp: z.number(),
});

export const approvalSchema = z.object({
  type: z.literal(VaultItemType.APPROVAL),
  transactionId: z.string(),
  approver: z.string(),
  signature: z.string(),
  timestamp: z.number(),
  expiration: z.number().optional(),
  notes: z.string().optional(),
});

// Union type for all vault items
export const vaultItemSchema = z.discriminatedUnion("type", [
  signedMessageSchema,
  privateKeyShardSchema,
  keyRotationLogSchema,
  multisigConfigSchema,
  approvalSchema,
]);

// Type definitions
export type SignedMessage = z.infer<typeof signedMessageSchema>;
export type PrivateKeyShard = z.infer<typeof privateKeyShardSchema>;
export type KeyRotationLog = z.infer<typeof keyRotationLogSchema>;
export type MultisigConfig = z.infer<typeof multisigConfigSchema>;
export type Approval = z.infer<typeof approvalSchema>;
export type VaultItem = z.infer<typeof vaultItemSchema>;

// Database schema for the vault table
export const vaultTableSchema = z.object({
  id: z.number(),
  userId: z.number(),
  fsnName: z.string(),
  itemId: z.string(),
  itemType: z.nativeEnum(VaultItemType),
  data: z.string(), // Encrypted JSON data
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
});

export type VaultRecord = z.infer<typeof vaultTableSchema>;