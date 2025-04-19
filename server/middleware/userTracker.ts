/**
 * User Tracker Middleware
 * 
 * This middleware automatically creates users in the database if they don't exist
 * and ensures all wallet addresses are properly tracked.
 */

import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export async function ensureUserExists(address: string) {
  try {
    // Normalize the address to lowercase
    const normalizedAddress = address.startsWith('0x') 
      ? address.toLowerCase() 
      : `0x${address}`.toLowerCase();
    
    // Check if user exists
    let user = await storage.getUser(normalizedAddress);
    
    // If not, create the user
    if (!user) {
      console.log(`Auto-creating user for address: ${normalizedAddress}`);
      user = await storage.createUser({
        address: normalizedAddress,
        lastClaim: null
      });
      console.log(`User created with ID: ${user.id}`);
    }
    
    return user;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}

// Middleware to ensure user exists for address-based routes
export function userTrackerMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only process if the route has an address parameter
  if (req.params.address) {
    const { address } = req.params;
    
    // Ensure user exists asynchronously, but don't block the request
    ensureUserExists(address)
      .then(() => {
        // We don't need to do anything with the result here
        // Just ensure the user exists in the database
      })
      .catch(error => {
        console.error('Error in userTrackerMiddleware:', error);
        // We don't want to fail the request if this fails
      });
  }
  
  // Always proceed with the request
  next();
}

export default userTrackerMiddleware;