import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getBadgeInfo, getRarityText } from '@/lib/badges';

interface BadgeCardProps {
  badgeId: string;
  size?: 'small' | 'medium' | 'large';
  showRarity?: boolean;
  className?: string;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ 
  badgeId, 
  size = 'medium',
  showRarity = true,
  className = ''
}) => {
  const badgeInfo = getBadgeInfo(badgeId);
  const Icon = badgeInfo.icon;
  
  const sizeClasses = {
    small: 'p-2',
    medium: 'p-4',
    large: 'p-6',
  };
  
  const iconSizes = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-4xl',
  };
  
  return (
    <Card className={`bg-[#1E2A3B] border border-[#2D3748] ${className}`}>
      <CardContent className={`flex ${size === 'large' ? 'flex-col items-center text-center' : 'items-center space-x-4'} ${sizeClasses[size]}`}>
        <div 
          className={`rounded-full flex items-center justify-center ${size === 'large' ? 'w-16 h-16 mb-4' : 'w-10 h-10'}`} 
          style={{ backgroundColor: `${badgeInfo.color}25` }}
        >
          <Icon className={`${iconSizes[size]}`} style={{ color: badgeInfo.color }} />
        </div>
        <div className={size === 'large' ? 'mt-2' : ''}>
          <h4 className="font-bold">{badgeInfo.name}</h4>
          <p className="text-sm text-[#A0AEC0]">{badgeInfo.description}</p>
          {showRarity && (
            <Badge
              variant="outline"
              className="mt-2"
              style={{ 
                borderColor: badgeInfo.color,
                color: badgeInfo.color,
                backgroundColor: `${badgeInfo.color}15`
              }}
            >
              {getRarityText(badgeInfo.rarity)}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};