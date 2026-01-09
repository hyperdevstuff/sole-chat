import { handle } from "@upstash/realtime";

import { realtime } from "@/lib/realtime";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export const GET = handle({ realtime });
