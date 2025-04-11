/**
 * Formats an Ethereum address for display by shortening it (e.g. 0x1234...5678)
 * @param address The full Ethereum address
 * @param prefixLength Number of characters to show at the beginning (default: 6)
 * @param suffixLength Number of characters to show at the end (default: 4)
 * @returns Formatted address string
 */
export function formatAddress(address: string, prefixLength = 6, suffixLength = 4): string {
  if (!address) return '';
  if (address.length < prefixLength + suffixLength + 3) return address;
  
  return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
}