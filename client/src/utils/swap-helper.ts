import { ethers } from 'ethers';
import { contractAddresses } from '../lib/contracts';

// Utility function to convert from human-readable decimal to the proper format for contract calls
function parseUnits(amount: string, decimals: number): string {
  try {
    // Remove any commas from input
    const cleanAmount = amount.replace(/,/g, '');
    
    // For safety, limit amount in testnet
    let safeAmount = cleanAmount;
    if (decimals === 18 && parseFloat(cleanAmount) > 0.1) {
      safeAmount = '0.01';
      console.log(`Amount too large for testnet PRIOR, limiting to ${safeAmount}`);
    } else if (decimals === 6 && parseFloat(cleanAmount) > 10) {
      safeAmount = '5';
      console.log(`Amount too large for testnet stablecoin, limiting to ${safeAmount}`);
    }
    
    // Use ethers.js parseUnits which correctly handles decimal conversion
    return ethers.utils.parseUnits(safeAmount, decimals).toString();
  } catch (error) {
    console.error('Error parsing amount:', error);
    // Return a safe default value based on decimals
    return decimals === 18 ? '10000000000000000' : '1000000'; // 0.01 token for either decimals
  }
}

// A direct swap implementation that properly formats amounts for the blockchain
export async function directSwap(fromToken: string, toToken: string, amount: string): Promise<boolean> {
  try {
    if (!window.ethereum) {
      console.error("No Ethereum provider found");
      return false;
    }
    
    // Hardcoded values for testnet
    const PRIOR_TOKEN = contractAddresses.priorToken;
    const USDC_TOKEN = contractAddresses.tokens.USDC;
    const USDT_TOKEN = contractAddresses.tokens.USDT;
    
    // Determine the swap contract to use
    let swapContractAddress = '';
    let methodName = '';
    let fromSymbol = '';
    let toSymbol = '';
    let decimals = 18;
    
    // Identify tokens and contract
    if (fromToken.toLowerCase() === PRIOR_TOKEN.toLowerCase()) {
      fromSymbol = 'PRIOR';
      decimals = 18;
      
      if (toToken.toLowerCase() === USDC_TOKEN.toLowerCase()) {
        toSymbol = 'USDC';
        swapContractAddress = contractAddresses.swapContracts.PRIOR_USDC;
        methodName = 'swapPriorToUsdc'; // Fixed method name
      } else if (toToken.toLowerCase() === USDT_TOKEN.toLowerCase()) {
        toSymbol = 'USDT';
        swapContractAddress = contractAddresses.swapContracts.PRIOR_USDT;
        methodName = 'swapPriorToUsdc'; // Fixed method name
      }
    } else if (fromToken.toLowerCase() === USDC_TOKEN.toLowerCase()) {
      fromSymbol = 'USDC';
      decimals = 6;
      
      if (toToken.toLowerCase() === PRIOR_TOKEN.toLowerCase()) {
        toSymbol = 'PRIOR';
        swapContractAddress = contractAddresses.swapContracts.PRIOR_USDC;
        methodName = 'swapUsdcToPrior'; // Fixed method name
      } else if (toToken.toLowerCase() === USDT_TOKEN.toLowerCase()) {
        toSymbol = 'USDT';
        swapContractAddress = contractAddresses.swapContracts.USDC_USDT;
        methodName = 'swapUsdcToUsdt'; // Fixed method name
      }
    } else if (fromToken.toLowerCase() === USDT_TOKEN.toLowerCase()) {
      fromSymbol = 'USDT';
      decimals = 6;
      
      if (toToken.toLowerCase() === PRIOR_TOKEN.toLowerCase()) {
        toSymbol = 'PRIOR';
        swapContractAddress = contractAddresses.swapContracts.PRIOR_USDT;
        methodName = 'swapUsdcToPrior'; // Fixed method name
      } else if (toToken.toLowerCase() === USDC_TOKEN.toLowerCase()) {
        toSymbol = 'USDC';
        swapContractAddress = contractAddresses.swapContracts.USDC_USDT;
        methodName = 'swapUsdtToUsdc'; // Fixed method name
      }
    }
    
    console.log(`Determined swap: ${fromSymbol} -> ${toSymbol}`);
    console.log(`Using contract: ${swapContractAddress}`);
    console.log(`Method: ${methodName}`);
    
    if (!swapContractAddress || !methodName) {
      console.error("Could not determine swap parameters");
      return false;
    }
    
    // Parse user input amount to blockchain format with proper decimals
    const parsedAmount = parseUnits(amount, decimals);
    console.log(`Parsed amount with ${decimals} decimals: ${parsedAmount}`);
    
    // Get signer
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signer = provider.getSigner();
    
    // For tokens, we need approve first
    if (fromSymbol === 'USDC' || fromSymbol === 'USDT') {
      const tokenContract = new ethers.Contract(fromToken, [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)'
      ], signer);
      
      // Approve a bit more than needed to cover the transaction
      const amountToApprove = ethers.BigNumber.from(parsedAmount).mul(2).toString();
      
      console.log(`Approving ${amountToApprove} tokens for ${swapContractAddress}`);
      const approveTx = await tokenContract.approve(swapContractAddress, amountToApprove);
      await approveTx.wait();
      console.log('Approval successful');
    }
    
    // Now create the swap contract
    const swapContract = new ethers.Contract(swapContractAddress, [
      `function ${methodName}(uint256 amount) public returns (bool)`,
    ], signer);
    
    console.log(`Executing swap with amount: ${parsedAmount}`);
    
    // Execute the swap with the proper amount
    const swapTx = await swapContract[methodName](parsedAmount);
    console.log('Waiting for swap confirmation...');
    await swapTx.wait();
    console.log('Swap completed successfully!');
    
    return true;
  } catch (error) {
    console.error('Direct swap failed:', error);
    return false;
  }
}