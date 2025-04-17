import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { getBadgeInfo } from '@/lib/badges';
import { FaCertificate } from 'react-icons/fa';
import nftImagePath from '@/assets/prior-pioneer-nft.jpg';

interface PioneerBadgeCardProps {
  className?: string;
}

export const PioneerBadgeCard: React.FC<PioneerBadgeCardProps> = ({ className = '' }) => {
  const badgeInfo = getBadgeInfo('prior_pioneer');
  
  return (
    <Card className={`bg-gradient-to-br from-[#111827] to-[#1A1F2E] border border-[#1A5CFF] ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="relative">
              {/* Prior Pioneer NFT image */}
              <div 
                className="w-32 h-32 rounded-lg border-2 border-[#1A5CFF] overflow-hidden"
              >
                <img 
                  src={nftImagePath} 
                  alt="Prior Pioneer NFT" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-3 -right-3 bg-[#1A5CFF] rounded-full p-2">
                <FaCertificate className="text-white text-2xl" />
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-white">Prior Pioneer NFT Badge</h3>
              <div className="bg-[#1A5CFF] bg-opacity-20 text-[#1A5CFF] px-2 py-0.5 rounded text-sm font-medium">
                Legendary
              </div>
            </div>
            
            <p className="text-[#A0AEC0] mb-4">
              {badgeInfo.description} As a holder, you are officially recognized as a PIONEER in the Prior Protocol ecosystem.
            </p>
            
            <div className="bg-[#1E2A3B] p-3 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#1A5CFF] bg-opacity-20">
                  <FaCertificate className="text-[#1A5CFF]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Special Benefits</p>
                  <p className="text-xs text-[#A0AEC0]">Vote on upgrades • Access exclusive pools • Unlock future rewards</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};