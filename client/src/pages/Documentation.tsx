import React from 'react';
import { Link } from 'wouter';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  FaInfoCircle, 
  FaExternalLinkAlt, 
  FaExchangeAlt, 
  FaFaucet, 
  FaVoteYea, 
  FaUserShield,
  FaClock,
  FaCoins,
  FaUsers
} from 'react-icons/fa';

const Documentation = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8 border-b pb-4 border-[#1A5CFF]/20">
        Prior Protocol Testnet Documentation
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar with quick links */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="bg-[#0D1321] border-[#1A5CFF]/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#getting-started" className="text-[#1A5CFF] hover:text-[#3F7DFF] transition-colors">
                      Getting Started
                    </a>
                  </li>
                  <li>
                    <a href="#wallet-setup" className="text-[#1A5CFF] hover:text-[#3F7DFF] transition-colors">
                      Wallet Setup
                    </a>
                  </li>
                  <li>
                    <a href="#faucet" className="text-[#1A5CFF] hover:text-[#3F7DFF] transition-colors">
                      Using the Faucet
                    </a>
                  </li>
                  <li>
                    <a href="#swap" className="text-[#1A5CFF] hover:text-[#3F7DFF] transition-colors">
                      Token Swapping
                    </a>
                  </li>
                  <li>
                    <a href="#governance" className="text-[#1A5CFF] hover:text-[#3F7DFF] transition-colors">
                      Governance
                    </a>
                  </li>
                  <li>
                    <a href="#nft" className="text-[#1A5CFF] hover:text-[#3F7DFF] transition-colors">
                      NFT Staking
                    </a>
                  </li>
                  <li>
                    <a href="#points" className="text-[#1A5CFF] hover:text-[#3F7DFF] transition-colors">
                      Points System
                    </a>
                  </li>
                  <li>
                    <a href="#troubleshooting" className="text-[#1A5CFF] hover:text-[#3F7DFF] transition-colors">
                      Troubleshooting
                    </a>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Getting Started Section */}
          <Card className="bg-[#0D1321] border-[#1A5CFF]/20" id="getting-started">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-lg">
                  <FaInfoCircle className="text-white" />
                </span>
                Getting Started with Prior Protocol Testnet
              </h2>
              
              <p className="text-gray-300 mb-4">
                Prior Protocol is building a comprehensive DeFi platform on Base, designed to provide a streamlined
                experience for both new and experienced users. This testnet allows you to experiment with the
                protocol's features in a risk-free environment.
              </p>
              
              <div className="border-l-4 border-blue-600 pl-4 py-1 mb-6">
                <p className="text-blue-300 font-medium">
                  The testnet provides a hands-on experience with the protocol's key features, including token swapping,
                  liquidity provisioning, governance voting, and the innovative points system.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#1A1F2E] p-5 rounded-lg border border-blue-900/40 flex items-start">
                  <div className="mr-3 bg-blue-900/40 rounded-full p-2">
                    <FaFaucet className="text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Faucet</h4>
                    <p className="text-gray-300 text-sm">Claim test PRIOR tokens every 24 hours to use across the protocol</p>
                  </div>
                </div>
                
                <div className="bg-[#1A1F2E] p-5 rounded-lg border border-blue-900/40 flex items-start">
                  <div className="mr-3 bg-blue-900/40 rounded-full p-2">
                    <FaExchangeAlt className="text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Swap</h4>
                    <p className="text-gray-300 text-sm">Exchange PRIOR for other testnet tokens with competitive rates</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#1A1F2E] p-5 rounded-lg border border-[#1A5CFF]/20 mb-4">
                <h3 className="text-lg font-medium text-white mb-3">Requirements</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-blue-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-400 text-xs">1</span>
                    </div>
                    <div>
                      <span className="text-white">MetaMask or another Web3 wallet</span>
                      <p className="text-xs text-gray-400 mt-0.5">Install MetaMask from the <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">official website</a></p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-blue-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-400 text-xs">2</span>
                    </div>
                    <div>
                      <span className="text-white">Base Sepolia testnet configured in your wallet</span>
                      <p className="text-xs text-gray-400 mt-0.5">See the Wallet Setup section below for configuration steps</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-blue-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-400 text-xs">3</span>
                    </div>
                    <div>
                      <span className="text-white">Small amount of Base Sepolia ETH for gas fees</span>
                      <p className="text-xs text-gray-400 mt-0.5">Available from official faucets listed in the Wallet Setup section</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <Alert className="mb-4 bg-gradient-to-r from-amber-900/25 to-orange-900/25 border border-amber-600/30">
                <FaInfoCircle className="h-4 w-4 text-amber-400" />
                <AlertTitle className="text-amber-300 font-medium">Important Note</AlertTitle>
                <AlertDescription className="text-gray-300">
                  This testnet is for experimental purposes only. Tokens have no real value, but your participation will earn you points that may be 
                  converted to PRIOR tokens at the Token Generation Event (TGE).
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-center mt-6">
                <Link to="/faucet">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white mr-3">
                    Get Started with Faucet
                  </Button>
                </Link>
                <a href="#wallet-setup">
                  <Button variant="outline" className="border-blue-800 text-blue-400 hover:bg-blue-900/20">
                    Set Up Wallet First
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Setup Section */}
          <Card className="bg-[#0D1321] border-[#1A5CFF]/20" id="wallet-setup">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Wallet Setup
              </h2>
              <p className="text-gray-300 mb-4">
                To interact with the Prior Protocol testnet, you'll need to configure your wallet to connect to the Base Sepolia testnet.
              </p>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="metamask">
                  <AccordionTrigger className="text-white hover:text-[#1A5CFF]">
                    Setting up MetaMask for Base Sepolia
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300">
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Open your MetaMask wallet</li>
                      <li>Click on the network dropdown at the top of the extension</li>
                      <li>Select "Add Network"</li>
                      <li>Click "Add a network manually"</li>
                      <li>Enter the following details:
                        <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                          <li><strong>Network Name:</strong> Base Sepolia</li>
                          <li><strong>RPC URL:</strong> https://sepolia.base.org</li>
                          <li><strong>Chain ID:</strong> 84532</li>
                          <li><strong>Currency Symbol:</strong> ETH</li>
                          <li><strong>Block Explorer URL:</strong> https://sepolia.basescan.org</li>
                        </ul>
                      </li>
                      <li>Click "Save"</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="eth">
                  <AccordionTrigger className="text-white hover:text-[#1A5CFF]">
                    Getting Base Sepolia ETH
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300">
                    <p className="mb-3">
                      You'll need a small amount of Base Sepolia ETH to pay for transaction fees.
                      You can obtain it from one of these faucets:
                    </p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>
                        <a 
                          href="https://www.coinbase.com/faucets/base-sepolia-faucet" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#1A5CFF] hover:underline"
                        >
                          Coinbase Base Sepolia Faucet
                        </a>
                      </li>
                      <li>
                        <a 
                          href="https://sepolia-faucet.pk910.de/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#1A5CFF] hover:underline"
                        >
                          Base Sepolia PoW Faucet
                        </a>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Using the Faucet Section */}
          <Card className="bg-[#0D1321] border-[#1A5CFF]/20" id="faucet">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 p-1.5 rounded-lg">
                  <FaFaucet className="text-white" />
                </span>
                Using the Prior Token Faucet
              </h2>
              
              <Alert className="mb-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30">
                <FaInfoCircle className="h-4 w-4 text-blue-400" />
                <AlertTitle className="text-blue-300 font-medium">Points Update Notice</AlertTitle>
                <AlertDescription className="text-gray-300">
                  Under the simplified points system, faucet claims no longer earn points. Points are now exclusively earned through swap transactions.
                </AlertDescription>
              </Alert>
              
              <p className="text-gray-300 mb-4">
                The Prior Protocol faucet allows you to claim testnet PRIOR tokens once every 24 hours.
                These tokens provide the foundation for interacting with the protocol's various features, particularly the swap functionality.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-4 rounded-lg border border-indigo-900/40">
                  <h4 className="font-medium text-indigo-300 mb-2">Faucet Purpose</h4>
                  <p className="text-gray-300 text-sm">
                    The Prior Protocol faucet provides free testnet tokens that serve as your entry point into the ecosystem. 
                    While faucet claims don't earn points, they give you the tokens needed to perform swaps that do earn points.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 p-4 rounded-lg border border-blue-900/40">
                  <h4 className="font-medium text-blue-300 mb-2">Faucet Limits</h4>
                  <p className="text-gray-300 text-sm">
                    To ensure fair distribution of testnet tokens, each wallet address can only claim 1 PRIOR token every 24 hours.
                    Make sure to use your claimed tokens effectively for testing swap functionality.
                  </p>
                </div>
              </div>
              
              <div className="bg-[#1A1F2E] p-5 rounded-lg border border-[#1A5CFF]/20 mb-4">
                <h3 className="text-xl font-medium text-white mb-3 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center mr-3">
                    <FaFaucet className="text-indigo-400" />
                  </div>
                  How to Claim PRIOR Tokens
                </h3>
                <ol className="space-y-4 text-gray-300 mt-4">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-indigo-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-indigo-400 text-xs">1</span>
                    </div>
                    <div>
                      <span className="text-white">Navigate to the Faucet page</span>
                      <p className="text-xs text-gray-400 mt-0.5">Click "Faucet" in the main navigation menu</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-indigo-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-indigo-400 text-xs">2</span>
                    </div>
                    <div>
                      <span className="text-white">Connect your wallet</span>
                      <p className="text-xs text-gray-400 mt-0.5">Click "Connect Wallet" if you haven't already connected</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-indigo-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-indigo-400 text-xs">3</span>
                    </div>
                    <div>
                      <span className="text-white">Click the "Claim PRIOR Tokens" button</span>
                      <p className="text-xs text-gray-400 mt-0.5">If 24 hours haven't passed since your last claim, the button will be disabled</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-indigo-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-indigo-400 text-xs">4</span>
                    </div>
                    <div>
                      <span className="text-white">Confirm the transaction in your wallet</span>
                      <p className="text-xs text-gray-400 mt-0.5">The MetaMask (or other wallet) popup will appear, asking you to confirm</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-indigo-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-indigo-400 text-xs">5</span>
                    </div>
                    <div>
                      <span className="text-white">Receive 1 PRIOR token</span>
                      <p className="text-xs text-gray-400 mt-0.5">Once the transaction is processed, 1 PRIOR token will be added to your wallet</p>
                    </div>
                  </li>
                </ol>
              </div>
              
              <div className="flex justify-center mt-6">
                <Link to="/faucet">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                    Go to Faucet
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Token Swapping Section */}
          <Card className="bg-[#0D1321] border-[#1A5CFF]/20" id="swap">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 p-1.5 rounded-lg">
                  <FaExchangeAlt className="text-white" />
                </span>
                Token Swapping
              </h2>
              
              <Alert className="mb-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-600/30">
                <FaInfoCircle className="h-4 w-4 text-green-400" />
                <AlertTitle className="text-green-300 font-medium">Points Earning Activity</AlertTitle>
                <AlertDescription className="text-gray-300">
                  Swapping tokens and NFT staking are the two ways to earn points in the Prior Protocol testnet. Each swap earns 0.5 points, with a maximum of 5 swaps (2.5 points) daily.
                </AlertDescription>
              </Alert>
              
              <p className="text-gray-300 mb-4">
                The Prior Protocol swap interface allows you to exchange between PRIOR and various testnet tokens 
                like USDC, USDT, and WETH. The swap functionality is the core feature of the protocol and the primary 
                focus of our testnet.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 p-4 rounded-lg border border-green-900/40">
                  <h4 className="font-medium text-green-300 mb-2">Exchange Rate</h4>
                  <p className="text-gray-300 text-sm">
                    The exchange rate is set to 1 PRIOR = 2 USDC, with proper handling of decimal differences between tokens.
                    All swap pairs use a standardized 0.5% fee to simulate real-world trading conditions.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 p-4 rounded-lg border border-green-900/40">
                  <h4 className="font-medium text-green-300 mb-2">Points Earning</h4>
                  <p className="text-gray-300 text-sm">
                    Both token swaps and NFT staking earn points in the current system. Each swap earns 0.5 points, with a 
                    maximum of 5 swaps (2.5 points) counted per day. You can also stake your Prior Pioneer NFT to earn additional points.
                  </p>
                </div>
              </div>
              
              <div className="bg-[#1A1F2E] p-5 rounded-lg border border-[#1A5CFF]/20 mb-6">
                <h3 className="text-xl font-medium text-white mb-3 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center mr-3">
                    <FaExchangeAlt className="text-green-400" />
                  </div>
                  How to Swap Tokens
                </h3>
                <ol className="space-y-4 text-gray-300 mt-4">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-green-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-400 text-xs">1</span>
                    </div>
                    <div>
                      <span className="text-white">Navigate to the Swap page</span>
                      <p className="text-xs text-gray-400 mt-0.5">Click "Swap" in the main navigation menu</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-green-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-400 text-xs">2</span>
                    </div>
                    <div>
                      <span className="text-white">Connect your wallet</span>
                      <p className="text-xs text-gray-400 mt-0.5">Click "Connect Wallet" if you haven't already connected</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-green-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-400 text-xs">3</span>
                    </div>
                    <div>
                      <span className="text-white">Select tokens and enter amount</span>
                      <p className="text-xs text-gray-400 mt-0.5">Choose the tokens you want to swap between and enter the amount</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-green-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-400 text-xs">4</span>
                    </div>
                    <div>
                      <span className="text-white">Approve token usage (first time only)</span>
                      <p className="text-xs text-gray-400 mt-0.5">For the first swap with a particular token, you'll need to approve the smart contract to use your tokens</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-green-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-400 text-xs">5</span>
                    </div>
                    <div>
                      <span className="text-white">Execute the swap</span>
                      <p className="text-xs text-gray-400 mt-0.5">Click "Swap" and confirm the transaction in your wallet</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-green-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-green-400 text-xs">6</span>
                    </div>
                    <div>
                      <span className="text-white">Earn points</span>
                      <p className="text-xs text-gray-400 mt-0.5">Each successful swap earns you 0.5 points (up to 5 swaps daily)</p>
                    </div>
                  </li>
                </ol>
              </div>
              
              <div className="overflow-x-auto mb-6">
                <Table>
                  <TableCaption>Available token pairs for swapping</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Token Pair</TableHead>
                      <TableHead className="text-white">Exchange Rate</TableHead>
                      <TableHead className="text-white">Swap Fee</TableHead>
                      <TableHead className="text-white">Contract Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <span className="bg-blue-900/40 text-blue-300 text-xs px-2 py-0.5 rounded mr-2">PRIOR/USDC</span>
                        </div>
                      </TableCell>
                      <TableCell>1 PRIOR = 2 USDC</TableCell>
                      <TableCell>0.5%</TableCell>
                      <TableCell className="text-xs text-gray-400">0x8957e1988905311EE249e679a29fc9deCEd4D910</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <span className="bg-blue-900/40 text-blue-300 text-xs px-2 py-0.5 rounded mr-2">PRIOR/USDT</span>
                        </div>
                      </TableCell>
                      <TableCell>1 PRIOR = 2 USDT</TableCell>
                      <TableCell>0.5%</TableCell>
                      <TableCell className="text-xs text-gray-400">Coming soon</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <span className="bg-blue-900/40 text-blue-300 text-xs px-2 py-0.5 rounded mr-2">PRIOR/WETH</span>
                        </div>
                      </TableCell>
                      <TableCell>Coming soon</TableCell>
                      <TableCell>0.5%</TableCell>
                      <TableCell className="text-xs text-gray-400">Coming soon</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <div className="bg-[#1E293B] p-4 rounded-lg mb-4">
                <h4 className="text-lg font-medium text-white mb-2 flex items-center">
                  <FaInfoCircle className="text-green-400 mr-2" />
                  Points System Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div className="bg-green-900/20 p-3 rounded-lg border border-green-900/40 text-center">
                    <div className="text-3xl font-bold text-green-400">0.5</div>
                    <div className="text-xs text-gray-300 mt-1">Points per swap</div>
                  </div>
                  <div className="bg-green-900/20 p-3 rounded-lg border border-green-900/40 text-center">
                    <div className="text-3xl font-bold text-green-400">5</div>
                    <div className="text-xs text-gray-300 mt-1">Max swaps per day</div>
                  </div>
                  <div className="bg-green-900/20 p-3 rounded-lg border border-green-900/40 text-center">
                    <div className="text-3xl font-bold text-green-400">2.5</div>
                    <div className="text-xs text-gray-300 mt-1">Max daily points</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-6">
                <Link to="/swap">
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                    Go to Swap
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Governance Section */}
          <Card className="bg-[#0D1321] border-[#1A5CFF]/20" id="governance">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-600 to-violet-600 p-1.5 rounded-lg">
                  <FaVoteYea className="text-white" />
                </span>
                Governance
              </h2>
              
              <Alert className="mb-4 bg-gradient-to-r from-gray-900/40 to-slate-900/40 border border-gray-500/30">
                <FaInfoCircle className="h-4 w-4 text-gray-400" />
                <AlertTitle className="text-gray-300 font-medium">Points System Update</AlertTitle>
                <AlertDescription className="text-gray-300">
                  Governance participation no longer earns points under the simplified points system. However, we still encourage testing the governance features for a complete testnet experience.
                </AlertDescription>
              </Alert>
              
              <p className="text-gray-300 mb-4">
                Prior Protocol implements a governance system that allows PRIOR token holders to vote on
                protocol upgrades and changes. This testnet provides a way to experiment with the protocol's governance features.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-purple-900/20 to-violet-900/20 p-4 rounded-lg border border-purple-900/40">
                  <h4 className="font-medium text-purple-300 mb-2">What is Governance?</h4>
                  <p className="text-gray-300 text-sm">
                    Governance allows token holders to have a voice in the protocol's future development and parameter changes.
                    It's a critical component of decentralized protocols, ensuring community control.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-900/20 to-violet-900/20 p-4 rounded-lg border border-purple-900/40">
                  <h4 className="font-medium text-purple-300 mb-2">Testnet Governance</h4>
                  <p className="text-gray-300 text-sm">
                    In the testnet environment, you can experience the voting process on pre-created proposals.
                    While voting no longer earns points, it provides valuable insight into a core DeFi protocol feature.
                  </p>
                </div>
              </div>
              
              <div className="bg-[#1A1F2E] p-5 rounded-lg border border-[#1A5CFF]/20 mb-6">
                <h3 className="text-xl font-medium text-white mb-3 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center mr-3">
                    <FaVoteYea className="text-purple-400" />
                  </div>
                  How to Participate in Governance
                </h3>
                <ol className="space-y-4 text-gray-300 mt-4">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-purple-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-purple-400 text-xs">1</span>
                    </div>
                    <div>
                      <span className="text-white">Navigate to the Governance page</span>
                      <p className="text-xs text-gray-400 mt-0.5">Click "Governance" in the main navigation menu</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-purple-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-purple-400 text-xs">2</span>
                    </div>
                    <div>
                      <span className="text-white">Connect your wallet</span>
                      <p className="text-xs text-gray-400 mt-0.5">Click "Connect Wallet" if you haven't already connected</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-purple-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-purple-400 text-xs">3</span>
                    </div>
                    <div>
                      <span className="text-white">Browse active proposals</span>
                      <p className="text-xs text-gray-400 mt-0.5">Review the list of active governance proposals</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-purple-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-purple-400 text-xs">4</span>
                    </div>
                    <div>
                      <span className="text-white">View proposal details</span>
                      <p className="text-xs text-gray-400 mt-0.5">Click on a proposal to see its full details, current voting status, and timeline</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-purple-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-purple-400 text-xs">5</span>
                    </div>
                    <div>
                      <span className="text-white">Cast your vote</span>
                      <p className="text-xs text-gray-400 mt-0.5">Select "Yes" or "No" and submit your vote</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-purple-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-purple-400 text-xs">6</span>
                    </div>
                    <div>
                      <span className="text-white">Confirm transaction</span>
                      <p className="text-xs text-gray-400 mt-0.5">Approve the transaction in your wallet to record your vote on-chain</p>
                    </div>
                  </li>
                </ol>
              </div>
              
              <div className="bg-[#1E293B] p-4 rounded-lg">
                <h4 className="text-lg font-medium text-white mb-2 flex items-center">
                  <FaInfoCircle className="text-purple-400 mr-2" />
                  Coming Soon
                </h4>
                <p className="text-gray-300">
                  Enhanced governance features are under development for future releases:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-300">
                  <li>Proposal creation by community members</li>
                  <li>Delegation of voting power</li>
                  <li>Governance forums for discussion</li>
                  <li>Enhanced voting analytics</li>
                </ul>
              </div>
              
              <div className="flex justify-center mt-6">
                <Link to="/governance">
                  <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white">
                    Go to Governance
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* NFT Staking Section */}
          <Card className="bg-[#0D1321] border-[#1A5CFF]/20" id="nft">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 p-1.5 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                NFT Staking
              </h2>
              
              <Alert className="mb-4 bg-gradient-to-r from-orange-900/40 to-amber-900/40 border border-amber-500/30">
                <FaInfoCircle className="h-4 w-4 text-amber-400" />
                <AlertTitle className="text-amber-300 font-medium">Points Earning Activity</AlertTitle>
                <AlertDescription className="text-gray-300">
                  NFT staking is one of the two ways to earn points in the Prior Protocol testnet, along with token swapping. Staking your Prior Pioneer NFT provides additional points in the protocol ecosystem.
                </AlertDescription>
              </Alert>
              
              <p className="text-gray-300 mb-4">
                Prior Protocol features NFT staking functionality, allowing you to stake your Prior Pioneer NFT.
                This feature demonstrates how NFTs can be integrated into DeFi protocols beyond just being 
                collectibles.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-orange-900/20 to-amber-900/20 p-4 rounded-lg border border-orange-900/40">
                  <h4 className="font-medium text-orange-300 mb-2">Prior Pioneer NFT</h4>
                  <p className="text-gray-300 text-sm">
                    The Prior Pioneer NFT is a special non-fungible token that represents your early participation 
                    in the Prior Protocol ecosystem. It has a unique design and serves as proof of your testnet contribution.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-900/20 to-amber-900/20 p-4 rounded-lg border border-orange-900/40">
                  <h4 className="font-medium text-orange-300 mb-2">NFT Staking</h4>
                  <p className="text-gray-300 text-sm">
                    NFT staking allows you to lock up your NFT in a smart contract to potentially earn rewards.
                    This feature is available on the original testnet site, accessible via the "NFT STAKE" link.
                  </p>
                </div>
              </div>
              
              <div className="bg-[#1A1F2E] p-5 rounded-lg border border-[#1A5CFF]/20 mb-4">
                <h3 className="text-xl font-medium text-white mb-3 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-orange-900/50 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  How to Stake Your NFT
                </h3>
                <ol className="space-y-4 text-gray-300 mt-4">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-orange-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-orange-400 text-xs">1</span>
                    </div>
                    <div>
                      <span className="text-white">Go to the NFT staking site</span>
                      <p className="text-xs text-gray-400 mt-0.5">Click "NFT STAKE" in the main navigation menu to be redirected</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-orange-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-orange-400 text-xs">2</span>
                    </div>
                    <div>
                      <span className="text-white">Connect your wallet</span>
                      <p className="text-xs text-gray-400 mt-0.5">Ensure your wallet is connected to the Base Sepolia testnet</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-orange-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-orange-400 text-xs">3</span>
                    </div>
                    <div>
                      <span className="text-white">Select your Prior Pioneer NFT</span>
                      <p className="text-xs text-gray-400 mt-0.5">Choose the NFT you want to stake from your wallet</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-orange-900/40 flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-orange-400 text-xs">4</span>
                    </div>
                    <div>
                      <span className="text-white">Approve and stake</span>
                      <p className="text-xs text-gray-400 mt-0.5">Confirm the transaction in your wallet to complete the staking process</p>
                    </div>
                  </li>
                </ol>
              </div>
              
              <div className="bg-[#1E293B] p-4 rounded-lg mb-4">
                <h4 className="text-base font-medium text-white mb-2 flex items-center">
                  <FaInfoCircle className="text-orange-400 mr-2" />
                  Prior Pioneer NFT Contract
                </h4>
                <div className="bg-slate-900/50 p-3 rounded text-xs text-gray-400 font-mono mt-2 break-all">
                  0x2a45dfDbdCfcF72CBE835435eD54f4beE7d06D59
                </div>
                <p className="text-sm text-gray-300 mt-3">
                  The NFT staking feature is available on the original testnet site. As one of two ways to earn points 
                  in the Prior Protocol ecosystem, staking your NFT provides additional benefits and rewards.
                </p>
              </div>
              
              <div className="flex justify-center mt-6">
                <a href="https://priornftstake.xyz/" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center gap-2">
                    Go to NFT Staking
                    <FaExternalLinkAlt size={12} />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Points System Section */}
          <Card className="bg-[#0D1321] border-[#1A5CFF]/20" id="points">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="bg-gradient-to-r from-amber-400 to-yellow-500 p-1.5 rounded">
                  <FaUserShield className="text-black" />
                </span>
                Points System
              </h2>
              
              <Alert className="mb-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30">
                <FaInfoCircle className="h-4 w-4 text-blue-400" />
                <AlertTitle className="text-blue-300 font-medium">Points System Update</AlertTitle>
                <AlertDescription className="text-gray-300">
                  The Prior Protocol testnet awards points for both swap transactions (0.5 points per swap, max 5 swaps daily) 
                  and NFT staking. Points earned will be used to determine token allocations at the Token Generation Event (TGE).
                </AlertDescription>
              </Alert>
              
              <p className="text-gray-300 mb-4">
                Active participation in the Prior Protocol testnet is tracked through our points system. 
                The system rewards users for engaging with key protocol features, which is why both 
                swap transactions and NFT staking earn points in the ecosystem.
              </p>
              
              <div className="space-y-6">
                <div className="bg-[#1A1F2E] p-5 rounded-lg border border-[#1A5CFF]/20">
                  <h3 className="text-xl font-medium text-white mb-3 flex items-center">
                    <FaExchangeAlt className="text-indigo-400 mr-2" />
                    Current Points Structure
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableCaption>Testnet activities and their point rewards</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-white">Activity</TableHead>
                          <TableHead className="text-white">Points Earned</TableHead>
                          <TableHead className="text-white">Daily Limit</TableHead>
                          <TableHead className="text-white">Max Daily Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <FaExchangeAlt className="text-indigo-400 mr-2" />
                              Token Swap
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-900/30 text-blue-200 border-blue-700">
                              0.5 points per swap
                            </Badge>
                          </TableCell>
                          <TableCell>5 swaps</TableCell>
                          <TableCell className="font-bold text-amber-400">2.5 points</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <FaFaucet className="text-gray-400 mr-2" />
                              Faucet Claim
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-gray-800/60 text-gray-400 border-gray-700">
                              0 points
                            </Badge>
                          </TableCell>
                          <TableCell>1 claim</TableCell>
                          <TableCell className="font-bold text-gray-400">0 points</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <FaVoteYea className="text-gray-400 mr-2" />
                              Governance Vote
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-gray-800/60 text-gray-400 border-gray-700">
                              0 points
                            </Badge>
                          </TableCell>
                          <TableCell>No limit</TableCell>
                          <TableCell className="font-bold text-gray-400">0 points</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 p-4 rounded-lg border border-blue-900/40">
                    <h4 className="font-medium text-blue-300 mb-2">Two Ways to Earn Points</h4>
                    <p className="text-gray-300 text-sm">
                      The Prior Protocol points system rewards users for engaging with two key aspects of the ecosystem:
                      token swapping (which stress-tests liquidity and price discovery) and NFT staking (which
                      demonstrates how NFTs can be integrated into DeFi applications).
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 p-4 rounded-lg border border-amber-900/40">
                    <h4 className="font-medium text-amber-300 mb-2">Token Generation Event (TGE)</h4>
                    <p className="text-gray-300 text-sm">
                      All points earned during the testnet phase will be recorded and may convert to PRIOR tokens at the Token Generation Event. 
                      The exact conversion ratio will be announced closer to the TGE date.
                    </p>
                  </div>
                </div>
                
                <div className="bg-[#1A1F2E] p-5 rounded-lg border border-[#1A5CFF]/20">
                  <h3 className="text-xl font-medium text-white mb-3">Leaderboard & Points Tracking</h3>
                  <p className="text-gray-300 mb-4">
                    Your accumulated points place you on the testnet leaderboard, which ranks participants
                    based on their total points earned through both swap transactions and NFT staking.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="bg-blue-900/30 p-2 rounded-full mr-3 mt-0.5">
                        <div className="text-blue-400 text-lg">1</div>
                      </div>
                      <div>
                        <h5 className="text-white font-medium">Dashboard View</h5>
                        <p className="text-gray-300 text-sm">Check your personal stats and points on the <Link to="/dashboard" className="text-[#1A5CFF] hover:underline">Dashboard</Link> page</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-blue-900/30 p-2 rounded-full mr-3 mt-0.5">
                        <div className="text-blue-400 text-lg">2</div>
                      </div>
                      <div>
                        <h5 className="text-white font-medium">Real-time Updates</h5>
                        <p className="text-gray-300 text-sm">The leaderboard updates in real-time as swap transactions and staking activities are completed</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-blue-900/30 p-2 rounded-full mr-3 mt-0.5">
                        <div className="text-blue-400 text-lg">3</div>
                      </div>
                      <div>
                        <h5 className="text-white font-medium">Rewards Distribution</h5>
                        <p className="text-gray-300 text-sm">Higher rankings may result in increased token allocations at TGE</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-center">
                    <Link to="/dashboard">
                      <Button variant="outline" className="bg-blue-900/20 hover:bg-blue-800/30 text-blue-300 border-blue-800/60">
                        Check Your Ranking
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting Section */}
          <Card className="bg-[#0D1321] border-[#1A5CFF]/20" id="troubleshooting">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Troubleshooting
              </h2>
              <p className="text-gray-300 mb-4">
                If you encounter issues while using the Prior Protocol testnet, here are some common
                problems and their solutions.
              </p>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="connection">
                  <AccordionTrigger className="text-white hover:text-[#1A5CFF]">
                    Wallet Connection Issues
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300">
                    <ul className="list-disc list-inside space-y-2">
                      <li>Ensure you're on the Base Sepolia network in your wallet</li>
                      <li>Try refreshing the page and reconnecting</li>
                      <li>Disable and re-enable your wallet extension</li>
                      <li>Clear your browser cache and cookies</li>
                      <li>Try using a different browser</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faucet">
                  <AccordionTrigger className="text-white hover:text-[#1A5CFF]">
                    Faucet Claim Issues
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300">
                    <ul className="list-disc list-inside space-y-2">
                      <li>Remember you can only claim once every 24 hours</li>
                      <li>Ensure you have enough Base Sepolia ETH for gas</li>
                      <li>Check that your wallet is properly connected</li>
                      <li>If a transaction fails, wait 5 minutes before trying again</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="transactions">
                  <AccordionTrigger className="text-white hover:text-[#1A5CFF]">
                    Transaction Failures
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300">
                    <ul className="list-disc list-inside space-y-2">
                      <li>Ensure you have enough Base Sepolia ETH for gas</li>
                      <li>Try increasing the gas limit in your wallet settings</li>
                      <li>For swap failures, try using a smaller amount or different slippage setting</li>
                      <li>Wait for any pending transactions to complete before starting new ones</li>
                      <li>Check the Base Sepolia block explorer to verify transaction status</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="contact">
                  <AccordionTrigger className="text-white hover:text-[#1A5CFF]">
                    How to Get Support
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-300">
                    <p className="mb-3">
                      If you're experiencing issues that aren't covered here, you can reach out for support through:
                    </p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Prior Protocol Discord: <a href="http://discord.gg/priorprotocol" target="_blank" rel="noopener noreferrer" className="text-[#1A5CFF] hover:underline">discord.gg/priorprotocol</a></li>
                      <li>Twitter: <a href="https://twitter.com/priorprotocol" target="_blank" rel="noopener noreferrer" className="text-[#1A5CFF] hover:underline">@priorprotocol</a></li>
                    </ul>
                    <p className="mt-3">
                      Please include detailed information about the issue, including transaction hashes if applicable.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Documentation;