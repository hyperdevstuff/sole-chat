import Elysia, { t } from "elysia";
import { redis } from "@/lib/redis";
import { Message, realtime } from "@/lib/realtime";
import { nanoid } from "nanoid";

async function validateAuth(roomId: string, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  return (await redis.sismember(`connected:${roomId}`, token)) === 1;
}

export const messages = new Elysia({ prefix: "/messages" })
  .post(
    "/",
    async ({ body, query, cookie }) => {
      const { sender, text } = body;
      const { roomId } = query;
      const token = cookie["x-auth-token"].value as string | undefined;
      
      if (!await validateAuth(roomId, token)) {
        throw new Error("Unauthorized");
      }
      
      const roomExists = await redis.exists(`meta:${roomId}`);
      if (!roomExists) throw new Error("Room doesn't exist");

      const message: Message = {
        id: nanoid(),
        sender,
        text,
        timeStamp: Date.now(),
        roomId,
      };
      await redis.rpush(`messages:${roomId}`, message);
      await realtime.channel(`chat:${roomId}`).emit("chat.message", message);
      const remaining = await redis.ttl(`meta:${roomId}`);
      await redis.expire(`messages:${roomId}`, remaining);
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
  )
  .get(
    "/",
    async ({ query, cookie }) => {
      const { roomId } = query;
      const token = cookie["x-auth-token"].value as string | undefined;
      
      if (!await validateAuth(roomId, token)) {
        throw new Error("Unauthorized");
      }
      
      const [rawMessages, ttl] = await Promise.all([
        redis.lrange(`messages:${roomId}`, 0, -1),
        redis.ttl(`meta:${roomId}`),
      ]);
      const messages: Message[] = rawMessages.map((msg) =>
        typeof msg === "string" ? JSON.parse(msg) : msg
      );
      return { messages, ttl: ttl > 0 ? ttl : 0 };
    },
    {
      query: t.Object({
        roomId: t.String(),
      }),
    },
  );
