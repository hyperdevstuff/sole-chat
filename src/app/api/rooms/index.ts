import { redis } from "@/lib/redis";
import { realtime } from "@/lib/realtime";
import { LEAVE_SCRIPT } from "@/lib/lua-scripts";
import {
  ROOM_TTL_SECONDS,
  MAX_SESSION_AGE_SECONDS,
  LEAVE_GRACE_TTL_SECONDS,
  ROOM_TYPE_CONFIG,
  VALID_TTL_VALUES,
  type RoomType,
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
  .post(
    "/create",
    async ({ body }) => {
      const roomId = generateRoomId();
      const roomType: RoomType = body?.type ?? "private";
      const config = ROOM_TYPE_CONFIG[roomType];
      
      const ttl = body?.ttl && VALID_TTL_VALUES.includes(body.ttl as 600 | 86400 | 604800)
        ? body.ttl
        : ROOM_TTL_SECONDS;
      
      const roomData: Record<string, string | number | boolean> = {
        createdAt: Date.now(),
        type: roomType,
        maxUsers: config.maxUsers,
        e2ee: config.e2ee,
        ttl,
      };
      if (body?.publicKey && roomType === "private") {
        roomData.creatorPublicKey = body.publicKey;
      }
      await redis.hset(`meta:${roomId}`, roomData);
      await redis.expire(`meta:${roomId}`, ttl);
      return { roomId, type: roomType, e2ee: config.e2ee, ttl };
    },
    {
      body: t.Optional(
        t.Object({
          publicKey: t.Optional(t.String()),
          type: t.Optional(t.Union([t.Literal("private"), t.Literal("group")])),
          ttl: t.Optional(t.Number()),
        })
      ),
    }
  )
  .use(authMiddleware)
  .get(
    "/:roomId/info",
    async ({ params, auth }) => {
      const { roomId } = params;
      if (auth.roomId !== roomId) throw new Error("Unauthorized");
      const meta = await redis.hgetall<{ 
        type?: string; 
        maxUsers?: string; 
        e2ee?: string;
        createdAt?: string;
      }>(
        `meta:${roomId}`
      );
      if (!meta) throw new Error("Room not found");
      const connectedCount = await redis.scard(`connected:${roomId}`);
      return {
        type: (meta.type ?? "private") as "private" | "group",
        maxUsers: meta.maxUsers ? parseInt(meta.maxUsers, 10) : 2,
        e2ee: meta.e2ee === "true" || meta.e2ee === "1" || meta.type === "private" || !meta.type,
        connectedCount,
      };
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
    }
  )
  .get(
    "/:roomId/keys",
    async ({ params, auth }) => {
      const { roomId } = params;
      if (auth.roomId !== roomId) throw new Error("Unauthorized");
      const meta = await redis.hgetall<{ creatorPublicKey?: string; joinerPublicKey?: string }>(
        `meta:${roomId}`
      );
      if (!meta) throw new Error("Room not found");
      return {
        creatorPublicKey: meta.creatorPublicKey ?? null,
        joinerPublicKey: meta.joinerPublicKey ?? null,
      };
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
    }
  )
  .put(
    "/:roomId/keys",
    async ({ params, auth, body }) => {
      const { roomId } = params;
      if (auth.roomId !== roomId) throw new Error("Unauthorized");
      const meta = await redis.hgetall<{ creatorPublicKey?: string }>(
        `meta:${roomId}`
      );
      if (!meta) throw new Error("Room not found");
      await redis.hset(`meta:${roomId}`, { joinerPublicKey: body.publicKey });
      await realtime.channel(`chat:${roomId}`).emit("chat.keyExchange", {
        publicKey: body.publicKey,
        username: body.username,
      });
      return { success: true };
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
      body: t.Object({
        publicKey: t.String(),
        username: t.String(),
      }),
    }
  )
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
