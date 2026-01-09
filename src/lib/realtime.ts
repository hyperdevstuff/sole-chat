import { Realtime } from "@upstash/realtime";
import { z } from "zod";

import { redis } from "./redis";

export const messageSchema = z.object({
  id: z.string(),
  text: z.string(),
  userId: z.string(),
  timestamp: z.number(),
});

const schema = {
  chat: {
    message: messageSchema,
  },
};

const TWENTY_FOUR_HOURS_IN_SECONDS = 86400;

export const realtime = new Realtime({
  schema,
  redis,
  history: {
    maxLength: 100,
    expireAfterSecs: TWENTY_FOUR_HOURS_IN_SECONDS,
  },
});

export type RealtimeSchema = typeof schema;
