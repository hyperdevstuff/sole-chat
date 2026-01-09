import { NextRequest, NextResponse } from "next/server";

import { redis } from "@/lib/redis";
import { realtime, messageSchema } from "@/lib/realtime";
import type { Message } from "@/types";

const MESSAGES_KEY = "sole-chat:messages";
const MAX_MESSAGES = 50;

export async function GET(): Promise<NextResponse> {
  try {
    const rawMessages = await redis.zrange(MESSAGES_KEY, -MAX_MESSAGES, -1);

    const messages: Message[] = rawMessages.map((raw) => {
      if (typeof raw === "string") {
        return JSON.parse(raw) as Message;
      }
      return raw as Message;
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ messages: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    const message = parsed.data;

    await redis.zadd(MESSAGES_KEY, {
      score: message.timestamp,
      member: JSON.stringify(message),
    });

    await realtime.emit("chat.message", message);

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
