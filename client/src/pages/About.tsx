import React from 'react';
import { SiDiscord, SiMedium } from 'react-icons/si';
import { FaTwitter, FaBook, FaKey, FaIdBadge } from 'react-icons/fa';
import { FaImage } from 'react-icons/fa6';
// For direct asset imports
import nftImagePath from '@/assets/prior-pioneer-nft.jpg';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center mb-12">
          {/* Logo placeholder - will be replaced with new asset */}
          <div className="w-32 h-32 mb-6 flex items-center justify-center bg-gray-800 rounded-full">
            <FaImage className="text-[#00df9a] text-5xl" />
          </div>
          <h1 className="text-3xl font-bold mb-4">About Prior Protocol</h1>
          <p className="text-[#A0AEC0] text-center mb-8 max-w-2xl">
            Prior Protocol is a decentralized finance (DeFi) platform built on Base, 
            focusing on providing accessible financial products for everyone.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-[#1A202C] p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Our Mission</h2>
            <p className="text-[#A0AEC0]">
              Prior Protocol aims to democratize finance by providing accessible, 
              transparent, and efficient financial tools that empower users to 
              participate in the DeFi ecosystem without technical barriers.
            </p>
          </div>
          
          <div className="bg-[#1A202C] p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Technology</h2>
            <p className="text-[#A0AEC0]">
              Built on Base's Layer 2 solution, Prior Protocol leverages the
              security of Ethereum while offering faster and more affordable 
              transactions, creating a seamless experience for all users.
            </p>
          </div>
        </div>
        
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1A202C] p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-3">Swapping</h3>
              <p className="text-[#A0AEC0]">
                Exchange between various tokens with minimal fees and 
                slippage through our optimized swap protocol.
              </p>
            </div>
            
            <div className="bg-[#1A202C] p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-3">Governance</h3>
              <p className="text-[#A0AEC0]">
                Participate in decision-making by creating and voting on 
                proposals that shape the future of the protocol.
              </p>
            </div>
            
            <div className="bg-[#1A202C] p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-3">Quests</h3>
              <p className="text-[#A0AEC0]">
                Complete quests to earn rewards and achievements while 
                learning how to use various functions of the protocol.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Prior Pioneer NFT</h2>
          <div className="flex flex-col md:flex-row gap-8 items-center bg-[#1A202C] p-6 rounded-lg">
            <div className="md:w-1/3">
              {/* Prior Pioneer NFT image */}
              <div className="w-full max-w-[240px] h-[240px] mx-auto rounded-lg overflow-hidden">
                <img 
                  src={nftImagePath} 
                  alt="Prior Pioneer NFT" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center mt-4">
                <p className="text-xs text-[#A0AEC0]">Contract Address:</p>
                <p className="text-xs text-[#1A5CFF] break-all">0x2a45dfDbdCfcF72CBE835435eD54f4beE7d06D59</p>
              </div>
            </div>
            <div className="md:w-2/3">
              <p className="text-[#A0AEC0] mb-4">
                This exclusive NFT represents the fusion of AI and decentralized finance, embodying the future of intelligent, autonomous trading. 
                Powered by cutting-edge machine learning and blockchain technology, this digital asset grants access to PRIOR! 
                The Next-Gen protocol where DeFi meets AI-driven precision. Own a piece of innovation and be part of the evolution of smart, decentralized finance.
              </p>
              <p className="text-white font-medium mb-4">
                Prior NFTs aren't just ordinary PFPs: they're NFTs that have real utilities.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-start gap-2">
                  <FaKey className="text-[#1A5CFF] mt-1" />
                  <div>
                    <p className="text-white font-medium">Vote on upgrades</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FaKey className="text-[#1A5CFF] mt-1" />
                  <div>
                    <p className="text-white font-medium">Access exclusive pools</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FaKey className="text-[#1A5CFF] mt-1" />
                  <div>
                    <p className="text-white font-medium">Unlock future rewards</p>
                  </div>
                </div>
              </div>
              <p className="text-[#1A5CFF] font-medium mt-6 text-center md:text-left">
                Governance meets benefits. Holders are called PIONEERS.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Connect With Us</h2>
          <div className="flex flex-wrap justify-center gap-8">
            <a 
              href="https://x.com/priorprotocol" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#A0AEC0] hover:text-white transition-colors"
            >
              <FaTwitter className="text-xl" />
              <span>Twitter</span>
            </a>
            
            <a 
              href="https://discord.com/invite/priorprotocol" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#A0AEC0] hover:text-white transition-colors"
            >
              <SiDiscord className="text-xl" />
              <span>Discord</span>
            </a>
            
            <a 
              href="https://medium.com/@priorprotocol_12054" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#A0AEC0] hover:text-white transition-colors"
            >
              <SiMedium className="text-xl" />
              <span>Medium</span>
            </a>
            
            <a 
              href="https://priorprotocol.gitbook.io/whitepaper" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#A0AEC0] hover:text-white transition-colors"
            >
              <FaBook className="text-xl" />
              <span>Whitepaper</span>
            </a>
          </div>
        </div>
        
        <div className="border-t border-[#2D3748] pt-8">
          <h2 className="text-xl font-bold mb-4">Testnet Disclaimer</h2>
          <p className="text-[#A0AEC0] mb-4">
            This is a testnet version of Prior Protocol running on Base Sepolia. 
            The tokens used on this testnet do not have real-world value and are 
            for testing purposes only.
          </p>
          <p className="text-[#A0AEC0]">
            We encourage users to experiment with the platform, provide feedback, 
            and report any issues to help us improve the protocol before the mainnet launch.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;