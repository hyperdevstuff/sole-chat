import { realtime } from "@/lib/realtime";
import { handle } from "@upstash/realtime";
import { NextRequest, NextResponse } from "next/server";

export const GET = handle({ realtime });

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { channel, event, data } = body;
  await realtime.channel(channel).emit(event, data);
  return NextResponse.json({ success: true });
}
