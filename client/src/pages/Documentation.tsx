import React from 'react';
import Layout from '@/components/Layout';
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
    <Layout>
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
                  Prior Protocol allows holders of the Prior Pioneer NFT to stake their NFTs to earn additional rewards
                  and participate in exclusive governance decisions.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-[#1A1F2E] p-4 rounded-lg border border-[#1A5CFF]/20">
                    <h3 className="text-lg font-medium text-white mb-2">Prior Pioneer NFT</h3>
                    <p className="text-gray-300 mb-2">
                      The Prior Pioneer NFT (contract address: 0x2a45dfDbdCfcF72CBE835435eD54f4beE7d06D59) is a special
                      token that grants early adopters exclusive benefits in the Prior Protocol ecosystem.
                    </p>
                    <p className="text-gray-300">
                      To stake your NFT, click on the "NFT STAKE" link in the navigation menu, which will redirect
                      you to the dedicated staking interface.
                    </p>
                  </div>
                  
                  <div className="bg-[#1E293B] p-4 rounded-lg">
                    <p className="text-sm text-gray-300">
                      <strong className="text-[#1A5CFF]">Benefits:</strong> NFT stakers earn 5 points per staking transaction
                      and gain access to exclusive pools and features within the protocol.
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
                  Prior Protocol testnet implements a points system to reward active participation.
                  These points will be convertible to PRIOR tokens at the Token Generation Event (TGE).
                </p>
                
                <div className="space-y-4">
                  <Table>
                    <TableCaption>Points earning structure</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white">Activity</TableHead>
                        <TableHead className="text-white">Points Earned</TableHead>
                        <TableHead className="text-white">Frequency Limit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">First daily swap</TableCell>
                        <TableCell>4 points</TableCell>
                        <TableCell>Once per day</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">10+ daily swaps</TableCell>
                        <TableCell>2 points each</TableCell>
                        <TableCell>Up to 3 additional swaps (6 points max)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Faucet claim</TableCell>
                        <TableCell>1 point</TableCell>
                        <TableCell>Once per 24 hours</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Governance participation</TableCell>
                        <TableCell>10 points</TableCell>
                        <TableCell>Per vote</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Liquidity staking</TableCell>
                        <TableCell>5 points</TableCell>
                        <TableCell>Per staking transaction</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  
                  <div className="bg-[#1E293B] p-4 rounded-lg">
                    <p className="text-sm text-gray-300">
                      <strong className="text-[#1A5CFF]">TGE Conversion:</strong> At the Token Generation Event,
                      points earned during the testnet phase will be converted to PRIOR tokens according to a formula
                      that will be announced at a later date. The leaderboard page displays the top participants ranked by points.
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
                  Encountering issues while using the Prior Protocol testnet? Here are some common problems and their solutions.
                </p>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="transactions">
                    <AccordionTrigger className="text-white hover:text-[#1A5CFF]">
                      Transactions not confirming
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-300">
                      <p className="mb-2">
                        If your transactions are pending for a long time or failing, try these steps:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Ensure you have enough Base Sepolia ETH for gas fees</li>
                        <li>Check that you're connected to the Base Sepolia network</li>
                        <li>Try increasing the gas price slightly</li>
                        <li>Reset your MetaMask account (Settings {'->'} Advanced {'->'} Reset Account)</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="wallet">
                    <AccordionTrigger className="text-white hover:text-[#1A5CFF]">
                      Wallet connection issues
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-300">
                      <p className="mb-2">
                        If you're having trouble connecting your wallet:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Refresh the page and try connecting again</li>
                        <li>Make sure your wallet is unlocked</li>
                        <li>Check that you've added Base Sepolia network to your wallet</li>
                        <li>Try using a different browser</li>
                        <li>Clear your browser cache and cookies</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tokens">
                    <AccordionTrigger className="text-white hover:text-[#1A5CFF]">
                      Tokens not showing in wallet
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-300">
                      <p className="mb-2">
                        If you can't see your tokens in MetaMask after a transaction:
                      </p>
                      <ul className="list-disc list-inside space-y-2">
                        <li>
                          Add the token manually to MetaMask using these contract addresses:
                          <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-sm">
                            <li><strong>PRIOR:</strong> 0xeFC91C5a51E8533282486FA2601dFfe0a0b16EDb</li>
                            <li><strong>USDC:</strong> 0xdB07b0b4E88D9D5A79A08E91fEE20Bb41f9989a2</li>
                          </ul>
                        </li>
                        <li>Verify the transaction was successful on <a href="https://sepolia.basescan.org" target="_blank" rel="noopener noreferrer" className="text-[#1A5CFF] hover:underline">Base Sepolia Explorer</a></li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="help">
                    <AccordionTrigger className="text-white hover:text-[#1A5CFF]">
                      Getting additional help
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-300">
                      <p className="mb-2">
                        If you need further assistance or want to report bugs:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Join the Prior Protocol <a href="https://discord.gg/priorprotocol" target="_blank" rel="noopener noreferrer" className="text-[#1A5CFF] hover:underline">Discord server</a></li>
                        <li>Follow updates on <a href="https://twitter.com/PriorProtocol" target="_blank" rel="noopener noreferrer" className="text-[#1A5CFF] hover:underline">Twitter</a></li>
                        <li>Submit issues on the project's <a href="https://github.com/priorprotocol/testnet-issues" target="_blank" rel="noopener noreferrer" className="text-[#1A5CFF] hover:underline">GitHub repository</a></li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Documentation;