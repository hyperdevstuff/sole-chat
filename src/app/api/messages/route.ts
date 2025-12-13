import Elysia, { t } from "elysia";
import { authMiddleware } from "../[[...slugs]]/auth";
import { redis } from "@/lib/redis";
import { Message, realtime } from "@/lib/realtime";
import { nanoid } from "nanoid";

export const messages = new Elysia({ prefix: "/messages" })
  .use(authMiddleware)
  .post(
    "/",
    async ({ auth, body }) => {
      const { sender, text } = body;
      const { roomId } = auth;
      const roomExists = await redis.exists(`meta:${roomId}`);
      if (!roomExists) throw new Error("Room doesn't exist");

      const message: Message = {
        id: nanoid(),
        sender,
        text,
        timeStamp: Date.now(),
        roomId,
      };
      await redis.rpush(`messages:${roomId}`, {
        ...message,
        token: auth.token,
      });
      await realtime.channel(roomId).emit("chat.message", message);
      const remaining = await redis.ttl(`meta:${roomId}`);
      await redis.expire(`messages:${roomId}`, remaining);
      await redis.expire(`history:${roomId}`, remaining);
      await redis.expire(roomId, remaining);
    },
    {
      query: t.Object({
        roomId: t.String(),
      }),
      body: t.Object({
        sender: t.String({ maxLength: 100 }),
        text: t.String({ maxLength: 1000 }),
      }),
    },
  );
