import { InferRealtimeEvents, Realtime } from "@upstash/realtime";
import z from "zod";
import { redis } from "./redis";

const message = z.object({
  id: z.string(),
  sender: z.string(),
  text: z.string(),
  timeStamp: z.number(),
  roomId: z.string(),
  token: z.string().optional(),
});
const schema = {
  chat: {
    message,
    destroy: z.object({
      isDestroyed: z.literal(true),
    }),
    typing: z.object({
      sender: z.string(),
      isTyping: z.boolean(),
    }),
    join: z.object({
      username: z.string(),
      timestamp: z.number(),
    }),
    leave: z.object({
      username: z.string(),
      timestamp: z.number(),
    }),
    keyExchange: z.object({
      publicKey: z.string(),
      username: z.string(),
    }),
  },
};

export const realtime = new Realtime({
  schema,
  redis,
});
export type RealtimeEvents = InferRealtimeEvents<typeof realtime>;
export type Message = z.Infer<typeof message>;
