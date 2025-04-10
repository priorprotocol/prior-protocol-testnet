/**
 * Contract Module Entry Point
 * 
 * This file provides a single entry point for all contract-related imports.
 * It re-exports everything from addresses, ABIs, metadata, and services.
 */

// Export addresses
export * from './addresses';

// Export ABIs 
export * from './abis';

// Export metadata
export * from './metadata/tokens';

// Export services
export * from './services';

// Export a main object for convenient access to everything
import * as addresses from './addresses';
import * as abis from './abis';
import * as tokenMetadata from './metadata/tokens';
import * as services from './services';

export const CONTRACTS = {
  addresses,
  abis,
  tokenMetadata,
  services
};

export default CONTRACTS;