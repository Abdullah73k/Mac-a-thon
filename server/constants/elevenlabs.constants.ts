/**
 * ElevenLabs TTS configuration constants.
 *
 * All API keys are loaded from environment variables.
 */

/** ElevenLabs API key for text-to-speech. */
export const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? "";

/** Default ElevenLabs voice ID (Rachel). */
export const ELEVENLABS_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";

/** ElevenLabs model ID for TTS generation. */
export const ELEVENLABS_MODEL_ID =
  process.env.ELEVENLABS_MODEL_ID ?? "eleven_monolingual_v1";

/** Default voice stability (0-1). */
export const ELEVENLABS_DEFAULT_STABILITY = 0.5;

/** Default voice similarity boost (0-1). */
export const ELEVENLABS_DEFAULT_SIMILARITY_BOOST = 0.75;

/** Output format for ElevenLabs TTS. */
export const ELEVENLABS_OUTPUT_FORMAT = "pcm_24000";

/** Timeout for TTS generation in milliseconds (15 seconds). */
export const ELEVENLABS_TIMEOUT_MS = 15_000;

/** ElevenLabs WebSocket base URL for streaming TTS. */
export const ELEVENLABS_WS_URL = "wss://api.elevenlabs.io/v1/text-to-speech";
