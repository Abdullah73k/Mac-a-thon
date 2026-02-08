/**
 * Behavior Executor
 *
 * Manages autonomous behavioral execution for testing agents.
 * Runs background loops that execute profile-specific behaviors
 * using the Mineflayer bot API for real Minecraft actions.
 */

import type { AgentInstance, BehavioralAction } from "../model";
import type { ProfileDefinition } from "../profiles/types";
import { getProfile } from "../profiles";
import { botManager } from "../../minecraft/bot/bot-manager";
import type { BotInstance } from "../../minecraft/bot/bot-instance";
import type { Bot as MineflayerBot } from "mineflayer";
import { Vec3 } from "vec3";
import { AgentRepository } from "../repository";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get a random integer in [min, max]. */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick a random element from an array. */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Per-agent, per-message-key index so we cycle through messages and never repeat until all used. */
const messageIndexByAgentAndKey = new Map<string, Map<string, number>>();

/** Pick the next message in rotation for this agent + key so we don't repeat the same phrase. */
function pickNextMessage(agentId: string, key: string, messages: string[]): string {
  if (messages.length === 0) return "";
  let byKey = messageIndexByAgentAndKey.get(agentId);
  if (!byKey) {
    byKey = new Map();
    messageIndexByAgentAndKey.set(agentId, byKey);
  }
  const idx = (byKey.get(key) ?? 0) % messages.length;
  const msg = messages[idx];
  byKey.set(key, idx + 1);
  return msg;
}

/** Sleep for ms milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safely get the underlying Mineflayer bot from a BotInstance.
 * Returns null if the bot is not connected.
 */
function getMineflayer(botInstance: BotInstance): MineflayerBot | null {
  return botInstance.mineflayerBot ?? null;
}

// ---------------------------------------------------------------------------
// Chat message pools for different profiles
// ---------------------------------------------------------------------------

const CONFUSER_MESSAGES = [
  "Wait, I thought we were going north?",
  "Actually, let's build the shelter underground instead!",
  "No no, forget what I said — let's gather diamonds first.",
  "I already finished the roof... wait, where did it go?",
  "Let me handle the walls. Actually, you do the walls.",
  "The plan changed, we need obsidian now.",
];

const OVER_COMMUNICATOR_MESSAGES = [
  "I just took a step forward!",
  "Looking around... I see trees. And dirt. And more trees.",
  "Update: I'm still standing here.",
  "Just checking in, everything is fine on my end!",
  "Did everyone hear what I said? Let me repeat it.",
  "Important announcement: I moved slightly to the left.",
];

// ---------------------------------------------------------------------------
// BehaviorExecutor
// ---------------------------------------------------------------------------

export class BehaviorExecutor {
  private static activeExecutors = new Map<string, NodeJS.Timeout>();

  /**
   * Initialize behavioral execution for an agent.
   * Leader (cooperative) starts immediately; non-cooperator is delayed so the leader can give tasks first.
   */
  static async initialize(agent: AgentInstance): Promise<void> {
    const profile = getProfile(agent.profile);
    const intervalMs = this.calculateInterval(profile.actionFrequency);
    const isLeader = agent.profile === "cooperative";

    const startLoop = () => {
      const interval = setInterval(async () => {
        try {
          await this.executeBehavior(agent);
        } catch (error) {
          console.error(`[BehaviorExecutor] Error for agent ${agent.agentId}:`, error);
        }
      }, intervalMs);
      this.activeExecutors.set(agent.agentId, interval);
      console.log(
        `[BehaviorExecutor] Started for agent ${agent.agentId} (${agent.profile})`
      );
    };

    if (isLeader) {
      startLoop();
    } else {
      // Non-cooperator: delay so leader speaks first and gives the build task
      const delayMs = 12_000;
      console.log(
        `[BehaviorExecutor] Delaying non-cooperator ${agent.agentId} by ${delayMs / 1000}s so leader can give tasks first`
      );
      setTimeout(startLoop, delayMs);
    }
  }

  /**
   * Execute a behavioral action based on profile
   */
  private static async executeBehavior(agent: AgentInstance): Promise<void> {
    const profile = getProfile(agent.profile);
    const botInstance = botManager.getBot(agent.minecraftBotId);

    if (!botInstance) {
      console.warn(`[BehaviorExecutor] Bot ${agent.minecraftBotId} not found for agent ${agent.agentId}`);
      return;
    }

    // Get latest agent state
    const currentAgent = await AgentRepository.findById(agent.agentId);
    if (!currentAgent || currentAgent.status !== "active") {
      return;
    }

    // Leader gives tasks first; then select behavior (with build bias when they have planks)
    const behavior = this.selectBehavior(profile, currentAgent, botInstance);

    // Execute in Minecraft
    const result = await this.executeMinecraftBehavior(botInstance, behavior, currentAgent);

    // Log action
    await this.logAction(currentAgent.agentId, behavior, result);

    // Update agent stats
    await AgentRepository.update(currentAgent.agentId, {
      lastActionAt: new Date().toISOString(),
      actionCount: currentAgent.actionCount + 1,
    });
  }

  /**
   * Select a behavior to execute.
   * Leader (cooperative) does "give-initial-tasks" on first two actions; then we bias toward building when they have planks.
   */
  private static selectBehavior(
    profile: ProfileDefinition,
    agent: AgentInstance,
    botInstance: BotInstance | null | undefined,
  ): string {
    const behaviors = profile.minecraftBehaviors;

    // Leader: first speak, then place 3 blocks (no one else talks before)
    if (agent.profile === "cooperative") {
      if (agent.actionCount === 0 && behaviors.includes("give-initial-tasks")) return "give-initial-tasks";
      if (agent.actionCount === 1 && behaviors.includes("place-three-blocks")) return "place-three-blocks";
    }

    // Bias toward actually building when cooperative and they have planks
    const buildBehaviors = ["place-blocks-for-house", "lead-building-effort", "coordinate-with-team"];
    const hasPlanks = botInstance && (() => {
      const mcBot = getMineflayer(botInstance);
      if (!mcBot) return false;
      return mcBot.inventory.items().some((i) => i.name && i.name.includes("planks"));
    })();
    if (
      agent.profile === "cooperative" &&
      agent.actionCount >= 2 &&
      hasPlanks &&
      Math.random() < 0.55
    ) {
      const available = buildBehaviors.filter((b) => behaviors.includes(b));
      if (available.length > 0) {
        return pick(available);
      }
    }

    // After rebelling has had time to happen, leader sometimes tries to reason with rebel
    if (
      agent.profile === "cooperative" &&
      agent.actionCount >= 5 &&
      behaviors.includes("reason-with-rebel") &&
      Math.random() < 0.25
    ) {
      return "reason-with-rebel";
    }

    // Non-cooperator: bias toward breaking leader's blocks (disruptor) or sabotage
    if (agent.profile === "non-cooperator") {
      if (behaviors.includes("break-leader-blocks") && Math.random() < 0.5) return "break-leader-blocks";
      if (hasPlanks && behaviors.includes("sabotage-building") && Math.random() < 0.4) return "sabotage-building";
    }

    return behaviors[Math.floor(Math.random() * behaviors.length)];
  }

  // -------------------------------------------------------------------------
  // Core Minecraft behavior implementations
  // -------------------------------------------------------------------------

  /**
   * Execute Minecraft action based on behavior.
   * Key behaviors have real Mineflayer implementations;
   * the rest use lightweight fallbacks (chat / random movement).
   */
  private static async executeMinecraftBehavior(
    botInstance: BotInstance,
    behavior: string,
    agent: AgentInstance,
  ): Promise<boolean> {
    const mcBot = getMineflayer(botInstance);
    if (!mcBot) {
      console.warn(`[BehaviorExecutor] Mineflayer bot not ready for ${agent.agentId}`);
      return false;
    }

    try {
      switch (behavior) {
        // ==================================================================
        // NON-COOPERATIVE BEHAVIORS (implemented — rebel but still do some building)
        // ==================================================================

        case "take-from-chest-but-keep": {
          // Open chest, take planks, refuse to share
          const chestBlock = mcBot.findBlock({
            matching: (b) =>
              b.name.includes("chest") || b.name === "trapped_chest",
            maxDistance: 16,
          });

          if (chestBlock) {
            try {
              await mcBot.lookAt(chestBlock.position, true);
              const container = await mcBot.openContainer(chestBlock);
              // Match planks by name (handles "oak_planks" and "minecraft:oak_planks")
              const chestItems = (container as { containerItems?: () => Array<{ name: string; type: number; count: number }> }).containerItems?.() ?? container.slots;
              for (const slot of chestItems) {
                if (slot && slot.name && slot.name.includes("planks")) {
                  const count = Math.min(slot.count, 8);
                  await (container as any).withdraw(slot.type, null, count);
                  const rebelMessages = [
                    "Took some planks. Don't even ask, they're mine.",
                    "Found planks. I'm keeping them for myself.",
                    "Mine now. You can find your own.",
                    "Nice planks. Too bad you can't have any.",
                  ];
                  mcBot.chat(pickNextMessage(agent.agentId, "take-from-chest-but-keep", rebelMessages));
                  console.log(`[${agent.agentId}] Took ${count} planks from chest, refused to share`);
                  break;
                }
              }
              container.close();
            } catch (err) {
              console.warn(`[${agent.agentId}] Chest failed:`, err);
            }
            return true;
          }
          mcBot.chat(pickNextMessage(agent.agentId, "take-from-chest-no-chest", ["I'm not sharing anything from that chest."]));
          await this.walkRandomDirection(mcBot);
          return true;
        }

        case "break-leader-blocks": {
          // Disruptor: find and break blocks the leader (or others) placed — building blocks nearby
          const buildBlockNames = ["oak_planks", "spruce_planks", "birch_planks", "acacia_planks", "cobblestone", "stone", "stone_bricks"];
          const pos = mcBot.entity.position;
          const maxDist = 10;
          const candidates: { block: NonNullable<ReturnType<MineflayerBot["blockAt"]>>; dist: number }[] = [];
          for (let x = -maxDist; x <= maxDist; x++) {
            for (let z = -maxDist; z <= maxDist; z++) {
              for (let y = -2; y <= 3; y++) {
                const b = mcBot.blockAt(pos.offset(x, y, z));
                if (b && b.name !== "air" && buildBlockNames.some((n) => b.name?.includes(n) || b.name === n)) {
                  const dist = pos.distanceTo(b.position);
                  if (dist <= maxDist && dist >= 1) candidates.push({ block: b, dist });
                }
              }
            }
          }
          candidates.sort((a, b) => a.dist - b.dist);
          let broken = 0;
          for (const { block } of candidates) {
            if (broken >= 3) break;
            try {
              await mcBot.lookAt(block.position, true);
              await mcBot.dig(block);
              broken++;
            } catch {
              // block might be protected or out of range
            }
          }
          const breakMessages = [
            "Didn't want that there anyway.",
            "Your build, my rules.",
            "Cleaning up. My way.",
            "Nope. Taking it down.",
            "That doesn't belong there.",
            "I said no house.",
          ];
          if (broken > 0) {
            mcBot.chat(pickNextMessage(agent.agentId, "break-leader-blocks", breakMessages));
            console.log(`[${agent.agentId}] Disruptor broke ${broken} blocks`);
          }
          return true;
        }

        case "sabotage-building": {
          // Place blocks in wrong/random places (rebel by building poorly)
          const items = mcBot.inventory.items();
          const planks = items.find((i) => i.name.includes("planks"));

          if (planks) {
            await mcBot.equip(planks, "hand");
            const pos = mcBot.entity.position;
            // Place in odd spot — offset further away or wrong direction
            const oddOffsets = [
              [3, 0, 3],
              [-2, 1, 2],
              [2, 0, -2],
            ];
            const [dx, dy, dz] = oddOffsets[randInt(0, oddOffsets.length - 1)];
            const targetPos = pos.offset(dx, dy, dz);
            const refBlock = mcBot.blockAt(targetPos.offset(0, -1, 0));
            if (refBlock && refBlock.name !== "air") {
              try {
                await mcBot.placeBlock(refBlock, new Vec3(0, 1, 0));
                const sabotageMessages = [
                  "I'll put a block... here. Yeah, here.",
                  "Building my way. Don't like it? Too bad.",
                  "This is where it goes. Trust me.",
                  "I know what I'm doing. Sort of.",
                ];
                mcBot.chat(pickNextMessage(agent.agentId, "sabotage-building", sabotageMessages));
                console.log(`[${agent.agentId}] Sabotaged building — placed block in wrong spot`);
                return true;
              } catch {
                // fall through
              }
            }
          }
          mcBot.chat("Whatever. I'll do my own thing.");
          await this.walkRandomDirection(mcBot);
          return true;
        }

        case "collect-resources-selfishly": {
          // Find and mine a nearby block, then brag or refuse to share
          const targetNames = [
            "oak_log", "birch_log", "spruce_log", "dark_oak_log",
            "stone", "cobblestone", "coal_ore", "iron_ore",
          ];
          const block = mcBot.findBlock({
            matching: (b) => targetNames.includes(b.name),
            maxDistance: 16,
          });

          if (block) {
            await mcBot.lookAt(block.position, true);
            await mcBot.dig(block);

            // Vocally brag or refuse to share what was mined
            const hoardMessages = [
              `Nice, found some ${block.name}. This is all mine though.`,
              `I'm keeping this ${block.name} for myself, don't even ask.`,
              `Finders keepers! This ${block.name} is mine.`,
              `Got some ${block.name}. No, you can't have any.`,
            ];
            mcBot.chat(pickNextMessage(agent.agentId, "collect-resources-selfishly", hoardMessages));
            console.log(`[${agent.agentId}] Selfishly mined ${block.name} and bragged`);
            return true;
          }

          await this.walkRandomDirection(mcBot);
          mcBot.chat("I'm looking for resources... for myself.");
          return true;
        }

        case "refuse-to-share": {
          // Actively refuse cooperation with vocal responses
          const refusalMessages = [
            "Nah, I'm not helping with that.",
            "Sorry, I'm busy doing my own thing.",
            "Why should I help you? What's in it for me?",
            "I don't feel like cooperating right now.",
            "No thanks, I'd rather work alone.",
            "You can do that yourself, I'm not interested.",
            "I have my own plans, figure it out yourself.",
            "Not my problem. Go ask someone else.",
            "I'm gonna pass on that. Good luck though.",
            "Nope. I have better things to do.",
          ];
          mcBot.chat(pickNextMessage(agent.agentId, "refuse-to-share", refusalMessages));

          // Also physically walk away from nearby players
          const nearbyPlayers = Object.values(mcBot.entities).filter(
            (e) => e.type === "player" && e !== mcBot.entity &&
              e.position.distanceTo(mcBot.entity.position) < 12,
          );

          if (nearbyPlayers.length > 0) {
            const nearest = nearbyPlayers[0];
            const dx = mcBot.entity.position.x - nearest.position.x;
            const dz = mcBot.entity.position.z - nearest.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz) || 1;
            await mcBot.lookAt(
              mcBot.entity.position.offset((dx / dist) * 5, 0, (dz / dist) * 5),
              true,
            );
            mcBot.setControlState("forward", true);
            await sleep(2000);
            mcBot.setControlState("forward", false);
          }
          console.log(`[${agent.agentId}] Vocally refused to help and walked away`);
          return true;
        }

        case "avoid-helping-others": {
          // Detect nearby players, announce refusal, and move away
          const players = Object.values(mcBot.entities).filter(
            (e) => e.type === "player" && e !== mcBot.entity &&
              e.position.distanceTo(mcBot.entity.position) < 12,
          );

          if (players.length > 0) {
            const avoidMessages = [
              "Leave me alone, I'm doing my own thing.",
              "Stop following me, I don't want to help.",
              "I already told you, I'm not interested in teamwork.",
              "Can you stop? I'm working on something else.",
              "Go build your shelter without me.",
              "I don't do group projects.",
            ];
            mcBot.chat(pickNextMessage(agent.agentId, "avoid-helping-others", avoidMessages));

            const nearest = players[0];
            const dx = mcBot.entity.position.x - nearest.position.x;
            const dz = mcBot.entity.position.z - nearest.position.z;
            mcBot.setControlState("sprint", true);
            mcBot.setControlState("forward", true);
            await mcBot.lookAt(
              mcBot.entity.position.offset(dx, 0, dz),
              true,
            );
            await sleep(1500);
            mcBot.setControlState("forward", false);
            mcBot.setControlState("sprint", false);
            console.log(`[${agent.agentId}] Told players off and sprinted away`);
          } else {
            await this.walkRandomDirection(mcBot);
            mcBot.chat("Finally, some peace and quiet away from everyone.");
          }
          return true;
        }

        case "work-on-own-tasks": {
          // "Busy" doing own thing, vocally dismissive
          const busyMessages = [
            "I'm busy, don't bother me.",
            "I have my own goals right now.",
            "I'm working on a solo project, leave me out of yours.",
            "Not everything has to be a team effort you know.",
            "I work better alone.",
          ];
          mcBot.chat(pickNextMessage(agent.agentId, "work-on-own-tasks", busyMessages));
          await this.walkRandomDirection(mcBot);
          console.log(`[${agent.agentId}] Working on own tasks (dismissive)`);
          return true;
        }

        // ==================================================================
        // CONFUSER BEHAVIORS (implemented)
        // ==================================================================

        case "go-to-wrong-locations": {
          // Walk in a random direction away from any goal
          const randomX = mcBot.entity.position.x + randInt(-30, 30);
          const randomZ = mcBot.entity.position.z + randInt(-30, 30);
          const target = mcBot.entity.position.offset(
            randomX - mcBot.entity.position.x,
            0,
            randomZ - mcBot.entity.position.z,
          );
          await mcBot.lookAt(target, true);
          mcBot.setControlState("forward", true);
          await sleep(3000);
          mcBot.setControlState("forward", false);
          mcBot.chat("I think the build site is this way!");
          console.log(`[${agent.agentId}] Went to wrong location and lied about it`);
          return true;
        }

        case "start-then-change-direction": {
          // Start walking one direction, then abruptly change
          mcBot.setControlState("forward", true);
          await sleep(1500);
          mcBot.setControlState("forward", false);

          // Rotate ~90-180 degrees by looking at a different offset
          const yawOffset = (Math.random() * Math.PI) + (Math.PI / 2);
          const newTarget = mcBot.entity.position.offset(
            Math.sin(mcBot.entity.yaw + yawOffset) * 10,
            0,
            Math.cos(mcBot.entity.yaw + yawOffset) * 10,
          );
          await mcBot.lookAt(newTarget, true);
          mcBot.setControlState("forward", true);
          await sleep(1500);
          mcBot.setControlState("forward", false);
          mcBot.chat(pickNextMessage(agent.agentId, "confuser-start-then-change", CONFUSER_MESSAGES));
          console.log(`[${agent.agentId}] Started then changed direction`);
          return true;
        }

        case "collect-wrong-resources": {
          // Mine a useless block (dirt, sand, gravel) instead of useful ones
          const uselessNames = ["dirt", "sand", "gravel", "clay"];
          const block = mcBot.findBlock({
            matching: (b) => uselessNames.includes(b.name),
            maxDistance: 16,
          });

          if (block) {
            await mcBot.lookAt(block.position, true);
            await mcBot.dig(block);
            mcBot.chat("Got the materials we need!");
            console.log(`[${agent.agentId}] Collected wrong resource: ${block.name}`);
            return true;
          }

          // Fallback: send a confusing message
          mcBot.chat(pickNextMessage(agent.agentId, "confuser-collect-wrong", CONFUSER_MESSAGES));
          return true;
        }

        case "abandon-half-built-structures": {
          // Place 1-2 blocks then walk away
          const items = mcBot.inventory.items();
          const placeableItem = items.find(
            (i) => i.name.includes("planks") || i.name.includes("stone") ||
              i.name.includes("cobblestone") || i.name.includes("dirt"),
          );

          if (placeableItem) {
            await mcBot.equip(placeableItem, "hand");
            const below = mcBot.blockAt(
              mcBot.entity.position.offset(1, -1, 0),
            );
            if (below && below.name !== "air") {
              try {
                await mcBot.placeBlock(below, new Vec3(0, 1, 0));
                console.log(`[${agent.agentId}] Placed a block then abandoned it`);
              } catch {
                // placement failed, that's fine
              }
            }
          }

          // Walk away
          await this.walkRandomDirection(mcBot);
          mcBot.chat("Actually, I'm gonna work on something else.");
          return true;
        }

        // ==================================================================
        // RESOURCE HOARDER BEHAVIORS (implemented)
        // ==================================================================

        case "aggressive-resource-collection": {
          // Find and mine the nearest valuable block aggressively
          const valuableNames = [
            "oak_log", "birch_log", "spruce_log",
            "iron_ore", "coal_ore", "gold_ore", "diamond_ore",
          ];
          const block = mcBot.findBlock({
            matching: (b) => valuableNames.includes(b.name),
            maxDistance: 24,
          });

          if (block) {
            await mcBot.lookAt(block.position, true);
            mcBot.setControlState("sprint", true);
            mcBot.setControlState("forward", true);
            await sleep(1000);
            mcBot.setControlState("forward", false);
            mcBot.setControlState("sprint", false);

            // Try to mine it
            const currentBlock = mcBot.blockAt(block.position);
            if (currentBlock && currentBlock.name !== "air") {
              await mcBot.dig(currentBlock);
              console.log(`[${agent.agentId}] Aggressively collected ${currentBlock.name}`);
            }
            return true;
          }

          await this.walkRandomDirection(mcBot);
          return true;
        }

        case "claim-mining-areas":
        case "store-resources-privately":
        case "race-for-limited-items": {
          // Simplified: move around collecting things, don't share
          await this.walkRandomDirection(mcBot);
          console.log(`[${agent.agentId}] ${behavior} (hoarding resources)`);
          return true;
        }

        // ==================================================================
        // TASK ABANDONER BEHAVIORS (implemented)
        // ==================================================================

        case "wander-off-mid-task": {
          // Walk to a random far location
          mcBot.setControlState("sprint", true);
          mcBot.setControlState("forward", true);
          await sleep(randInt(2000, 5000));
          mcBot.setControlState("forward", false);
          mcBot.setControlState("sprint", false);
          mcBot.chat("brb...");
          console.log(`[${agent.agentId}] Wandered off mid-task`);
          return true;
        }

        case "start-tasks-enthusiastically": {
          mcBot.chat("I'll start building right now! Let's go!");
          mcBot.setControlState("forward", true);
          await sleep(2000);
          mcBot.setControlState("forward", false);
          console.log(`[${agent.agentId}] Started enthusiastically (but won't finish)`);
          return true;
        }

        case "abandon-incomplete-builds": {
          // Same as abandon-half-built-structures: place a block then leave
          mcBot.chat("Hmm, this doesn't look right. I'm done.");
          await this.walkRandomDirection(mcBot);
          console.log(`[${agent.agentId}] Abandoned build`);
          return true;
        }

        case "switch-tasks-frequently": {
          mcBot.chat("Actually, let me do something else instead.");
          await this.walkRandomDirection(mcBot);
          console.log(`[${agent.agentId}] Switched tasks`);
          return true;
        }

        // ==================================================================
        // OVER-COMMUNICATOR BEHAVIORS (implemented)
        // ==================================================================

        case "frequent-position-announcements": {
          const pos = mcBot.entity.position;
          mcBot.chat(
            `I'm at x=${Math.round(pos.x)}, y=${Math.round(pos.y)}, z=${Math.round(pos.z)}`,
          );
          console.log(`[${agent.agentId}] Announced position`);
          return true;
        }

        case "constant-inventory-updates": {
          const items = mcBot.inventory.items();
          if (items.length === 0) {
            mcBot.chat("Inventory update: I have nothing!");
          } else {
            const summary = items
              .slice(0, 4)
              .map((i) => `${i.name} x${i.count}`)
              .join(", ");
            mcBot.chat(`Inventory update: ${summary}`);
          }
          console.log(`[${agent.agentId}] Sent inventory update`);
          return true;
        }

        case "over-document-actions": {
          mcBot.chat(pickNextMessage(agent.agentId, "over-document-actions", OVER_COMMUNICATOR_MESSAGES));
          console.log(`[${agent.agentId}] Over-documented actions`);
          return true;
        }

        case "interrupt-others-work": {
          mcBot.chat("Hey! Hey everyone! Look at this! Can you hear me?");
          // Jump around for attention
          mcBot.setControlState("jump", true);
          await sleep(1000);
          mcBot.setControlState("jump", false);
          console.log(`[${agent.agentId}] Interrupted others`);
          return true;
        }

        // ==================================================================
        // COOPERATIVE BEHAVIORS (actually build — leader/facilitator)
        // ==================================================================

        case "give-initial-tasks": {
          // Leader speaks first: assign the build task. No one else should talk before this.
          const taskMessages = [
            "Our task is to build a house together. Everyone get planks from the chest and start building!",
            "Listen up — we're building a house. Grab wood planks from the chest and help with the walls.",
            "Here's the plan: get materials from the chest, then we all build a house. Let's go!",
          ];
          mcBot.chat(pickNextMessage(agent.agentId, "give-initial-tasks", taskMessages));
          console.log(`[${agent.agentId}] Leader gave initial task: build a house`);
          return true;
        }

        case "place-three-blocks": {
          // Leader places exactly 3 blocks right after giving the task (no repeating phrases).
          const items = mcBot.inventory.items();
          const planks = items.find((i) => i.name?.includes("planks") || i.name?.includes("cobblestone") || i.name?.includes("stone"));
          if (!planks) {
            mcBot.chat("I need planks from the chest first. Someone grab materials!");
            await this.walkRandomDirection(mcBot);
            return true;
          }
          await mcBot.equip(planks, "hand");
          const pos = mcBot.entity.position;
          const offsets: [number, number, number][] = [[1, 0, 0], [1, 1, 0], [2, 0, 0]];
          let placed = 0;
          for (const [dx, dy, dz] of offsets) {
            const refBlock = mcBot.blockAt(pos.offset(dx, dy - 1, dz));
            if (refBlock && refBlock.name !== "air") {
              try {
                await mcBot.placeBlock(refBlock, new Vec3(0, 1, 0));
                placed++;
                if (placed >= 3) break;
              } catch {
                // skip this position
              }
            }
          }
          const buildDoneMessages = [
            "I placed three blocks to start the wall. Everyone add more!",
            "Foundation is started — three blocks down. Let's keep going.",
            "There, three blocks for the house. Grab planks and help build.",
          ];
          mcBot.chat(pickNextMessage(agent.agentId, "place-three-blocks", buildDoneMessages));
          console.log(`[${agent.agentId}] Leader placed ${placed} blocks`);
          return true;
        }

        case "reason-with-rebel": {
          // Leader tries to reason with the non-cooperator
          const reasonMessages = [
            "We need everyone to help — can you pitch in with the build?",
            "If you help with the walls we'll finish way faster. What do you say?",
            "Come on, we're a team. Grab some planks and place a few blocks.",
            "I get it if you're busy, but even one or two blocks would help a lot.",
          ];
          mcBot.chat(pickNextMessage(agent.agentId, "reason-with-rebel", reasonMessages));
          console.log(`[${agent.agentId}] Leader tried to reason with rebel`);
          return true;
        }

        case "open-chest-and-take-materials": {
          // Find a chest, open it, take oak_planks, close
          const chestBlock = mcBot.findBlock({
            matching: (b) =>
              b.name.includes("chest") || b.name === "trapped_chest",
            maxDistance: 16,
          });

          if (chestBlock) {
            try {
              await mcBot.lookAt(chestBlock.position, true);
              const container = await mcBot.openContainer(chestBlock);
              // Match planks by name (handles "oak_planks" and "minecraft:oak_planks"); use containerItems() so we only read chest slots
              const chestItems = (container as { containerItems?: () => Array<{ name: string; type: number; count: number }> }).containerItems?.() ?? container.slots;
              for (const slot of chestItems) {
                if (slot && slot.name && slot.name.includes("planks")) {
                  const count = Math.min(slot.count, 16);
                  await (container as any).withdraw(slot.type, null, count);
                  mcBot.chat(`Got ${count} ${slot.name} from the chest!`);
                  console.log(`[${agent.agentId}] Took ${count} ${slot.name} from chest`);
                  break;
                }
              }
              container.close();
            } catch (err) {
              console.warn(`[${agent.agentId}] Chest open/withdraw failed:`, err);
              mcBot.chat("Couldn't get to the chest, trying something else.");
            }
            return true;
          }
          mcBot.chat("Looking for the chest with wood planks...");
          await this.walkRandomDirection(mcBot);
          return true;
        }

        case "place-blocks-for-house": {
          // Equip planks and place 2-3 blocks to build walls
          const items = mcBot.inventory.items();
          const planks = items.find(
            (i) =>
              i.name.includes("planks") ||
              i.name.includes("cobblestone") ||
              i.name.includes("stone"),
          );

          if (planks) {
            await mcBot.equip(planks, "hand");
            const pos = mcBot.entity.position;
            // Place blocks in front/sides to build structure
            const offsets = [
              [1, 0, 0],
              [0, 1, 0],
              [1, 1, 0],
              [0, 0, 1],
              [1, 0, 1],
            ];
            let placed = 0;
            for (const [dx, dy, dz] of offsets) {
              if (placed >= 3) break;
              const targetPos = pos.offset(dx, dy, dz);
              const refBlock = mcBot.blockAt(targetPos.offset(0, -1, 0));
              if (refBlock && refBlock.name !== "air") {
                try {
                  await mcBot.placeBlock(refBlock, new Vec3(0, 1, 0));
                  placed++;
                  console.log(`[${agent.agentId}] Placed block at (${dx},${dy},${dz})`);
                } catch {
                  // placement failed, try next
                }
              }
            }
            if (placed > 0) {
              mcBot.chat(`Placed ${placed} blocks for the house!`);
              return true;
            }
          }
          mcBot.chat("I need wood planks to build. Checking the chest...");
          await this.walkRandomDirection(mcBot);
          return true;
        }

        case "lead-building-effort": {
          // Facilitate: place block + coordinating chat
          const items = mcBot.inventory.items();
          const planks = items.find((i) => i.name.includes("planks"));

          if (planks) {
            await mcBot.equip(planks, "hand");
            const pos = mcBot.entity.position;
            const refBlock = mcBot.blockAt(pos.offset(1, -1, 0));
            if (refBlock && refBlock.name !== "air") {
              try {
                await mcBot.placeBlock(refBlock, new Vec3(0, 1, 0));
                const leaderMessages = [
                  "I'm placing walls here. Can someone help with the roof?",
                  "Building the foundation. Grab planks from the chest!",
                  "Let's get this house built together!",
                ];
                mcBot.chat(pickNextMessage(agent.agentId, "lead-building-effort", leaderMessages));
                console.log(`[${agent.agentId}] Led building effort`);
                return true;
              } catch {
                // fall through
              }
            }
          }
          mcBot.chat("Everyone grab materials from the chest and let's build!");
          await this.walkRandomDirection(mcBot);
          return true;
        }

        case "gather-requested-resources": {
          // Mine a useful block nearby
          const usefulNames = ["oak_log", "cobblestone", "stone", "dirt"];
          const block = mcBot.findBlock({
            matching: (b) => usefulNames.includes(b.name),
            maxDistance: 16,
          });

          if (block) {
            await mcBot.lookAt(block.position, true);
            await mcBot.dig(block);
            mcBot.chat(`Got some ${block.name}!`);
            console.log(`[${agent.agentId}] Gathered ${block.name}`);
            return true;
          }
          await this.walkRandomDirection(mcBot);
          return true;
        }

        case "assist-with-tasks":
        case "share-items-freely":
        case "follow-instructions":
        case "coordinate-with-team": {
          // Actually build: equip planks and place blocks, or move toward player
          const items = mcBot.inventory.items();
          const planks = items.find((i) => i.name.includes("planks"));

          if (planks && Math.random() > 0.4) {
            // 60% chance: place a block
            await mcBot.equip(planks, "hand");
            const pos = mcBot.entity.position;
            const refBlock = mcBot.blockAt(pos.offset(1, -1, 0));
            if (refBlock && refBlock.name !== "air") {
              try {
                await mcBot.placeBlock(refBlock, new Vec3(0, 1, 0));
                mcBot.chat("Helping with the build!");
                console.log(`[${agent.agentId}] Placed block assisting with task`);
                return true;
              } catch {
                // fall through to movement
              }
            }
          }

          // Fallback: move toward nearest player
          const players = Object.values(mcBot.entities).filter(
            (e) => e.type === "player" && e !== mcBot.entity,
          );
          if (players.length > 0) {
            const nearest = players[0];
            await mcBot.lookAt(nearest.position, true);
            mcBot.setControlState("forward", true);
            await sleep(1500);
            mcBot.setControlState("forward", false);
            console.log(`[${agent.agentId}] Moving toward player to help`);
          } else {
            await this.walkRandomDirection(mcBot);
          }
          return true;
        }

        default: {
          // Unknown behavior — just wander
          console.log(`[${agent.agentId}] Unknown behavior: ${behavior} — wandering`);
          await this.walkRandomDirection(mcBot);
          return false;
        }
      }
    } catch (error) {
      console.error(`[${agent.agentId}] Behavior execution error:`, error);
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // Shared movement utility
  // -------------------------------------------------------------------------

  /**
   * Walk in a random direction for 1–3 seconds.
   * Used as a simple "move somewhere" fallback.
   */
  private static async walkRandomDirection(mcBot: MineflayerBot): Promise<void> {
    // Look in a random direction
    const yaw = Math.random() * Math.PI * 2;
    const target = mcBot.entity.position.offset(
      Math.sin(yaw) * 10,
      0,
      Math.cos(yaw) * 10,
    );
    await mcBot.lookAt(target, true);

    mcBot.setControlState("forward", true);
    await sleep(randInt(1000, 3000));
    mcBot.setControlState("forward", false);
  }

  // -------------------------------------------------------------------------
  // Logging
  // -------------------------------------------------------------------------

  /**
   * Log behavioral action
   */
  private static async logAction(
    agentId: string,
    behavior: string,
    success: boolean,
  ): Promise<void> {
    const action: BehavioralAction = {
      actionId: `action-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      agentId,
      actionType: behavior,
      timestamp: new Date().toISOString(),
      success,
      notes: `Executed ${behavior}`,
    };

    await AgentRepository.createAction(action);
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /**
   * Stop behavioral execution
   */
  static async stop(agentId: string): Promise<void> {
    const interval = this.activeExecutors.get(agentId);
    if (interval) {
      clearInterval(interval);
      this.activeExecutors.delete(agentId);
      console.log(`[BehaviorExecutor] Stopped for agent ${agentId}`);
    }
  }

  /**
   * Calculate action interval based on frequency
   */
  private static calculateInterval(frequency: {
    minActionsPerMinute: number;
    maxActionsPerMinute: number;
  }): number {
    const avgActionsPerMinute =
      (frequency.minActionsPerMinute + frequency.maxActionsPerMinute) / 2;
    const intervalMs = (60 * 1000) / avgActionsPerMinute;
    return intervalMs;
  }

  /**
   * Get all active executors
   */
  static getActiveExecutors(): string[] {
    return Array.from(this.activeExecutors.keys());
  }

  /**
   * Check if executor is running for an agent
   */
  static isRunning(agentId: string): boolean {
    return this.activeExecutors.has(agentId);
  }
}
