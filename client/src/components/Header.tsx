import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useWallet } from "@/context/WalletContext";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  
  // Safely use the wallet context if available
  let address: string | null = null;
  let connectWallet: () => Promise<void> = async () => {
    console.log("Wallet provider not available");
  };
  
  try {
    const wallet = useWallet();
    address = wallet.address;
    connectWallet = wallet.connectWallet;
  } catch (error) {
    // If wallet context is not available, we'll use the defaults
  }
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Faucet", path: "/faucet" },
    { name: "Swap", path: "/swap" },
    { name: "Quest", path: "/quest" },
    { name: "Governance", path: "/governance" }
  ];
  
  const formatAddress = (address: string) => {
    return address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "Connect Wallet";
  };
  
  return (
    <header className="border-b border-[#2D3748] sticky top-0 bg-[#0B1118] z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
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
        
        {/* Connect Wallet Button */}
        <button 
          onClick={() => connectWallet()}
          className="hidden md:flex items-center rounded-full bg-[#1A5CFF] px-6 py-2 hover:bg-opacity-90 transition-all font-bold text-sm"
        >
          <span>{address ? formatAddress(address) : "Connect Wallet"}</span>
        </button>
        
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
            <button 
              onClick={() => {
                connectWallet();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center rounded-full bg-[#1A5CFF] px-6 py-3 hover:bg-opacity-90 transition-all font-bold text-sm mt-4"
            >
              <span>{address ? formatAddress(address) : "Connect Wallet"}</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
