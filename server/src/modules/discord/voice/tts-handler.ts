/**
 * ElevenLabs text-to-speech handler.
 *
 * Uses the ElevenLabs WebSocket streaming API for low-latency TTS.
 * Following the pattern from the EthosAI reference implementation:
 *  1. Open WebSocket to ElevenLabs streaming endpoint
 *  2. Send initial config with voice settings
 *  3. Send text chunk(s)
 *  4. Flush by sending empty text
 *  5. Collect base64 PCM audio chunks
 *  6. Return concatenated 24kHz mono 16-bit PCM buffer
 *
 * Output format: 24kHz mono 16-bit signed little-endian PCM.
 * This must be resampled to 48kHz stereo before playing on Discord.
 *
 * @see audio-player.ts resample24kMonoTo48kStereo()
 */

import WebSocket from "ws";
import {
  ELEVENLABS_API_KEY,
  ELEVENLABS_VOICE_ID,
  ELEVENLABS_MODEL_ID,
  ELEVENLABS_DEFAULT_STABILITY,
  ELEVENLABS_DEFAULT_SIMILARITY_BOOST,
  ELEVENLABS_OUTPUT_FORMAT,
  ELEVENLABS_TIMEOUT_MS,
  ELEVENLABS_WS_URL,
} from "../../../../constants/elevenlabs.constants";

/** Options for generating speech. */
interface GenerateSpeechOptions {
  /** ElevenLabs voice ID. Defaults to ELEVENLABS_VOICE_ID. */
  voiceId?: string;
  /** Voice stability (0-1). */
  stability?: number;
  /** Voice similarity boost (0-1). */
  similarityBoost?: number;
  /** Model ID for TTS. */
  modelId?: string;
}

/**
 * Generate speech from text using ElevenLabs WebSocket streaming API.
 *
 * Returns a raw 24kHz mono 16-bit PCM buffer ready for resampling.
 *
 * @param text - The text to synthesize
 * @param options - Optional voice settings overrides
 * @returns Raw PCM audio buffer (24kHz mono 16-bit LE)
 * @throws If the API key is not set or the request fails
 */
export async function generateSpeech(
  text: string,
  options: GenerateSpeechOptions = {},
): Promise<Buffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error(
      "ELEVENLABS_API_KEY is not set. " +
      "Please add it to your .env.local file."
    );
  }

  const voiceId = options.voiceId ?? ELEVENLABS_VOICE_ID;
  const modelId = options.modelId ?? ELEVENLABS_MODEL_ID;
  const stability = options.stability ?? ELEVENLABS_DEFAULT_STABILITY;
  const similarityBoost = options.similarityBoost ?? ELEVENLABS_DEFAULT_SIMILARITY_BOOST;

  const url =
    `${ELEVENLABS_WS_URL}/${voiceId}/stream-input` +
    `?model_id=${modelId}` +
    `&output_format=${ELEVENLABS_OUTPUT_FORMAT}`;

  return new Promise<Buffer>((resolve, reject) => {
    const audioChunks: Buffer[] = [];
    let resolved = false;

    const ws = new WebSocket(url);

    // Safety timeout in case isFinal never arrives
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        ws.close();

        if (audioChunks.length > 0) {
          // Return whatever audio we collected
          console.warn("[TTS] Timeout waiting for isFinal, returning partial audio.");
          resolve(Buffer.concat(audioChunks));
        } else {
          reject(new Error("TTS generation timed out with no audio received."));
        }
      }
    }, ELEVENLABS_TIMEOUT_MS);

    ws.on("open", () => {
      // Send initial configuration (BOS - beginning of stream)
      ws.send(
        JSON.stringify({
          text: " ",
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
          },
          xi_api_key: ELEVENLABS_API_KEY,
          output_format: ELEVENLABS_OUTPUT_FORMAT,
          generation_config: {
            chunk_length_schedule: [120, 160, 250, 290],
          },
        }),
      );

      // Send the actual text
      ws.send(JSON.stringify({ text }));

      // Flush / EOS (end of stream) — empty text signals no more input
      ws.send(JSON.stringify({ text: "" }));
    });

    ws.on("message", (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString()) as {
          audio?: string;
          isFinal?: boolean;
          error?: string;
        };

        if (msg.error) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            ws.close();
            reject(new Error(`ElevenLabs API error: ${msg.error}`));
          }
          return;
        }

        // Collect audio chunks (base64 encoded PCM)
        if (msg.audio) {
          audioChunks.push(Buffer.from(msg.audio, "base64"));
        }

        // Final message — all audio has been received
        if (msg.isFinal) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            ws.close();
            resolve(Buffer.concat(audioChunks));
          }
        }
      } catch (err) {
        console.error("[TTS] Failed to parse WebSocket message:", err);
      }
    });

    ws.on("error", (err: Error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error(`ElevenLabs WebSocket error: ${err.message}`));
      }
    });

    ws.on("close", () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);

        if (audioChunks.length > 0) {
          resolve(Buffer.concat(audioChunks));
        } else {
          reject(new Error("ElevenLabs WebSocket closed without sending audio."));
        }
      }
    });
  });
}

/**
 * Check whether the ElevenLabs API key is configured.
 */
export function isTTSConfigured(): boolean {
  return ELEVENLABS_API_KEY.length > 0;
}
