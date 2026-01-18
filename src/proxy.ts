import { NextRequest, NextResponse } from "next/server";
import { redis } from "./lib/redis";
import { nanoid } from "nanoid";
import { JOIN_SCRIPT } from "./lib/lua-scripts";
import { MAX_USERS_PER_ROOM } from "./lib/constants";

interface RoomMeta extends Record<string, unknown> {
  createdAt: string;
  maxUsers?: string;
  type?: string;
  e2ee?: string;
}

export const proxy = async (req: NextRequest) => {
  const pathname = req.nextUrl.pathname;
  const roomMatch = pathname.match(/^\/room\/([^/]+)$/);
  if (!roomMatch) return NextResponse.redirect(new URL("/", req.url));
  const roomId = roomMatch[1];
  const meta = await redis.hgetall<RoomMeta>(`meta:${roomId}`);
  if (!meta)
    return NextResponse.redirect(new URL("/?error=room-not-found", req.url));

  const maxUsers = meta.maxUsers ? parseInt(meta.maxUsers, 10) : MAX_USERS_PER_ROOM;

  const existingToken = req.cookies.get("x-auth-token")?.value;
  if (existingToken) {
    const isMember = await redis.sismember(
      `connected:${roomId}`,
      existingToken,
    );
    if (isMember) return NextResponse.next();

    const isInGrace = await redis.sismember(
      `leaving:${roomId}`,
      existingToken,
    );
    if (isInGrace) {
      await redis.smove(`leaving:${roomId}`, `connected:${roomId}`, existingToken);
      return NextResponse.next();
    }
  }
  const token = nanoid();

  const joined = await redis.eval(
    JOIN_SCRIPT,
    [`connected:${roomId}`],
    [token, maxUsers.toString()],
  );

  if (!joined) return NextResponse.redirect(new URL("/?error=room-full", req.url));

  const response = NextResponse.next();
  response.cookies.set("x-auth-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  const ttl = await redis.ttl(`meta:${roomId}`);
  await redis.expire(`connected:${roomId}`, ttl);
  return response;
};

export const config = {
  matcher: "/room/:path*",
};
