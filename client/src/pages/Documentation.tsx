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
import { FaInfoCircle, FaExternalLinkAlt, FaExchangeAlt, FaFaucet, FaVoteYea, FaUserShield } from 'react-icons/fa';

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
              <h2 className="text-2xl font-bold text-white mb-4">
                Using the Prior Token Faucet
              </h2>
              <p className="text-gray-300 mb-4">
                The Prior Protocol faucet allows you to claim testnet PRIOR tokens once every 24 hours.
                These tokens can be used to interact with the protocol's various features.
              </p>
              
              <div className="space-y-4">
                <div className="bg-[#1A1F2E] p-4 rounded-lg border border-[#1A5CFF]/20">
                  <h3 className="text-lg font-medium text-white mb-2">How to claim PRIOR tokens</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-300">
                    <li>Navigate to the <strong>Faucet</strong> page from the main menu</li>
                    <li>Connect your wallet if you haven't already</li>
                    <li>Click the "Claim PRIOR Tokens" button</li>
                    <li>Confirm the transaction in your wallet</li>
                    <li>Once the transaction is processed, 1 PRIOR token will be added to your wallet</li>
                  </ol>
                </div>
                
                <div className="bg-[#1E293B] p-4 rounded-lg">
                  <p className="text-sm text-gray-300">
                    <strong className="text-[#1A5CFF]">Note:</strong> Each wallet address can only claim 1 PRIOR token every 24 hours.
                    You'll earn 1 point for each successful faucet claim, which contributes to your overall testnet participation score.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Swapping Section */}
          <Card className="bg-[#0D1321] border-[#1A5CFF]/20" id="swap">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Token Swapping
              </h2>
              <p className="text-gray-300 mb-4">
                The Prior Protocol testnet includes a swap interface that allows you to exchange between PRIOR 
                and various other tokens like USDC, USDT, DAI, and WETH.
              </p>
              
              <div className="space-y-4">
                <div className="bg-[#1A1F2E] p-4 rounded-lg border border-[#1A5CFF]/20">
                  <h3 className="text-lg font-medium text-white mb-2">How to swap tokens</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-300">
                    <li>Navigate to the <strong>Swap</strong> page from the main menu</li>
                    <li>Connect your wallet if you haven't already</li>
                    <li>Select the tokens you want to swap between</li>
                    <li>Enter the amount you want to swap</li>
                    <li>Click "Approve" to authorize the swap contract to use your tokens (one-time per token pair)</li>
                    <li>Click "Swap" and confirm the transaction in your wallet</li>
                  </ol>
                </div>
                
                <div className="bg-[#1E293B] p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-300">
                    <strong className="text-[#1A5CFF]">Points System:</strong> Swaps are rewarded with points as follows:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300 mt-2">
                    <li>Each swap: 0.5 points</li>
                    <li>Maximum 5 swaps per day: 2.5 points maximum daily</li>
                  </ul>
                </div>
                
                <Table>
                  <TableCaption>Available token pairs for swapping</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Token Pair</TableHead>
                      <TableHead className="text-white">Swap Fee</TableHead>
                      <TableHead className="text-white">Token Contract</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">PRIOR/USDC</TableCell>
                      <TableCell>0.5%</TableCell>
                      <TableCell className="text-xs">0x8957e1988905311EE249e679a29fc9deCEd4D910</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">PRIOR/USDT</TableCell>
                      <TableCell>0.5%</TableCell>
                      <TableCell className="text-xs">-</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">PRIOR/WETH</TableCell>
                      <TableCell>0.5%</TableCell>
                      <TableCell className="text-xs">-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Governance Section */}
          <Card className="bg-[#0D1321] border-[#1A5CFF]/20" id="governance">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                Governance
              </h2>
              <p className="text-gray-300 mb-4">
                Prior Protocol implements a governance system that allows PRIOR token holders to vote on
                protocol upgrades and changes. This testnet provides a way to experiment with the governance process.
              </p>
              
              <div className="space-y-4">
                <div className="bg-[#1A1F2E] p-4 rounded-lg border border-[#1A5CFF]/20">
                  <h3 className="text-lg font-medium text-white mb-2">How to participate in governance</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-300">
                    <li>Navigate to the <strong>Governance</strong> page from the main menu</li>
                    <li>Connect your wallet if you haven't already</li>
                    <li>Browse active proposals</li>
                    <li>Click on a proposal to view details</li>
                    <li>Cast your vote (Yes or No) on the proposal</li>
                    <li>Confirm the transaction in your wallet</li>
                  </ol>
                </div>
                
                <div className="bg-[#1E293B] p-4 rounded-lg">
                  <p className="text-sm text-gray-300">
                    <strong className="text-[#1A5CFF]">Coming Soon:</strong> Enhanced governance features including proposal creation and delegation will be available in upcoming updates.
                    Participating in governance will earn you 10 points per vote.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NFT Staking Section */}
          <Card className="bg-[#0D1321] border-[#1A5CFF]/20" id="nft">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                NFT Staking
              </h2>
              <p className="text-gray-300 mb-4">
                Prior Protocol features NFT staking, allowing you to stake your Prior Pioneer NFT
                to earn additional benefits and rewards.
              </p>
              
              <div className="space-y-4">
                <div className="bg-[#1A1F2E] p-4 rounded-lg border border-[#1A5CFF]/20">
                  <h3 className="text-lg font-medium text-white mb-2">How to stake your NFT</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-300">
                    <li>Navigate to the <strong>NFT Stake</strong> page from the main menu</li>
                    <li>Connect your wallet if you haven't already</li>
                    <li>Select the Prior Pioneer NFT you wish to stake</li>
                    <li>Click "Stake NFT" and confirm the transaction</li>
                    <li>Your NFT will now be staked and earning rewards</li>
                  </ol>
                </div>
                
                <div className="bg-[#1E293B] p-4 rounded-lg">
                  <p className="text-sm text-gray-300">
                    <strong className="text-[#1A5CFF]">Note:</strong> NFT staking earns you 5 points per day.
                    The NFT staking feature is currently available on the original testnet site, which you can
                    access by clicking the "NFT STAKE" link in the main navigation.
                  </p>
                </div>
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
                  The Prior Protocol testnet has implemented a simplified points system that exclusively rewards swap transactions. Points earned will be used to determine token allocations at the Token Generation Event (TGE).
                </AlertDescription>
              </Alert>
              
              <p className="text-gray-300 mb-4">
                Active participation in the Prior Protocol testnet is tracked through our points system. 
                We've simplified the system to focus on validating the core token swap functionality 
                of the protocol, which is why only swap transactions currently earn points.
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
                    <h4 className="font-medium text-blue-300 mb-2">Why Only Swaps?</h4>
                    <p className="text-gray-300 text-sm">
                      Our simplified points system focuses on optimizing and stress-testing the core swap functionality of Prior Protocol. 
                      This focused approach helps us gather more valuable data on transaction performance, liquidity pools, and price discovery mechanisms.
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
                    based on their total points earned through swap transactions.
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
                        <p className="text-gray-300 text-sm">The leaderboard updates in real-time as swap transactions are completed</p>
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