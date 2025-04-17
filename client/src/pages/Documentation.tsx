import React from 'react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
              <h2 className="text-2xl font-bold text-white mb-4">
                Getting Started with Prior Protocol Testnet
              </h2>
              <p className="text-gray-300 mb-4">
                Prior Protocol is building a comprehensive DeFi platform on Base, designed to provide a streamlined
                experience for both new and experienced users. This testnet allows you to experiment with the
                protocol's features in a risk-free environment.
              </p>
              <div className="bg-[#1A1F2E] p-4 rounded-lg border border-[#1A5CFF]/20 mb-4">
                <h3 className="text-lg font-medium text-white mb-2">Requirements</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  <li>MetaMask or another Web3 wallet</li>
                  <li>Base Sepolia testnet configured in your wallet</li>
                  <li>Small amount of Base Sepolia ETH for gas (available from official faucets)</li>
                </ul>
              </div>
              <div className="bg-[#1E293B] p-4 rounded-lg">
                <p className="text-sm text-gray-300">
                  <strong className="text-[#1A5CFF]">Note:</strong> This testnet is for experimental purposes only. 
                  Tokens have no real value, but your participation will earn you points that may be 
                  converted to PRIOR tokens at the Token Generation Event (TGE).
                </p>
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
                    <li>First swap of the day: 4 points</li>
                    <li>10th swap and beyond (per day): 2 points each (max 6 points daily from these swaps)</li>
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
              <h2 className="text-2xl font-bold text-white mb-4">
                Points System
              </h2>
              <p className="text-gray-300 mb-4">
                Prior Protocol's testnet includes a points system that rewards users for active participation.
                These points will be used to determine token allocations at the token generation event (TGE).
              </p>
              
              <div className="space-y-4">
                <Table>
                  <TableCaption>Testnet activities and their point rewards</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Activity</TableHead>
                      <TableHead className="text-white">Points Earned</TableHead>
                      <TableHead className="text-white">Frequency Limit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Faucet Claim</TableCell>
                      <TableCell>1 point</TableCell>
                      <TableCell>Once per 24 hours</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">First Daily Swap</TableCell>
                      <TableCell>4 points</TableCell>
                      <TableCell>Once per day</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">10+ Daily Swaps</TableCell>
                      <TableCell>2 points per swap</TableCell>
                      <TableCell>Max 6 points per day</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Governance Vote</TableCell>
                      <TableCell>10 points</TableCell>
                      <TableCell>Per proposal</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">NFT Staking</TableCell>
                      <TableCell>5 points</TableCell>
                      <TableCell>Daily while staked</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                
                <div className="bg-[#1E293B] p-4 rounded-lg">
                  <p className="text-sm text-gray-300">
                    <strong className="text-[#1A5CFF]">TGE Conversion:</strong> Points accumulated during the testnet period will be converted 
                    to PRIOR tokens at Token Generation Event. The exact conversion rate will be announced closer to the TGE date.
                    You can track your points in the Dashboard section of the testnet.
                  </p>
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
                      <li>Prior Protocol Discord: <a href="https://discord.gg/prior" target="_blank" rel="noopener noreferrer" className="text-[#1A5CFF] hover:underline">discord.gg/prior</a></li>
                      <li>Twitter: <a href="https://twitter.com/priorprotocol" target="_blank" rel="noopener noreferrer" className="text-[#1A5CFF] hover:underline">@priorprotocol</a></li>
                      <li>Email: support@priorprotocol.xyz</li>
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