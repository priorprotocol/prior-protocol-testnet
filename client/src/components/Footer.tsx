import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="py-8 border-t border-[#2D3748]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <h2 className="text-xl font-space font-bold">
              <span className="text-[#1A5CFF]">Prior</span><span className="text-white">Protocol</span>
              <span className="text-xs ml-1 text-[#FF6B00] font-medium">TESTNET</span>
            </h2>
            <p className="text-[#A0AEC0] text-sm mt-2">
              Testing decentralized finance on Base Sepolia
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            <a 
              href="https://priorprotocol.gitbook.io/whitepaper" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#A0AEC0] hover:text-white transition-colors"
            >
              Whitepaper
            </a>
            <a 
              href="#" 
              className="text-[#A0AEC0] hover:text-white transition-colors"
            >
              Smart Contracts
            </a>
            <a 
              href="#" 
              className="text-[#A0AEC0] hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a 
              href="#" 
              className="text-[#A0AEC0] hover:text-white transition-colors"
            >
              Twitter
            </a>
            <a 
              href="#" 
              className="text-[#A0AEC0] hover:text-white transition-colors"
            >
              Discord
            </a>
          </div>
        </div>
        
        <div className="mt-8 text-center text-[#A0AEC0] text-sm">
          <p>© {new Date().getFullYear()} Prior Protocol. All rights reserved. This is a testnet version.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
