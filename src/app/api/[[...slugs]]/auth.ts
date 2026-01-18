import { redis } from "@/lib/redis";
import Elysia from "elysia";

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export const authMiddleware = new Elysia({ name: "auth" })
  .error({ AuthError })
  .onError(({ code, set }) => {
    if (code === "AuthError") {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .derive({ as: "scoped" }, async ({ params, request, cookie }) => {
    const url = new URL(request.url);
    const queryRoomId = url.searchParams.get("roomId");
    const roomId = (params as { roomId?: string }).roomId ?? queryRoomId;
    const token = cookie["x-auth-token"].value as string | undefined;
    if (!roomId || !token) {
      throw new AuthError("Missing RoomId or Auth Token");
    }

    const isMember = await redis.sismember(`connected:${roomId}`, token);
    if (!isMember) {
      throw new AuthError("Invalid token");
    }
    return { auth: { roomId, token } };
  });
