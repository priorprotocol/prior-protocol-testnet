export interface TokenInfo {
  id: number;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoColor: string;
  balance?: string;
}

export interface UserState {
  id?: number;
  address: string | null;
  lastClaim: Date | null;
}

export interface TokenBalance {
  symbol: string;
  balance: string;
}

export interface Proposal {
  id: number;
  title: string;
  description: string;
  status: string;
  endTime: string;
  yesVotes: number;
  noVotes: number;
}

export interface Quest {
  id: number;
  title: string;
  description: string;
  reward: number;
  difficulty: string;
  status: string;
  icon: string;
}

export interface UserQuest {
  id: number;
  userId: number;
  questId: number;
  status: string;
  completedAt: string | null;
}

export interface Vote {
  id: number;
  userId: number;
  proposalId: number;
  vote: string;
  votedAt: string;
}

export interface UserStats {
  totalFaucetClaims: number;
  totalSwaps: number;
  completedQuests: number;
  totalQuests: number;
  proposalsVoted: number;
  proposalsCreated: number;
}
