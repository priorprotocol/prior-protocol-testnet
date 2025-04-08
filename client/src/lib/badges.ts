// Badge system for Prior Protocol testnet
import { FaWallet, FaCoins, FaExchangeAlt, FaVoteYea, FaBullhorn, FaTrophy, FaChartLine, FaUserCheck, FaCertificate } from 'react-icons/fa';

// Map badge IDs to proper display names, descriptions, and icons
export interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export const badges: Record<string, BadgeInfo> = {
  wallet_connected: {
    id: 'wallet_connected',
    name: 'Wallet Connected',
    description: 'Connected a wallet to the Prior Protocol testnet.',
    icon: FaWallet,
    color: '#4299E1', // blue
    rarity: 'common',
  },
  token_claimed: {
    id: 'token_claimed',
    name: 'Token Collector',
    description: 'Successfully claimed PRIOR tokens from the faucet.',
    icon: FaCoins,
    color: '#F6AD55', // orange
    rarity: 'common',
  },
  swap_completed: {
    id: 'swap_completed',
    name: 'First Swap',
    description: 'Completed your first token swap on Prior Protocol.',
    icon: FaExchangeAlt,
    color: '#68D391', // green
    rarity: 'uncommon',
  },
  governance_vote: {
    id: 'governance_vote',
    name: 'Governance Participant',
    description: 'Participated in protocol governance by voting on a proposal.',
    icon: FaVoteYea,
    color: '#B794F4', // purple
    rarity: 'uncommon',
  },
  active_voter: {
    id: 'active_voter',
    name: 'Active Voter',
    description: 'Voted on at least 5 different governance proposals.',
    icon: FaBullhorn,
    color: '#F687B3', // pink
    rarity: 'rare',
  },
  quest_completed: {
    id: 'quest_completed',
    name: 'Quest Completer',
    description: 'Successfully completed a protocol quest.',
    icon: FaTrophy,
    color: '#FC8181', // red
    rarity: 'uncommon',
  },
  all_quests: {
    id: 'all_quests',
    name: 'Quest Master',
    description: 'Completed all available quests in the protocol.',
    icon: FaChartLine,
    color: '#F6E05E', // yellow
    rarity: 'epic',
  },
  prior_pioneer: {
    id: 'prior_pioneer',
    name: 'Prior Pioneer',
    description: 'Owns an official Prior Pioneer NFT. As a PIONEER, you gain voting rights on protocol upgrades, exclusive access to liquidity pools, and future reward opportunities in the Prior Protocol ecosystem.',
    icon: FaCertificate,
    color: '#1A5CFF', // prior blue
    rarity: 'legendary',
  },
  early_adopter: {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'One of the first users to join the Prior Protocol testnet.',
    icon: FaUserCheck,
    color: '#9F7AEA', // indigo
    rarity: 'rare',
  },
};

// Get badge info by ID
export const getBadgeInfo = (badgeId: string): BadgeInfo => {
  return badges[badgeId] || {
    id: badgeId,
    name: badgeId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    description: 'A special achievement on Prior Protocol.',
    icon: FaTrophy,
    color: '#CBD5E0', // gray
    rarity: 'common',
  };
};

// Get rarity color
export const getRarityColor = (rarity: BadgeInfo['rarity']): string => {
  switch (rarity) {
    case 'common':
      return '#718096'; // gray
    case 'uncommon':
      return '#68D391'; // green
    case 'rare':
      return '#4299E1'; // blue
    case 'epic':
      return '#B794F4'; // purple
    case 'legendary':
      return '#F6AD55'; // orange
    default:
      return '#718096'; // gray
  }
};

// Get rarity text
export const getRarityText = (rarity: BadgeInfo['rarity']): string => {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
};