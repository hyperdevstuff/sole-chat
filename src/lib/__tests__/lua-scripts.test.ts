import { describe, test, expect, beforeEach } from "bun:test";
import { Redis } from "@upstash/redis";
import { JOIN_SCRIPT, LEAVE_SCRIPT } from "../lua-scripts";

const redis = Redis.fromEnv();

const ROOM_ID = "test-room-lua-scripts";
const CONNECTED_KEY = `connected:${ROOM_ID}`;
const LEAVING_KEY = `leaving:${ROOM_ID}`;

async function cleanup() {
  await redis.del(CONNECTED_KEY, LEAVING_KEY);
}

describe("JOIN_SCRIPT", () => {
  beforeEach(cleanup);

  test("allows first user to join empty room", async () => {
    const result = await redis.eval(JOIN_SCRIPT, [CONNECTED_KEY], ["token-1", "2"]);
    expect(result).toBe(1);

    const members = await redis.smembers(CONNECTED_KEY);
    expect(members).toContain("token-1");
  });

  test("allows second user to join room with one user", async () => {
    await redis.sadd(CONNECTED_KEY, "token-1");

    const result = await redis.eval(JOIN_SCRIPT, [CONNECTED_KEY], ["token-2", "2"]);
    expect(result).toBe(1);

    const members = await redis.smembers(CONNECTED_KEY);
    expect(members).toHaveLength(2);
    expect(members).toContain("token-1");
    expect(members).toContain("token-2");
  });

  test("rejects third user when room is full (maxUsers=2)", async () => {
    await redis.sadd(CONNECTED_KEY, "token-1", "token-2");

    const result = await redis.eval(JOIN_SCRIPT, [CONNECTED_KEY], ["token-3", "2"]);
    expect(result).toBe(0);

    const members = await redis.smembers(CONNECTED_KEY);
    expect(members).toHaveLength(2);
    expect(members).not.toContain("token-3");
  });

  test("allows up to 10 users when maxUsers=10", async () => {
    for (let i = 1; i <= 9; i++) {
      await redis.sadd(CONNECTED_KEY, `token-${i}`);
    }
    
    const result = await redis.eval(JOIN_SCRIPT, [CONNECTED_KEY], ["token-10", "10"]);
    expect(result).toBe(1);
    
    const rejectResult = await redis.eval(JOIN_SCRIPT, [CONNECTED_KEY], ["token-11", "10"]);
    expect(rejectResult).toBe(0);
  });

  test("is idempotent for same token", async () => {
    await redis.eval(JOIN_SCRIPT, [CONNECTED_KEY], ["token-1", "2"]);
    const result = await redis.eval(JOIN_SCRIPT, [CONNECTED_KEY], ["token-1", "2"]);
    expect(result).toBe(1);

    const members = await redis.smembers(CONNECTED_KEY);
    expect(members).toHaveLength(1);
  });
});

describe("LEAVE_SCRIPT", () => {
  beforeEach(cleanup);

  test("moves user from connected to leaving set", async () => {
    await redis.sadd(CONNECTED_KEY, "token-1");

    const result = await redis.eval(
      LEAVE_SCRIPT,
      [CONNECTED_KEY, LEAVING_KEY],
      ["token-1", "30"]
    );
    expect(result).toBe(1);

    const connected = await redis.smembers(CONNECTED_KEY);
    const leaving = await redis.smembers(LEAVING_KEY);

    expect(connected).not.toContain("token-1");
    expect(leaving).toContain("token-1");
  });

  test("sets TTL on leaving set", async () => {
    await redis.sadd(CONNECTED_KEY, "token-1");

    await redis.eval(
      LEAVE_SCRIPT,
      [CONNECTED_KEY, LEAVING_KEY],
      ["token-1", "30"]
    );

    const ttl = await redis.ttl(LEAVING_KEY);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(30);
  });

  test("handles leaving when not in connected set", async () => {
    const result = await redis.eval(
      LEAVE_SCRIPT,
      [CONNECTED_KEY, LEAVING_KEY],
      ["token-1", "30"]
    );
    expect(result).toBe(1);

    const leaving = await redis.smembers(LEAVING_KEY);
    expect(leaving).toContain("token-1");
  });

  test("allows rejoin after leave (simulated grace period flow)", async () => {
    await redis.sadd(CONNECTED_KEY, "token-1", "token-2");
    await redis.eval(
      LEAVE_SCRIPT,
      [CONNECTED_KEY, LEAVING_KEY],
      ["token-1", "30"]
    );

    const connectedAfterLeave = await redis.smembers(CONNECTED_KEY);
    expect(connectedAfterLeave).toHaveLength(1);
    expect(connectedAfterLeave).toContain("token-2");

    const inLeaving = await redis.sismember(LEAVING_KEY, "token-1");
    expect(inLeaving).toBe(1);

    await redis.smove(LEAVING_KEY, CONNECTED_KEY, "token-1");

    const connectedAfterRejoin = await redis.smembers(CONNECTED_KEY);
    const leavingAfterRejoin = await redis.smembers(LEAVING_KEY);

    expect(connectedAfterRejoin).toHaveLength(2);
    expect(connectedAfterRejoin).toContain("token-1");
    expect(leavingAfterRejoin).not.toContain("token-1");
  });
});

describe("integration: join and leave flow", () => {
  beforeEach(cleanup);

  test("full flow: user1 joins, user2 joins, user1 leaves, user3 can join", async () => {
    const joinResult1 = await redis.eval(
      JOIN_SCRIPT,
      [CONNECTED_KEY],
      ["token-1", "2"]
    );
    expect(joinResult1).toBe(1);

    const joinResult2 = await redis.eval(
      JOIN_SCRIPT,
      [CONNECTED_KEY],
      ["token-2", "2"]
    );
    expect(joinResult2).toBe(1);

    const joinResult3Blocked = await redis.eval(
      JOIN_SCRIPT,
      [CONNECTED_KEY],
      ["token-3", "2"]
    );
    expect(joinResult3Blocked).toBe(0);

    await redis.eval(
      LEAVE_SCRIPT,
      [CONNECTED_KEY, LEAVING_KEY],
      ["token-1", "30"]
    );

    const joinResult3 = await redis.eval(
      JOIN_SCRIPT,
      [CONNECTED_KEY],
      ["token-3", "2"]
    );
    expect(joinResult3).toBe(1);

    const connected = await redis.smembers(CONNECTED_KEY);
    expect(connected).toHaveLength(2);
    expect(connected).toContain("token-2");
    expect(connected).toContain("token-3");
    expect(connected).not.toContain("token-1");
  });
});
