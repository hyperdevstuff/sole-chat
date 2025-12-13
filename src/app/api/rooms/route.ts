import { redis } from "@/lib/redis";
import Elysia from "elysia";
import { nanoid } from "nanoid";
const ROOM_TTL_SECONDS: number = 60 * 10; // 10 mins

export const rooms = new Elysia({ prefix: "/rooms" }).post(
  "/create",
  async () => {
    const roomId = nanoid();
    await redis.hset(`meta:${roomId}`, {
      createdAt: Date.now(),
    });
    await redis.expire(`meta:${roomId}`, ROOM_TTL_SECONDS);
    return { roomId };
  },
);
