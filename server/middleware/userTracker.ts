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
    // Import pool for direct SQL queries
    const { pool } = require('../db');
    
    // Normalize the address to lowercase
    const normalizedAddress = address.startsWith('0x') 
      ? address.toLowerCase() 
      : `0x${address}`.toLowerCase();
    
    // First try direct SQL to find user to avoid race conditions
    try {
      const directResult = await pool.query(`
        SELECT * FROM users WHERE address = $1 LIMIT 1
      `, [normalizedAddress]);
      
      if (directResult.rows && directResult.rows.length > 0) {
        console.log(`Using existing user with ID ${directResult.rows[0].id} from direct SQL query`);
        return directResult.rows[0];
      }
    } catch (sqlError) {
      console.error('Error finding user with direct SQL:', sqlError);
      // Fall back to storage method
    }
    
    // If direct SQL failed or found no user, try storage method
    let user = await storage.getUser(normalizedAddress);
    
    // If still not found, use SQL to create user with ON CONFLICT to avoid duplicates
    if (!user) {
      console.log(`Auto-creating user for address: ${normalizedAddress}`);
      
      try {
        // Using ON CONFLICT to insert only if doesn't exist already
        const insertResult = await pool.query(`
          INSERT INTO users (address, points, total_swaps, total_claims) 
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (address) DO UPDATE 
          SET address = EXCLUDED.address
          RETURNING *
        `, [normalizedAddress, "0", 0, 0]);
        
        if (insertResult.rows && insertResult.rows.length > 0) {
          user = insertResult.rows[0];
          console.log(`User created or found with ID: ${user.id}`);
        } else {
          // Final fallback to storage method if all else fails
          user = await storage.createUser({
            address: normalizedAddress,
            lastClaim: null
          });
          console.log(`User created via storage with ID: ${user.id}`);
        }
      } catch (insertError) {
        console.error('Error creating user with direct SQL, falling back to storage:', insertError);
        // Final fallback to storage method
        user = await storage.createUser({
          address: normalizedAddress,
          lastClaim: null
        });
        console.log(`User created via storage fallback with ID: ${user.id}`);
      }
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