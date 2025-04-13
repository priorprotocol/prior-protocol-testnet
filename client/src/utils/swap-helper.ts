import { ethers } from 'ethers';
import { contractAddresses } from '../lib/contracts';

// A direct swap implementation with proper BigNumber handling
export async function directSwap(fromToken: string, toToken: string, amount: string): Promise<boolean> {
  try {
    if (!window.ethereum) {
      console.error("No Ethereum provider found");
      return false;
    }
    
    console.log(`Attempting to swap tokens from ${fromToken} to ${toToken}`);
    
    // Determine the swap contract to use
    let swapContractAddress = '';
    let fromSymbol = '';
    let toSymbol = '';
    let decimals = 18;
    
    // Hardcoded values for testnet
    const PRIOR_TOKEN = contractAddresses.priorToken;
    const USDC_TOKEN = contractAddresses.tokens.USDC;
    const USDT_TOKEN = contractAddresses.tokens.USDT;
    
    // Get the appropriate swap contract address
    if ((fromToken.toLowerCase() === PRIOR_TOKEN.toLowerCase() && toToken.toLowerCase() === USDC_TOKEN.toLowerCase()) ||
        (fromToken.toLowerCase() === USDC_TOKEN.toLowerCase() && toToken.toLowerCase() === PRIOR_TOKEN.toLowerCase())) {
      swapContractAddress = contractAddresses.swapContracts.PRIOR_USDC;
    } else if ((fromToken.toLowerCase() === PRIOR_TOKEN.toLowerCase() && toToken.toLowerCase() === USDT_TOKEN.toLowerCase()) ||
               (fromToken.toLowerCase() === USDT_TOKEN.toLowerCase() && toToken.toLowerCase() === PRIOR_TOKEN.toLowerCase())) {
      swapContractAddress = contractAddresses.swapContracts.PRIOR_USDT;
    } else if ((fromToken.toLowerCase() === USDC_TOKEN.toLowerCase() && toToken.toLowerCase() === USDT_TOKEN.toLowerCase()) ||
               (fromToken.toLowerCase() === USDT_TOKEN.toLowerCase() && toToken.toLowerCase() === USDC_TOKEN.toLowerCase())) {
      swapContractAddress = contractAddresses.swapContracts.USDC_USDT;
    }
    
    console.log(`Using swap contract address: ${swapContractAddress}`);
    
    // For safety, limit amount in testnet
    let safeAmount = amount;
    
    // Identify token types and set decimals
    if (fromToken.toLowerCase() === PRIOR_TOKEN.toLowerCase()) {
      fromSymbol = 'PRIOR';
      decimals = 18;
      console.log(`Identified address ${fromToken} as PRIOR token`);
      
      // Limit PRIOR amount for testnet
      if (parseFloat(amount) > 0.1) {
        safeAmount = '0.01';
        console.log(`Amount too large for testnet PRIOR, limiting to ${safeAmount}`);
      }
    } else if (fromToken.toLowerCase() === USDC_TOKEN.toLowerCase()) {
      fromSymbol = 'USDC';
      decimals = 6;
      console.log(`Identified address ${fromToken} as USDC token`);
      
      // Limit USDC amount for testnet
      if (parseFloat(amount) > 10) {
        safeAmount = '5';
        console.log(`Amount too large for testnet USDC, limiting to ${safeAmount}`);
      }
    } else if (fromToken.toLowerCase() === USDT_TOKEN.toLowerCase()) {
      fromSymbol = 'USDT';
      decimals = 6;
      console.log(`Identified address ${fromToken} as USDT token`);
      
      // Limit USDT amount for testnet
      if (parseFloat(amount) > 10) {
        safeAmount = '5';
        console.log(`Amount too large for testnet USDT, limiting to ${safeAmount}`);
      }
    }
    
    if (toToken.toLowerCase() === PRIOR_TOKEN.toLowerCase()) {
      toSymbol = 'PRIOR';
      console.log(`Identified address ${toToken} as PRIOR token`);
    } else if (toToken.toLowerCase() === USDC_TOKEN.toLowerCase()) {
      toSymbol = 'USDC';
      console.log(`Identified address ${toToken} as USDC token`);
    } else if (toToken.toLowerCase() === USDT_TOKEN.toLowerCase()) {
      toSymbol = 'USDT';
      console.log(`Identified address ${toToken} as USDT token`);
    }
    
    if (!swapContractAddress) {
      console.error("Could not determine swap contract address");
      return false;
    }
    
    // Use ethers.js parseUnits to properly handle decimals
    const parsedAmount = ethers.utils.parseUnits(safeAmount, decimals);
    console.log(`Parsed amount for swap: ${safeAmount}`);
    
    // Get signer
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const signer = provider.getSigner();
    
    try {
      // Execute the appropriate swap based on token types
      if (fromSymbol === 'PRIOR' && toSymbol === 'USDC') {
        console.log(`Starting PRIOR to USDC swap with amount: ${safeAmount}`);
        return await executePriorToUsdcSwap(swapContractAddress, parsedAmount, signer);
      } else if (fromSymbol === 'PRIOR' && toSymbol === 'USDT') {
        console.log(`Starting PRIOR to USDT swap with amount: ${safeAmount}`);
        return await executePriorToUsdtSwap(swapContractAddress, parsedAmount, signer);
      } else if (fromSymbol === 'USDC' && toSymbol === 'PRIOR') {
        console.log(`Starting USDC to PRIOR swap with amount: ${safeAmount}`);
        return await executeUsdcToPriorSwap(fromToken, swapContractAddress, parsedAmount, signer);
      } else if (fromSymbol === 'USDT' && toSymbol === 'PRIOR') {
        console.log(`Starting USDT to PRIOR swap with amount: ${safeAmount}`);
        return await executeUsdtToPriorSwap(fromToken, swapContractAddress, parsedAmount, signer);
      } else if (fromSymbol === 'USDC' && toSymbol === 'USDT') {
        console.log(`Starting USDC to USDT swap with amount: ${safeAmount}`);
        return await executeUsdcToUsdtSwap(fromToken, swapContractAddress, parsedAmount, signer);
      } else if (fromSymbol === 'USDT' && toSymbol === 'USDC') {
        console.log(`Starting USDT to USDC swap with amount: ${safeAmount}`);
        return await executeUsdtToUsdcSwap(fromToken, swapContractAddress, parsedAmount, signer);
      } else {
        console.error(`Unsupported swap pair: ${fromSymbol} to ${toSymbol}`);
        return false;
      }
    } catch (error) {
      console.error('Swap execution error:', error);
      return false;
    }
  } catch (error) {
    console.error('Error swapping tokens:', error);
    return false;
  }
}

// Helper functions for specific swap types

// PRIOR to USDC swap
async function executePriorToUsdcSwap(swapContractAddress: string, amount: ethers.BigNumber, signer: ethers.Signer): Promise<boolean> {
  try {
    console.log('Executing PRIOR to USDC swap');
    const swapContract = new ethers.Contract(
      swapContractAddress,
      ['function swapPriorToUsdc(uint256 amount) public returns (bool)'],
      signer
    );
    
    const tx = await swapContract.swapPriorToUsdc(amount);
    await tx.wait();
    console.log('PRIOR to USDC swap completed successfully!');
    return true;
  } catch (error) {
    console.error('Error executing swap:', error);
    return false;
  }
}

// PRIOR to USDT swap
async function executePriorToUsdtSwap(swapContractAddress: string, amount: ethers.BigNumber, signer: ethers.Signer): Promise<boolean> {
  try {
    console.log('Executing PRIOR to USDT swap');
    const swapContract = new ethers.Contract(
      swapContractAddress,
      ['function swapPriorToUsdc(uint256 amount) public returns (bool)'],
      signer
    );
    
    const tx = await swapContract.swapPriorToUsdc(amount);
    await tx.wait();
    console.log('PRIOR to USDT swap completed successfully!');
    return true;
  } catch (error) {
    console.error('Error executing swap:', error);
    return false;
  }
}

// USDC to PRIOR swap
async function executeUsdcToPriorSwap(tokenAddress: string, swapContractAddress: string, amount: ethers.BigNumber, signer: ethers.Signer): Promise<boolean> {
  try {
    // First approve the swap contract to spend tokens
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)'
      ],
      signer
    );
    
    // Approve 2x to cover any potential issues
    const approvalAmount = amount.mul(2);
    const approveTx = await tokenContract.approve(swapContractAddress, approvalAmount);
    await approveTx.wait();
    console.log('USDC token approval successful');
    
    // Then execute the swap
    const swapContract = new ethers.Contract(
      swapContractAddress,
      ['function swapUsdcToPrior(uint256 amount) public returns (bool)'],
      signer
    );
    
    const tx = await swapContract.swapUsdcToPrior(amount);
    await tx.wait();
    console.log('USDC to PRIOR swap completed successfully!');
    return true;
  } catch (error) {
    console.error('Error executing swap:', error);
    return false;
  }
}

// USDT to PRIOR swap
async function executeUsdtToPriorSwap(tokenAddress: string, swapContractAddress: string, amount: ethers.BigNumber, signer: ethers.Signer): Promise<boolean> {
  try {
    // First approve the swap contract to spend tokens
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)'
      ],
      signer
    );
    
    // Approve 2x to cover any potential issues
    const approvalAmount = amount.mul(2);
    const approveTx = await tokenContract.approve(swapContractAddress, approvalAmount);
    await approveTx.wait();
    console.log('USDT token approval successful');
    
    // Then execute the swap
    const swapContract = new ethers.Contract(
      swapContractAddress,
      ['function swapUsdcToPrior(uint256 amount) public returns (bool)'],
      signer
    );
    
    const tx = await swapContract.swapUsdcToPrior(amount);
    await tx.wait();
    console.log('USDT to PRIOR swap completed successfully!');
    return true;
  } catch (error) {
    console.error('Error executing swap:', error);
    return false;
  }
}

// USDC to USDT swap
async function executeUsdcToUsdtSwap(tokenAddress: string, swapContractAddress: string, amount: ethers.BigNumber, signer: ethers.Signer): Promise<boolean> {
  try {
    // First approve the swap contract to spend tokens
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)'
      ],
      signer
    );
    
    // Approve 2x to cover any potential issues
    const approvalAmount = amount.mul(2);
    const approveTx = await tokenContract.approve(swapContractAddress, approvalAmount);
    await approveTx.wait();
    console.log('USDC token approval successful');
    
    // Then execute the swap
    const swapContract = new ethers.Contract(
      swapContractAddress,
      ['function swapUsdcToUsdt(uint256 amount) public returns (bool)'],
      signer
    );
    
    const tx = await swapContract.swapUsdcToUsdt(amount);
    await tx.wait();
    console.log('USDC to USDT swap completed successfully!');
    return true;
  } catch (error) {
    console.error('Error executing swap:', error);
    return false;
  }
}

// USDT to USDC swap
async function executeUsdtToUsdcSwap(tokenAddress: string, swapContractAddress: string, amount: ethers.BigNumber, signer: ethers.Signer): Promise<boolean> {
  try {
    // First approve the swap contract to spend tokens
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)'
      ],
      signer
    );
    
    // Approve 2x to cover any potential issues
    const approvalAmount = amount.mul(2);
    const approveTx = await tokenContract.approve(swapContractAddress, approvalAmount);
    await approveTx.wait();
    console.log('USDT token approval successful');
    
    // Then execute the swap
    const swapContract = new ethers.Contract(
      swapContractAddress,
      ['function swapUsdtToUsdc(uint256 amount) public returns (bool)'],
      signer
    );
    
    const tx = await swapContract.swapUsdtToUsdc(amount);
    await tx.wait();
    console.log('USDT to USDC swap completed successfully!');
    return true;
  } catch (error) {
    console.error('Error executing swap:', error);
    return false;
  }
}