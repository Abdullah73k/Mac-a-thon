/**
 * Bot domain types mirroring the backend Minecraft module.
 */

/** 3D coordinate in Minecraft world space. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Orientation angles in degrees. */
export interface Orientation {
  yaw: number;
  pitch: number;
}

/** Possible states of a bot connection. */
export type BotStatus =
  | "connecting"
  | "connected"
  | "spawned"
  | "disconnected"
  | "error";

/** Single inventory slot summary. */
export interface InventorySlot {
  slot: number;
  name: string;
  count: number;
}

/** Runtime snapshot of a single bot's state. */
export interface BotState {
  botId: string;
  username: string;
  status: BotStatus;
  position: Vec3 | null;
  orientation: Orientation | null;
  health: number | null;
  food: number | null;
  gameMode: string | null;
  inventory: InventorySlot[];
  lastUpdatedAt: string;
}

/** All supported action type identifiers. */
export type ActionType =
  | "move-to"
  | "jump"
  | "sprint"
  | "sneak"
  | "look-at"
  | "dig"
  | "place-block"
  | "attack"
  | "equip"
  | "use-item"
  | "open-container"
  | "interact-entity"
  | "send-chat";

/** Outcome status of an executed action. */
export type ActionResultStatus = "success" | "failure" | "cancelled";

/** Result returned after an action completes. */
export interface ActionResult {
  botId: string;
  actionType: ActionType;
  status: ActionResultStatus;
  message: string;
  durationMs: number;
  completedAt: string;
}

/** WebSocket server-to-client message types. */
export type WsServerMessage =
  | { type: "bot-state-update"; state: BotState }
  | { type: "action-result"; result: ActionResult }
  | { type: "bot-event"; botId: string; event: string; data: Record<string, unknown> }
  | { type: "error"; message: string; code?: string }
  | { type: "pong" };
