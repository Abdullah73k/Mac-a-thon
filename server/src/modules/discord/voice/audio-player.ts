/**
 * Audio player for Discord voice channels.
 *
 * Handles:
 *  - Creating and managing AudioPlayer instances per guild
 *  - Resampling 24kHz mono PCM (ElevenLabs output) to 48kHz stereo (Discord input)
 *  - Framing audio into 20ms chunks to prevent Discord.js timing warnings
 *  - Playing raw PCM audio through voice connections
 *  - Stopping playback on demand
 *
 * Audio format pipeline:
 *   ElevenLabs (24kHz mono 16-bit PCM)
 *     → resample to 48kHz stereo 16-bit PCM
 *     → frame into 3840-byte chunks (20ms at 48kHz stereo)
 *     → createAudioResource with StreamType.Raw
 *     → play through AudioPlayer subscribed to VoiceConnection
 */

import { Readable } from "node:stream";
import {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
  NoSubscriberBehavior,
  type AudioPlayer,
} from "@discordjs/voice";
import { getConnection, setSpeakingState } from "./connection-manager";

/**
 * 20ms frame at 48kHz stereo 16-bit PCM.
 * 48000 samples/sec * 2 channels * 2 bytes/sample * 0.020 sec = 3840 bytes.
 */
const FRAME_SIZE = 3840;

/** Per-guild audio players. */
const players = new Map<string, AudioPlayer>();

/**
 * Get or create an AudioPlayer for the specified guild.
 *
 * The player is automatically subscribed to the guild's voice connection.
 * Uses Pause behavior when there are no subscribers so audio
 * resumes seamlessly if the connection comes back.
 */
export function getOrCreatePlayer(guildId: string): AudioPlayer {
  let player = players.get(guildId);

  if (player) return player;

  player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    },
  });

  // Track speaking state
  player.on(AudioPlayerStatus.Playing, () => {
    setSpeakingState(guildId, true);
  });

  player.on(AudioPlayerStatus.Idle, () => {
    setSpeakingState(guildId, false);
  });

  player.on("error", (error) => {
    console.error(`[AudioPlayer] Error in guild ${guildId}:`, error.message);
    setSpeakingState(guildId, false);
  });

  // Subscribe the player to the voice connection
  const connection = getConnection(guildId);
  if (connection) {
    connection.subscribe(player);
  }

  players.set(guildId, player);
  return player;
}

/**
 * Play raw PCM audio (24kHz mono 16-bit) in a guild's voice channel.
 *
 * Resamples to 48kHz stereo and frames into 20ms chunks before playback.
 * Returns a Promise that resolves when playback completes.
 *
 * @param guildId - The guild to play audio in
 * @param pcm24kMono - Raw 24kHz mono 16-bit PCM buffer from ElevenLabs
 * @returns Duration of audio played in milliseconds
 */
export async function playAudio(
  guildId: string,
  pcm24kMono: Buffer,
): Promise<number> {
  const connection = getConnection(guildId);
  if (!connection) {
    throw new Error(`No voice connection for guild "${guildId}".`);
  }

  const player = getOrCreatePlayer(guildId);

  // Ensure player is subscribed to current connection
  connection.subscribe(player);

  // Resample 24kHz mono → 48kHz stereo
  const pcm48kStereo = resample24kMonoTo48kStereo(pcm24kMono);

  // Frame into 20ms chunks for stable playback
  const stream = createFramedStream(pcm48kStereo);

  const resource = createAudioResource(stream, {
    inputType: StreamType.Raw,
    inlineVolume: false,
  });

  player.play(resource);

  // Calculate approximate duration from the resampled buffer
  // 48kHz * 2 channels * 2 bytes = 192000 bytes per second
  const durationMs = Math.round((pcm48kStereo.length / 192000) * 1000);

  // Wait for playback to finish
  await new Promise<void>((resolve) => {
    const onIdle = () => {
      player.removeListener(AudioPlayerStatus.Idle, onIdle);
      player.removeListener("error", onError);
      resolve();
    };

    const onError = () => {
      player.removeListener(AudioPlayerStatus.Idle, onIdle);
      player.removeListener("error", onError);
      resolve();
    };

    // If already idle (very short audio), resolve immediately
    if (player.state.status === AudioPlayerStatus.Idle) {
      resolve();
      return;
    }

    player.on(AudioPlayerStatus.Idle, onIdle);
    player.on("error", onError);
  });

  return durationMs;
}

/**
 * Stop audio playback in a guild immediately.
 *
 * @param guildId - The guild to stop playback in
 * @returns true if playback was stopped, false if nothing was playing
 */
export function stopAudio(guildId: string): boolean {
  const player = players.get(guildId);
  if (!player) return false;

  return player.stop(true);
}

/**
 * Clean up the audio player for a guild.
 */
export function destroyPlayer(guildId: string): void {
  const player = players.get(guildId);
  if (player) {
    player.stop(true);
    players.delete(guildId);
  }
}

/**
 * Whether audio is currently playing in a guild.
 */
export function isPlaying(guildId: string): boolean {
  const player = players.get(guildId);
  if (!player) return false;
  return player.state.status === AudioPlayerStatus.Playing;
}

// ---------------------------------------------------------------------------
// Audio Processing
// ---------------------------------------------------------------------------

/**
 * Resample 24kHz mono 16-bit PCM to 48kHz stereo 16-bit PCM.
 *
 * Uses linear interpolation for 2x upsampling and duplicates
 * the mono channel to both left and right for stereo output.
 *
 * Input:  24000 samples/sec, 1 channel, 16-bit signed LE
 * Output: 48000 samples/sec, 2 channels, 16-bit signed LE
 *
 * Each input sample produces 2 output samples (current + interpolated),
 * each written twice (L + R) = 8 bytes per input sample.
 */
export function resample24kMonoTo48kStereo(input: Buffer): Buffer {
  const sampleCount = input.length / 2; // 16-bit = 2 bytes per sample
  // Each input sample → 2 output time slots × 2 channels × 2 bytes = 8 bytes
  const output = Buffer.alloc(sampleCount * 8);

  let offset = 0;

  for (let i = 0; i < sampleCount; i++) {
    const currentSample = input.readInt16LE(i * 2);
    const nextSample = i + 1 < sampleCount
      ? input.readInt16LE((i + 1) * 2)
      : currentSample;

    // Linear interpolation: midpoint between current and next
    const midSample = Math.round((currentSample + nextSample) / 2);

    // Write current sample (stereo: L + R)
    output.writeInt16LE(currentSample, offset);
    output.writeInt16LE(currentSample, offset + 2);
    offset += 4;

    // Write interpolated sample (stereo: L + R)
    output.writeInt16LE(midSample, offset);
    output.writeInt16LE(midSample, offset + 2);
    offset += 4;
  }

  return output;
}

/**
 * Create a Readable stream that emits exactly 20ms audio frames.
 *
 * Discord.js voice expects evenly-timed frames. Sending an entire
 * buffer at once causes "negative timeout" warnings from the internal
 * scheduler. This wraps the buffer in a stream that pushes one
 * FRAME_SIZE chunk at a time.
 */
function createFramedStream(pcmData: Buffer): Readable {
  let offset = 0;

  return new Readable({
    read() {
      if (offset >= pcmData.length) {
        this.push(null); // End of stream
        return;
      }

      const end = Math.min(offset + FRAME_SIZE, pcmData.length);
      const chunk = pcmData.subarray(offset, end);

      // If the last chunk is smaller than a frame, pad with silence
      if (chunk.length < FRAME_SIZE) {
        const padded = Buffer.alloc(FRAME_SIZE, 0);
        chunk.copy(padded);
        this.push(padded);
      } else {
        this.push(chunk);
      }

      offset = end;
    },
  });
}
