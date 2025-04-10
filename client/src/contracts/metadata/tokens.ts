/**
 * Token metadata including decimals, symbols, and names
 */

// Token decimals (used for formatting amounts and parsing inputs)
export const TOKEN_DECIMALS = {
  PRIOR: 18,
  USDC: 6,
  USDT: 6,
  DAI: 6,
  WETH: 18
};

// On-chain token symbols (may differ from UI symbols)
export const TOKEN_SYMBOLS = {
  PRIOR: "PRIOR",
  USDC: "mUSDC", // Mock USDC
  USDT: "mUSDT", // Mock USDT
  DAI: "mDAI",   // Mock DAI
  WETH: "mWETH"  // Mock WETH
};

// Token names
export const TOKEN_NAMES = {
  PRIOR: "Prior Protocol Token",
  USDC: "Mock USD Coin",
  USDT: "Mock Tether USD",
  DAI: "Mock Dai Stablecoin",
  WETH: "Mock Wrapped Ether"
};

// Token colors used in UI
export const TOKEN_COLORS = {
  PRIOR: "#00df9a",  
  USDC: "#2775CA",   
  USDT: "#26A17B",   
  DAI: "#F5AC37",    
  WETH: "#627EEA"     
};

// Export a grouped metadata object
export const TOKEN_METADATA = {
  decimals: TOKEN_DECIMALS,
  symbols: TOKEN_SYMBOLS,
  names: TOKEN_NAMES,
  colors: TOKEN_COLORS
};

export default TOKEN_METADATA;