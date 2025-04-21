import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useWalletSync } from "@/hooks/useWalletSync";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import StandaloneWalletButton from "@/components/StandaloneWalletButton";
import { formatAddress } from "@/lib/formatAddress";
// Import the logo
import logoPath from "../assets/prior-protocol-logo.png";

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
    { name: "NFT STAKE", path: "https://priornftstake.xyz/", external: true },
    { name: "Admin", path: "/admin" },
    { name: "Docs", path: "/docs" },
    { name: "About", path: "/about" }
  ];
  
  // We can remove this since we're using the imported formatAddress function
  
  
  return (
    <header className="border-b border-[#2D3748] sticky top-0 bg-[#0B1118] z-40">
      {/* Background overlay - shows when menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-40"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}
      
      <div className="container mx-auto px-2 md:px-4 py-3 md:py-4">
        <div className="flex flex-wrap items-center justify-between">
          {/* Logo */}
          <div className="flex items-center shrink-0 mr-2">
            <img 
              src={logoPath} 
              alt="Prior Protocol Logo" 
              className="w-8 h-8 md:w-10 md:h-10 mr-2"
            />
            <h1 className="text-xl md:text-2xl font-space font-bold">
              <span className="text-[#1A5CFF]">Prior</span><span className="text-white">Protocol</span>
              <span className="text-xs ml-1 text-[#FF6B00] font-medium">TESTNET</span>
            </h1>
          </div>
          
          {/* Mobile menu button - improved accessibility */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors ml-auto"
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
          
          {/* Desktop Navigation - with accessibility improvements */}
          <div className="hidden md:block flex-grow max-w-4xl mx-auto px-4">
            <nav className="flex justify-center" aria-label="Main navigation">
              <ul className="flex items-center justify-center space-x-4 text-[#A0AEC0] font-medium">
                {navLinks.map(link => (
                  <li key={link.path}>
                    {link.external ? (
                      <a 
                        href={link.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-3 py-2 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors whitespace-nowrap"
                      >
                        {link.name} <i className="fas fa-external-link-alt text-xs ml-1" aria-hidden="true"></i>
                      </a>
                    ) : (
                      <Link 
                        href={link.path} 
                        className={`block px-3 py-2 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors whitespace-nowrap relative ${location === link.path ? 'text-white font-medium' : ''}`}
                        aria-current={location === link.path ? 'page' : undefined}
                      >
                        {link.name}
                        {location === link.path && (
                          <div className="absolute h-0.5 bg-[#1A5CFF] bottom-0 left-0 right-0"></div>
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          
          {/* Standalone Wallet Button - with added accessibility */}
          <div className="hidden md:flex items-center shrink-0">
            <StandaloneWalletButton
              onConnect={(newAddress) => {
                console.log("Connected to wallet:", newAddress);
                // Removed auto-copying of address to clipboard
              }}
              onDisconnect={() => {
                console.log("Wallet disconnected");
              }}
              showAddress={true}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Menu - slides in from right */}
      <div 
        id="mobile-menu"
        className={`md:hidden fixed top-0 right-0 h-full w-4/5 max-w-sm bg-[#111827] border-l border-[#2D3748] shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between py-3 px-4 border-b border-gray-700">
            <div className="flex items-center">
              <img 
                src={logoPath} 
                alt="Prior Protocol Logo" 
                className="w-7 h-7 mr-2" 
              />
              <h2 className="text-lg font-bold">
                <span className="text-[#1A5CFF]">Prior</span><span className="text-white">Protocol</span>
                <span className="text-xs ml-1 text-[#FF6B00] font-medium">TESTNET</span>
              </h2>
            </div>
            <button 
              onClick={toggleMobileMenu}
              className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 rounded-md"
              aria-label="Close menu"
            >
              <i className="fas fa-times text-xl" aria-hidden="true"></i>
            </button>
          </div>
          
          <nav className="flex flex-col py-4 px-5 flex-grow" aria-label="Mobile navigation">
            <ul className="space-y-1.5">
              {navLinks.map(link => (
                <li key={link.path}>
                  {link.external ? (
                    <a 
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#A0AEC0] hover:text-white transition-colors py-2.5 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name} 
                      <i className="fas fa-external-link-alt text-xs ml-1.5" aria-hidden="true"></i>
                    </a>
                  ) : (
                    <Link 
                      href={link.path} 
                      className={`${location === link.path ? 'text-white font-medium bg-gray-800' : 'text-[#A0AEC0]'} hover:text-white transition-colors py-2.5 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={location === link.path ? 'page' : undefined}
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="px-6 py-4 border-t border-gray-700 mt-auto" aria-label="Wallet connection">
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
        </div>
      </div>
    </header>
  );
};

export default Header;
