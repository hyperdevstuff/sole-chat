import { NextRequest, NextResponse } from "next/server";
import { redis } from "./lib/redis";
import { nanoid } from "nanoid";

export const proxy = async (req: NextRequest) => {
  const pathname = req.nextUrl.pathname;
  const roomMatch = pathname.match(/^\/room\/([^/]+)$/);
  if (!roomMatch) return NextResponse.redirect(new URL("/", req.url));
  const roomId = roomMatch[1];
  console.log(roomId);
  const meta = await redis.hgetall<{ createdAt: number }>(`meta:${roomId}`);
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
  const userCount = await redis.scard(`connected:${roomId}`);
  if (userCount >= 2) {
    return NextResponse.redirect(new URL("/?error=room-full"));
  }
  const response = NextResponse.next();
  const token = nanoid();
  response.cookies.set("x-auth-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  const joined = await redis.eval(
    `
    local count = redis.call('SCARD', KEYS[1])
    if count >= 2 then
      return 0
    end
    redis.call('SADD', KEYS[1], ARGV[1])
    return 1
    `,
    [`connected:${roomId}`],
    [token],
  );

  if (!joined) return NextResponse.redirect(new URL("/?error=room-full"));

  const ttl = await redis.ttl(`meta:${roomId}`);
  await redis.expire(`connected:${roomId}`, ttl);
  return response;
};

export const config = {
  matcher: "/room/:path*",
};
