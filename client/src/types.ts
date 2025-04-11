export interface UserStats {
  totalFaucetClaims: number;
  totalSwaps: number;
  completedQuests: number;
  totalQuests: number;
  proposalsVoted: number;
  proposalsCreated: number;
  points: number;
}

export interface User {
  id: number;
  address: string;
  totalSwaps: number;
  totalClaims: number;
  points: number;
  badges: string[];
  lastClaim: string | null;
}

export interface TokenInfo {
  id: number;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoColor: string;
}