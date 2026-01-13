import { redis } from "@/lib/redis";
import { realtime } from "@/lib/realtime";
import Elysia, { t } from "elysia";
import { nanoid } from "nanoid";
import { authMiddleware } from "../[[...slugs]]/auth";

const ROOM_TTL_SECONDS: number = 60 * 10; // 10 mins

export const rooms = new Elysia({ prefix: "/rooms" })
  .post("/create", async () => {
    const roomId = nanoid();
    await redis.hset(`meta:${roomId}`, {
      createdAt: Date.now(),
    });
    await redis.expire(`meta:${roomId}`, ROOM_TTL_SECONDS);
    return { roomId };
  })
  .use(authMiddleware)
  .delete(
    "/:roomId",
    async ({ params, auth }) => {
      const { roomId } = params;
      if (auth.roomId !== roomId) throw new Error("Unauthorized");

      await realtime
        .channel(`chat:${roomId}`)
        .emit("chat.destroy", { isDestroyed: true });
      await redis.del(`meta:${roomId}`, `messages:${roomId}`, `users:${roomId}`);
      return { success: true };
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
    },
  );
