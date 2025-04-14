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
        
        {/* Desktop Navigation - with accessibility improvements */}
        <nav className="hidden md:flex items-center space-x-6 text-[#A0AEC0] font-medium" aria-label="Main navigation">
          {navLinks.map(link => (
            <Link 
              key={link.path}
              href={link.path} 
              className={`px-3 py-2 rounded-md hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${location === link.path ? 'tab-active bg-gray-900 text-white' : ''}`}
              aria-current={location === link.path ? 'page' : undefined}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        
        {/* Standalone Wallet Button - with added accessibility */}
        <div className="hidden md:flex items-center">
          <StandaloneWalletButton
            onConnect={(newAddress) => {
              console.log("Connected to wallet:", newAddress);
              if (newAddress) copyToClipboard(newAddress);
            }}
            onDisconnect={() => {
              console.log("Wallet disconnected");
            }}
            showAddress={true}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
          />
        </div>
        
        {/* Mobile menu button - improved accessibility */}
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
          aria-expanded={isMobileMenuOpen}
          aria-label="Toggle main menu"
          aria-controls="mobile-menu"
        >
          <span className="sr-only">{isMobileMenuOpen ? 'Close main menu' : 'Open main menu'}</span>
          {/* Icon changes based on menu state */}
          {isMobileMenuOpen ? (
            <i className="fas fa-times text-xl" aria-hidden="true"></i>
          ) : (
            <i className="fas fa-bars text-xl" aria-hidden="true"></i>
          )}
        </button>
      </div>
      
      {/* Mobile Navigation Menu - improved accessibility */}
      <div 
        id="mobile-menu"
        className={`md:hidden w-full bg-[#111827] border-t border-[#2D3748] transform transition-transform duration-200 ease-in-out ${isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
        aria-hidden={!isMobileMenuOpen}
      >
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
          <nav className="flex flex-col space-y-4 py-4" aria-label="Mobile navigation">
            {navLinks.map(link => (
              <Link 
                key={link.path}
                href={link.path} 
                className={`${location === link.path ? 'text-white font-medium' : 'text-[#A0AEC0]'} hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={location === link.path ? 'page' : undefined}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="mt-4 px-3" aria-label="Wallet connection">
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
                className="w-full justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
