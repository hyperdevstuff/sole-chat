import { Elysia, NotFoundError } from "elysia";
import { APIError } from "@/lib/api-error";
import { notFound } from "next/navigation";

const App = new Elysia({ prefix: "/api" })
  .get("/", () => "Hello from Elysia!")
  .onError(({ error, set }) => {
    if (error instanceof APIError) {
      set.status = error.status;
      return {
        success: false,
        message: error.message,
        code: error.code,
      };
    } else if (error instanceof NotFoundError) {
      notFound();
    } else if (isNextJsInternalError(error)) {
      throw error;
    }

    console.error("Internal Server Error:", error);

    set.status = 500;
    return {
      success: false,
      message: "Internal Server Error",
    };
  })
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

export type App = typeof App;

export const GET = App.handle;
export const POST = App.handle;

function isNextJsInternalError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }
  const digest = (error as { digest?: string }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}
