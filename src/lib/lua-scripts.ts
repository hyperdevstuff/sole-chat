/**
 * Lua scripts for atomic Redis operations.
 * Extracted to enable unit testing in isolation.
 */

/**
 * Atomic join script: Only adds user if room has < 2 users.
 * 
 * KEYS[1]: connected:{roomId} - SET of connected tokens
 * ARGV[1]: token - The auth token to add
 * 
 * Returns:
 * - 1 if join successful (added to set)
 * - 0 if room full (not added)
 */
export const JOIN_SCRIPT = `
local count = redis.call('SCARD', KEYS[1])
if count >= 2 then
  return 0
end
redis.call('SADD', KEYS[1], ARGV[1])
return 1
`;

/**
 * Leave script: Moves user from connected to leaving set with grace period.
 * 
 * KEYS[1]: connected:{roomId} - SET of connected tokens
 * KEYS[2]: leaving:{roomId} - SET of tokens in grace period
 * ARGV[1]: token - The auth token to move
 * ARGV[2]: graceTtl - TTL in seconds for the leaving set
 * 
 * Returns: 1 (always succeeds)
 */
export const LEAVE_SCRIPT = `
redis.call('SREM', KEYS[1], ARGV[1])
redis.call('SADD', KEYS[2], ARGV[1])
redis.call('EXPIRE', KEYS[2], ARGV[2])
return 1
`;
