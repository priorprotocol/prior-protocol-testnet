-- Database Reset Script for Prior Protocol Testnet
-- This script completely resets the database except for the demo user
-- Use this script for maintenance or when setting up a fresh environment

-- First, delete all transactions
DELETE FROM transactions;

-- Then delete all users except the demo user
DELETE FROM users 
WHERE address != '0xf4b08b6c0401c9568f3f3abf2a10c2950df98eae';

-- Reset the demo user's points and stats
UPDATE users 
SET points = 0, total_swaps = 0, total_claims = 0 
WHERE address = '0xf4b08b6c0401c9568f3f3abf2a10c2950df98eae';

-- Delete all user quests
DELETE FROM user_quests;

-- Reset votes
DELETE FROM votes;

-- Commit changes
COMMIT;

-- Display confirmation
SELECT 'Database successfully reset! Only demo user remains with zero points.' AS result;