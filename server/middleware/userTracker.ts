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
    // Using a more robust approach with retry logic
    const MAX_SQL_RETRIES = 3;
    let user = null;
    
    for (let attempt = 0; attempt < MAX_SQL_RETRIES; attempt++) {
      try {
        const directResult = await pool.query(`
          SELECT * FROM users WHERE address = $1 LIMIT 1
        `, [normalizedAddress]);
        
        if (directResult.rows && directResult.rows.length > 0) {
          console.log(`Using existing user with ID ${directResult.rows[0].id} from direct SQL query (attempt ${attempt + 1})`);
          
          // Enhance debugging by logging user data
          try {
            const debugUserInfo = directResult.rows[0];
            console.log(`DEBUG - Direct SQL found ${directResult.rows.length} users with address ${normalizedAddress}:`);
            console.log(`- ID: ${debugUserInfo.id}, Address: ${debugUserInfo.address}, Points: ${debugUserInfo.points}, Swaps: ${debugUserInfo.total_swaps}`);
            
            // Also check for any transactions
            const txResult = await pool.query(`
              SELECT id, user_id, type, points, tx_hash
              FROM transactions 
              WHERE user_id = $1
              ORDER BY id DESC
              LIMIT 10
            `, [debugUserInfo.id]);
            
            if (txResult.rows && txResult.rows.length > 0) {
              console.log(`DEBUG - Direct SQL found ${txResult.rows.length} transactions for ${normalizedAddress}:`);
              for (const tx of txResult.rows) {
                console.log(`- TxID: ${tx.id}, UserID: ${tx.user_id}, Type: ${tx.type}, Points: ${tx.points}, Hash: ${tx.tx_hash}`);
              }
            } else {
              console.log(`DEBUG - No transactions found for user ${debugUserInfo.id} (${normalizedAddress})`);
            }
          } catch (debugError) {
            // Ignore debug errors
          }
          
          return directResult.rows[0];
        }
        
        if (attempt === MAX_SQL_RETRIES - 1) {
          console.log(`User with address ${normalizedAddress} not found after ${MAX_SQL_RETRIES} direct SQL attempts`);
        }
        
        // Small delay before retry
        if (attempt < MAX_SQL_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
        }
      } catch (sqlError) {
        console.error(`Error finding user with direct SQL (attempt ${attempt + 1}):`, sqlError);
        
        // Small delay before retry
        if (attempt < MAX_SQL_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
        }
      }
    }
    
    // If direct SQL failed or found no user, try storage method
    user = await storage.getUser(normalizedAddress);
    
    // If still not found, use SQL to create user with ON CONFLICT to avoid duplicates
    if (!user) {
      console.log(`Auto-creating user for address: ${normalizedAddress}`);
      
      // User creation with retry logic
      const MAX_CREATE_RETRIES = 3;
      
      for (let attempt = 0; attempt < MAX_CREATE_RETRIES; attempt++) {
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
            console.log(`User created or found with direct SQL - ID: ${user.id} (attempt ${attempt + 1})`);
            
            // Immediate verification
            try {
              const verification = await pool.query(`
                SELECT * FROM users WHERE id = $1
              `, [user.id]);
              
              if (verification.rows && verification.rows.length > 0) {
                console.log(`VERIFICATION: User ${user.id} (${normalizedAddress}) successfully saved in DB`);
                break; // Exit retry loop on success
              } else {
                console.error(`VERIFICATION FAILED: User ${user.id} (${normalizedAddress}) not found despite successful creation!`);
                if (attempt < MAX_CREATE_RETRIES - 1) {
                  console.log(`Retrying user creation (attempt ${attempt + 2})`);
                }
              }
            } catch (verifyError) {
              console.error(`Error verifying user creation:`, verifyError);
              if (attempt < MAX_CREATE_RETRIES - 1) {
                console.log(`Retrying user creation (attempt ${attempt + 2})`);
              }
            }
          } else {
            // Try to get user in case ON CONFLICT silently returned nothing
            const checkResult = await pool.query(`
              SELECT * FROM users WHERE address = $1
            `, [normalizedAddress]);
            
            if (checkResult.rows && checkResult.rows.length > 0) {
              user = checkResult.rows[0];
              console.log(`User found after insert conflict - ID: ${user.id} (attempt ${attempt + 1})`);
              break; // Exit retry loop on success
            } else if (attempt === MAX_CREATE_RETRIES - 1) {
              // Final fallback to storage method if all SQL attempts fail
              user = await storage.createUser({
                address: normalizedAddress,
                lastClaim: null
              });
              console.log(`User created via storage method after all SQL attempts failed - ID: ${user.id}`);
            }
          }
          
          // Small delay before retry
          if (attempt < MAX_CREATE_RETRIES - 1 && !user) {
            await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
          }
        } catch (insertError) {
          console.error(`Error creating user with direct SQL (attempt ${attempt + 1}):`, insertError);
          
          if (attempt === MAX_CREATE_RETRIES - 1) {
            // Final fallback to storage method after all retries fail
            console.log(`All SQL attempts failed, using storage fallback for user creation`);
            user = await storage.createUser({
              address: normalizedAddress,
              lastClaim: null
            });
            console.log(`User created via storage fallback with ID: ${user.id}`);
          } else {
            // Small delay before retry
            await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
          }
        }
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