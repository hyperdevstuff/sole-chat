import { NextRequest, NextResponse } from "next/server";
import { redis } from "./lib/redis";
import { nanoid } from "nanoid";
import { JOIN_SCRIPT } from "./lib/lua-scripts";

export const proxy = async (req: NextRequest) => {
  const pathname = req.nextUrl.pathname;
  const roomMatch = pathname.match(/^\/room\/([^/]+)$/);
  if (!roomMatch) return NextResponse.redirect(new URL("/", req.url));
  const roomId = roomMatch[1];
  const meta = await redis.hgetall<{ createdAt: string }>(`meta:${roomId}`);
  if (!meta)
    return NextResponse.redirect(new URL("/?error=room-not-found", req.url));

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
  // Generate token first, but only set cookie after Lua confirms join
  const token = nanoid();

  // Atomic join: only add if room has < 2 users
  const joined = await redis.eval(
    JOIN_SCRIPT,
    [`connected:${roomId}`],
    [token],
  );

  // If room is full, redirect WITHOUT setting any cookie
  if (!joined) return NextResponse.redirect(new URL("/?error=room-full"));

  // Only set cookie AFTER Lua script confirms successful join
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
