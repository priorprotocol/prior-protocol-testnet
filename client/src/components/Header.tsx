import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useWalletSync } from "@/hooks/useWalletSync";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import StandaloneWalletButton from "@/components/StandaloneWalletButton";
import { formatAddress } from "@/lib/formatAddress";
// Import the logo directly from attached_assets
import logoPath from "@assets/prior protocol logo.png";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  
  // Use both wallet systems during transition
  const { 
    copyToClipboard
  } = useWalletSync();
  
  // Use our standalone wallet hook for consistent wallet state
  const {
    address,
    isConnected
  } = useStandaloneWallet();
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Faucet", path: "/faucet" },
    { name: "Swap", path: "/swap" },
    { name: "Quest", path: "/quest" },
    { name: "Governance", path: "/governance" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "About", path: "/about" }
  ];
  
  // We can remove this since we're using the imported formatAddress function
  
  
  return (
    <header className="border-b border-[#2D3748] sticky top-0 bg-[#0B1118] z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src={logoPath} 
            alt="Prior Protocol Logo" 
            className="w-10 h-10 mr-2"
          />
          <h1 className="text-2xl font-space font-bold">
            <span className="text-[#1A5CFF]">Prior</span><span className="text-white">Protocol</span>
            <span className="text-xs ml-1 text-[#FF6B00] font-medium">TESTNET</span>
          </h1>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-[#A0AEC0] font-medium">
          {navLinks.map(link => (
            <Link 
              key={link.path}
              href={link.path} 
              className={`hover:text-white transition-colors ${location === link.path ? 'tab-active' : ''}`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        
        {/* Standalone Wallet Button */}
        <div className="hidden md:block">
          <StandaloneWalletButton
            onConnect={(newAddress) => {
              console.log("Connected to wallet:", newAddress);
              if (newAddress) copyToClipboard(newAddress);
            }}
            onDisconnect={() => {
              console.log("Wallet disconnected");
            }}
            showAddress={true}
          />
        </div>
        
        {/* Mobile menu button */}
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden text-white focus:outline-none"
        >
          <i className="fas fa-bars text-xl"></i>
        </button>
      </div>
      
      {/* Mobile Navigation Menu */}
      <div className={`md:hidden w-full bg-[#111827] border-t border-[#2D3748] ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center py-3 mb-2 border-b border-gray-700">
            <img 
              src={logoPath} 
              alt="Prior Protocol Logo" 
              className="w-8 h-8 mr-2" 
            />
            <h2 className="text-xl font-bold">
              <span className="text-[#1A5CFF]">Prior</span><span className="text-white">Protocol</span>
              <span className="text-xs ml-1 text-[#FF6B00] font-medium">TESTNET</span>
            </h2>
          </div>
          <nav className="flex flex-col space-y-4 py-4">
            {navLinks.map(link => (
              <Link 
                key={link.path}
                href={link.path} 
                className={`${location === link.path ? 'text-white' : 'text-[#A0AEC0]'} hover:text-white transition-colors py-2`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="mt-4">
              <StandaloneWalletButton 
                onConnect={() => {
                  // Close the mobile menu after connecting
                  setIsMobileMenuOpen(false);
                }}
                onDisconnect={() => {
                  // Close the mobile menu after disconnecting
                  setIsMobileMenuOpen(false);
                }}
                size="lg"
                className="w-full justify-center"
              />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
