import { redis } from "@/lib/redis";
import { realtime } from "@/lib/realtime";
import { LEAVE_SCRIPT } from "@/lib/lua-scripts";
import {
  ROOM_TTL_SECONDS,
  MAX_SESSION_AGE_SECONDS,
  LEAVE_GRACE_TTL_SECONDS,
} from "@/lib/constants";
import Elysia, { t } from "elysia";
import { customAlphabet } from "nanoid";

// 6-character alphanumeric ID (62^6 = 56.8 billion combinations)
const generateRoomId = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  6
);
import { authMiddleware } from "../[[...slugs]]/auth";

export const rooms = new Elysia({ prefix: "/rooms" })
  .post("/create", async () => {
    const roomId = generateRoomId();
    await redis.hset(`meta:${roomId}`, {
      createdAt: Date.now(),
    });
    await redis.expire(`meta:${roomId}`, ROOM_TTL_SECONDS);
    return { roomId };
  })
  .use(authMiddleware)
  .patch(
    "/:roomId",
    async ({ params, auth }) => {
      const { roomId } = params;
      if (auth.roomId !== roomId) throw new Error("Unauthorized");

      const meta = await redis.hgetall<{ createdAt: string }>(`meta:${roomId}`);
      if (!meta) throw new Error("Room not found");

      const createdAt = parseInt(meta.createdAt, 10);
      const now = Date.now();
      const ageSeconds = Math.floor((now - createdAt) / 1000);
      const currentTtl = await redis.ttl(`meta:${roomId}`);
      const newTtl = currentTtl + ROOM_TTL_SECONDS;
      const projectedTotalAge = ageSeconds + newTtl;

      if (projectedTotalAge > MAX_SESSION_AGE_SECONDS) {
        return {
          success: false,
          error: "max_reached",
          message: "Maximum session length (7 days) reached",
          ttl: currentTtl,
        };
      }

      // Extend TTL on all room keys
      await Promise.all([
        redis.expire(`meta:${roomId}`, newTtl),
        redis.expire(`messages:${roomId}`, newTtl),
        redis.expire(`connected:${roomId}`, newTtl),
      ]);

      return {
        success: true,
        ttl: newTtl,
        message: "Extended by 10 minutes",
      };
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
    },
  )
  .delete(
    "/:roomId",
    async ({ params, auth }) => {
      const { roomId } = params;
      if (auth.roomId !== roomId) throw new Error("Unauthorized");

      await realtime
        .channel(`chat:${roomId}`)
        .emit("chat.destroy", { isDestroyed: true });
      await redis.del(
        `meta:${roomId}`,
        `messages:${roomId}`,
        `connected:${roomId}`,
        `leaving:${roomId}`,
      );
      return { success: true };
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
    },
  )
  .post(
    "/:roomId/leave",
    async ({ params, auth, body }) => {
      const { roomId } = params;
      if (auth.roomId !== roomId) throw new Error("Unauthorized");

      await redis.eval(
        LEAVE_SCRIPT,
        [`connected:${roomId}`, `leaving:${roomId}`],
        [auth.token, LEAVE_GRACE_TTL_SECONDS.toString()],
      );

      await realtime.channel(`chat:${roomId}`).emit("chat.leave", {
        username: body.username,
        timestamp: Date.now(),
      });

      return { success: true };
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
      body: t.Object({
        username: t.String(),
      }),
    },
  );
