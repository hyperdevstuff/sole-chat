import { treaty } from "@elysiajs/eden";
import type { App } from "../app/api/[[...slugs]]/route";

export const api = treaty<App>("localhost:3000").api;
