import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import NetworkBanner from "./NetworkBanner";
import WalletModal from "./WalletModal";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <NetworkBanner />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <WalletModal />
    </div>
  );
};

export default Layout;
