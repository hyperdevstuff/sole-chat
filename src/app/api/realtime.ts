import { Elysia, t } from "elysia";
import { realtime } from "@/lib/realtime";

export const realtimeApi = new Elysia({ prefix: "/realtime" }).post(
  "/",
  async ({ body }) => {
    const { channel, event, data } = body;
    await realtime.channel(channel).emit(event, data);
    return { success: true };
  },
  {
    body: t.Object({
      channel: t.String(),
      event: t.Union([
        t.Literal("chat.message"),
        t.Literal("chat.destroy"),
        t.Literal("chat.typing"),
      ]),
      data: t.Any(),
    }),
  }
);
