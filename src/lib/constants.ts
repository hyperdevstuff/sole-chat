// Room TTL (Time-to-Live) Configuration

/** Room TTL in seconds (10 minutes) */
export const ROOM_TTL_SECONDS = 60 * 10;

/** Maximum session age in seconds (7 days) - prevents indefinite keep-alives */
export const MAX_SESSION_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Grace period in seconds for leave/rejoin (30 seconds) */
export const LEAVE_GRACE_TTL_SECONDS = 30;

// UI Timeouts (in milliseconds)

/** Hold-to-destroy button timeout (2 seconds) */
export const DESTROY_HOLD_MS = 2000;

/** Typing indicator timeout (2 seconds) */
export const TYPING_TIMEOUT_MS = 2000;

/** Copy-to-clipboard feedback duration (2 seconds) */
export const COPY_FEEDBACK_MS = 2000;

// Warning Thresholds (in seconds)

/** Show "1 minute remaining" warning at this threshold */
export const WARNING_THRESHOLD_60S = 60;

/** Show "10 seconds remaining" warning at this threshold */
export const WARNING_THRESHOLD_10S = 10;

// Room Constraints

/** Maximum number of users per room */
export const MAX_USERS_PER_ROOM = 10;

/** Maximum users for private (E2EE) rooms */
export const MAX_USERS_PRIVATE = 2;

/** Maximum users for group rooms (no E2EE) */
export const MAX_USERS_GROUP = 10;

// Room Types

/** Room type definitions */
export type RoomType = "private" | "group";

/** Room type configuration */
export const ROOM_TYPE_CONFIG = {
  private: {
    maxUsers: 2,
    e2ee: true,
    label: "Private Chat",
    description: "2 users, end-to-end encrypted",
  },
  group: {
    maxUsers: 10,
    e2ee: false,
    label: "Group Room",
    description: "Up to 10 users, no encryption",
  },
} as const;
