// This interface must match the return type of the getUserStats function in storage.ts
export interface UserStats {
  totalFaucetClaims: number;
  totalSwaps: number;
  completedQuests: number;
  totalQuests: number;
  proposalsVoted: number;
  proposalsCreated: number;
  points: number;
  bonusPoints?: number;
  userRole?: string;
}

export interface User {
  id: number;
  address: string;
  totalSwaps: number;
  totalClaims: number;
  points: number;
  bonusPoints?: number;
  userRole?: string;
  lastClaim: string | null;
  badges?: string[];
}

export interface TokenInfo {
  id: number;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoColor: string;
}