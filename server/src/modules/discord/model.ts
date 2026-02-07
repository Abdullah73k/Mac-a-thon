/**
 * Elysia TypeBox models for the Discord bot module.
 *
 * Single source of truth for runtime validation and TypeScript types
 * at API/WebSocket boundaries.
 *
 * Convention: export the TypeBox schema AND its static type together.
 * Register on Elysia via `.model({ ... })` and reference by name.
 */

import { t } from "elysia";

// ---------------------------------------------------------------------------
// Shared Models
// ---------------------------------------------------------------------------

export const DiscordBotStatusModel = t.Union([
  t.Literal("offline"),
  t.Literal("connecting"),
  t.Literal("online"),
  t.Literal("reconnecting"),
  t.Literal("error"),
]);
export type DiscordBotStatusModel = typeof DiscordBotStatusModel.static;

// ---------------------------------------------------------------------------
// Request Bodies
// ---------------------------------------------------------------------------

/** Request body for joining a voice channel. */
export const JoinVoiceBody = t.Object({
  guildId: t.String({ minLength: 1 }),
  channelId: t.String({ minLength: 1 }),
});
export type JoinVoiceBody = typeof JoinVoiceBody.static;

/** Request body for leaving a voice channel. */
export const LeaveVoiceBody = t.Object({
  guildId: t.String({ minLength: 1 }),
});
export type LeaveVoiceBody = typeof LeaveVoiceBody.static;

/** Request body for making the bot speak via TTS. */
export const SpeakBody = t.Object({
  guildId: t.String({ minLength: 1 }),
  text: t.String({ minLength: 1, maxLength: 5000 }),
  voiceId: t.Optional(t.String()),
});
export type SpeakBody = typeof SpeakBody.static;

/** Request body for stopping speech. */
export const StopSpeakingBody = t.Object({
  guildId: t.String({ minLength: 1 }),
});
export type StopSpeakingBody = typeof StopSpeakingBody.static;

/** Request body for registering an agent voice profile. */
export const RegisterAgentBody = t.Object({
  agentId: t.String({ minLength: 1 }),
  voiceId: t.String({ minLength: 1 }),
  displayName: t.String({ minLength: 1 }),
});
export type RegisterAgentBody = typeof RegisterAgentBody.static;

/** Request body for making an agent speak. */
export const SpeakAsAgentBody = t.Object({
  guildId: t.String({ minLength: 1 }),
  agentId: t.String({ minLength: 1 }),
  text: t.String({ minLength: 1, maxLength: 5000 }),
});
export type SpeakAsAgentBody = typeof SpeakAsAgentBody.static;

/** Request body for creating test session channels. */
export const CreateTestSessionBody = t.Object({
  guildId: t.String({ minLength: 1 }),
  testId: t.String({ minLength: 1 }),
});
export type CreateTestSessionBody = typeof CreateTestSessionBody.static;

/** Path parameter for test session routes. */
export const TestSessionParam = t.Object({
  guildId: t.String({ minLength: 1 }),
  testId: t.String({ minLength: 1 }),
});
export type TestSessionParam = typeof TestSessionParam.static;

// ---------------------------------------------------------------------------
// Response Models
// ---------------------------------------------------------------------------

/** Voice connection state response. */
export const VoiceConnectionResponse = t.Object({
  guildId: t.String(),
  channelId: t.String(),
  isSpeaking: t.Boolean(),
});
export type VoiceConnectionResponse = typeof VoiceConnectionResponse.static;

/** Bot status response with guild and voice info. */
export const BotStatusResponse = t.Object({
  status: DiscordBotStatusModel,
  guilds: t.Array(t.String()),
  voiceConnections: t.Array(VoiceConnectionResponse),
});
export type BotStatusResponse = typeof BotStatusResponse.static;

/** Speech result response. */
export const SpeechResultResponse = t.Object({
  success: t.Boolean(),
  durationMs: t.Number(),
});
export type SpeechResultResponse = typeof SpeechResultResponse.static;

/** Test session channels response. */
export const TestSessionResponse = t.Object({
  textChannelId: t.String(),
  voiceChannelId: t.String(),
  categoryId: t.String(),
  label: t.String(),
});
export type TestSessionResponse = typeof TestSessionResponse.static;

/** Agent voice profile response. */
export const AgentProfileResponse = t.Object({
  agentId: t.String(),
  voiceId: t.String(),
  displayName: t.String(),
});
export type AgentProfileResponse = typeof AgentProfileResponse.static;

/** Generic success response. */
export const DiscordSuccessResponse = t.Object({
  success: t.Boolean(),
  message: t.String(),
});
export type DiscordSuccessResponse = typeof DiscordSuccessResponse.static;

/** Generic error response. */
export const DiscordErrorResponse = t.Object({
  success: t.Literal(false),
  message: t.String(),
  code: t.Optional(t.String()),
});
export type DiscordErrorResponse = typeof DiscordErrorResponse.static;

// ---------------------------------------------------------------------------
// WebSocket Models
// ---------------------------------------------------------------------------

/** Client -> Server: subscribe to a guild's Discord events. */
export const DiscordWsSubscribeModel = t.Object({
  type: t.Literal("subscribe"),
  guildId: t.String(),
});

/** Client -> Server: unsubscribe from a guild's Discord events. */
export const DiscordWsUnsubscribeModel = t.Object({
  type: t.Literal("unsubscribe"),
  guildId: t.String(),
});

/** Client -> Server: keepalive ping. */
export const DiscordWsPingModel = t.Object({
  type: t.Literal("ping"),
});

/** Union of all client-to-server WS messages. */
export const DiscordWsClientMessageModel = t.Union([
  DiscordWsSubscribeModel,
  DiscordWsUnsubscribeModel,
  DiscordWsPingModel,
]);
export type DiscordWsClientMessageModel = typeof DiscordWsClientMessageModel.static;
