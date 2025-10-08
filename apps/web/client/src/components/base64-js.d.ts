// Type definitions for base64-js
declare module 'base64-js' {
  export function fromByteArray(uint8Array: Uint8Array): string;
  export function toByteArray(base64String: string): Uint8Array;
}