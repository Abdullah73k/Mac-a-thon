/**
 * Elysia TypeBox models for the Minecraft bot module.
 *
 * These serve as the single source of truth for both runtime validation
 * and TypeScript types at API/WebSocket boundaries.
 *
 * Convention: export the TypeBox schema AND its static type together.
 * Register on Elysia via `.model({ ... })` and reference by name.
 */

import { t } from "elysia";

// ---------------------------------------------------------------------------
// Shared Primitives
// ---------------------------------------------------------------------------

export const Vec3Model = t.Object({
  x: t.Number(),
  y: t.Number(),
  z: t.Number(),
});
export type Vec3Model = typeof Vec3Model.static;

export const OrientationModel = t.Object({
  yaw: t.Number(),
  pitch: t.Number(),
});
export type OrientationModel = typeof OrientationModel.static;

export const InventorySlotModel = t.Object({
  slot: t.Number(),
  name: t.String(),
  count: t.Number(),
});
export type InventorySlotModel = typeof InventorySlotModel.static;

// ---------------------------------------------------------------------------
// Bot Lifecycle Models
// ---------------------------------------------------------------------------

export const BotStatusModel = t.Union([
  t.Literal("connecting"),
  t.Literal("connected"),
  t.Literal("spawned"),
  t.Literal("disconnected"),
  t.Literal("error"),
]);
export type BotStatusModel = typeof BotStatusModel.static;

/** Request body for creating/connecting a new bot. */
export const CreateBotBody = t.Object({
  username: t.String({ minLength: 1, maxLength: 16 }),
  host: t.Optional(t.String()),
  port: t.Optional(t.Number({ minimum: 1, maximum: 65535 })),
  version: t.Optional(t.String()),
});
export type CreateBotBody = typeof CreateBotBody.static;

/** Response for a single bot's state. */
export const BotStateResponse = t.Object({
  botId: t.String(),
  username: t.String(),
  status: BotStatusModel,
  position: t.Nullable(Vec3Model),
  orientation: t.Nullable(OrientationModel),
  health: t.Nullable(t.Number()),
  food: t.Nullable(t.Number()),
  gameMode: t.Nullable(t.String()),
  inventory: t.Array(InventorySlotModel),
  lastUpdatedAt: t.String(),
});
export type BotStateResponse = typeof BotStateResponse.static;

/** Response for listing all bots. */
export const BotListResponse = t.Object({
  bots: t.Array(BotStateResponse),
  count: t.Number(),
});
export type BotListResponse = typeof BotListResponse.static;

/** Generic success response. */
export const SuccessResponse = t.Object({
  success: t.Boolean(),
  message: t.String(),
});
export type SuccessResponse = typeof SuccessResponse.static;

/** Generic error response. */
export const ErrorResponse = t.Object({
  success: t.Literal(false),
  message: t.String(),
  code: t.Optional(t.String()),
});
export type ErrorResponse = typeof ErrorResponse.static;

/** Path parameter for bot-specific routes. */
export const BotIdParam = t.Object({
  botId: t.String({ minLength: 1 }),
});
export type BotIdParam = typeof BotIdParam.static;

// ---------------------------------------------------------------------------
// Action Models
// ---------------------------------------------------------------------------

const BlockFaceModel = t.Union([
  t.Literal("top"),
  t.Literal("bottom"),
  t.Literal("north"),
  t.Literal("south"),
  t.Literal("east"),
  t.Literal("west"),
]);

const EquipDestinationModel = t.Union([
  t.Literal("hand"),
  t.Literal("off-hand"),
  t.Literal("head"),
  t.Literal("torso"),
  t.Literal("legs"),
  t.Literal("feet"),
]);

const MoveToActionModel = t.Object({
  type: t.Literal("move-to"),
  botId: t.String(),
  position: Vec3Model,
});

const JumpActionModel = t.Object({
  type: t.Literal("jump"),
  botId: t.String(),
});

const SprintActionModel = t.Object({
  type: t.Literal("sprint"),
  botId: t.String(),
  enabled: t.Boolean(),
});

const SneakActionModel = t.Object({
  type: t.Literal("sneak"),
  botId: t.String(),
  enabled: t.Boolean(),
});

const LookAtActionModel = t.Object({
  type: t.Literal("look-at"),
  botId: t.String(),
  position: Vec3Model,
});

const DigActionModel = t.Object({
  type: t.Literal("dig"),
  botId: t.String(),
  position: Vec3Model,
});

const PlaceBlockActionModel = t.Object({
  type: t.Literal("place-block"),
  botId: t.String(),
  position: Vec3Model,
  face: BlockFaceModel,
});

const AttackActionModel = t.Object({
  type: t.Literal("attack"),
  botId: t.String(),
  target: t.String(),
});

const EquipActionModel = t.Object({
  type: t.Literal("equip"),
  botId: t.String(),
  itemName: t.String(),
  destination: EquipDestinationModel,
});

const UseItemActionModel = t.Object({
  type: t.Literal("use-item"),
  botId: t.String(),
});

const OpenContainerActionModel = t.Object({
  type: t.Literal("open-container"),
  botId: t.String(),
  position: Vec3Model,
});

const InteractEntityActionModel = t.Object({
  type: t.Literal("interact-entity"),
  botId: t.String(),
  target: t.String(),
});

const SendChatActionModel = t.Object({
  type: t.Literal("send-chat"),
  botId: t.String(),
  message: t.String({ minLength: 1, maxLength: 256 }),
});

/** Discriminated union of all bot action models. */
export const BotActionModel = t.Union([
  MoveToActionModel,
  JumpActionModel,
  SprintActionModel,
  SneakActionModel,
  LookAtActionModel,
  DigActionModel,
  PlaceBlockActionModel,
  AttackActionModel,
  EquipActionModel,
  UseItemActionModel,
  OpenContainerActionModel,
  InteractEntityActionModel,
  SendChatActionModel,
]);
export type BotActionModel = typeof BotActionModel.static;

/** Action result returned after execution completes. */
export const ActionResultModel = t.Object({
  botId: t.String(),
  actionType: t.String(),
  status: t.Union([
    t.Literal("success"),
    t.Literal("failure"),
    t.Literal("cancelled"),
  ]),
  message: t.String(),
  durationMs: t.Number(),
  completedAt: t.String(),
});
export type ActionResultModel = typeof ActionResultModel.static;

// ---------------------------------------------------------------------------
// WebSocket Message Models
// ---------------------------------------------------------------------------

/** Client → Server: subscribe to bot state updates. */
export const WsSubscribeModel = t.Object({
  type: t.Literal("subscribe"),
  botIds: t.Array(t.String()),
});

/** Client → Server: unsubscribe from bot updates. */
export const WsUnsubscribeModel = t.Object({
  type: t.Literal("unsubscribe"),
  botIds: t.Array(t.String()),
});

/** Client → Server: execute an action on a bot. */
export const WsExecuteActionModel = t.Object({
  type: t.Literal("execute-action"),
  action: BotActionModel,
});

/** Client → Server: keepalive ping. */
export const WsPingModel = t.Object({
  type: t.Literal("ping"),
});

/** Union of all client-to-server WS messages. */
export const WsClientMessageModel = t.Union([
  WsSubscribeModel,
  WsUnsubscribeModel,
  WsExecuteActionModel,
  WsPingModel,
]);
export type WsClientMessageModel = typeof WsClientMessageModel.static;

/** Server → Client: bot state update. */
export const WsBotStateUpdateModel = t.Object({
  type: t.Literal("bot-state-update"),
  state: BotStateResponse,
});

/** Server → Client: action result. */
export const WsActionResultModel = t.Object({
  type: t.Literal("action-result"),
  result: ActionResultModel,
});

/** Server → Client: generic bot event. */
export const WsBotEventModel = t.Object({
  type: t.Literal("bot-event"),
  botId: t.String(),
  event: t.String(),
  data: t.Record(t.String(), t.Unknown()),
});

/** Server → Client: error message. */
export const WsErrorModel = t.Object({
  type: t.Literal("error"),
  message: t.String(),
  code: t.Optional(t.String()),
});

/** Server → Client: pong response. */
export const WsPongModel = t.Object({
  type: t.Literal("pong"),
});

/** Union of all server-to-client WS messages. */
export const WsServerMessageModel = t.Union([
  WsBotStateUpdateModel,
  WsActionResultModel,
  WsBotEventModel,
  WsErrorModel,
  WsPongModel,
]);
export type WsServerMessageModel = typeof WsServerMessageModel.static;
