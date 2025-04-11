/**
 * Formats a wallet address to show only the first 6 and last 4 characters
 * @param address The full wallet address
 * @returns Formatted address (e.g., "0x1234...5678")
 */
export function formatWalletAddress(address: string): string {
  if (!address || address.length < 10) return address;
  
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}