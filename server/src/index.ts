import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import { CLIENT_URL, NODE_ENV } from "../constants/env.constants";
import openapi from "@elysiajs/openapi";
import { llmController } from "./modules/llm";
import { minecraftController } from "./modules/minecraft";
import { minecraftWs } from "./modules/minecraft/ws";
import { agentController } from "./modules/agents";
import { registerAllActions } from "./modules/minecraft/bot/actions/register";
import { startStateObserver } from "./modules/minecraft/bot/state/state-observer";
import { discordController } from "./modules/discord";
import { discordWs } from "./modules/discord/ws";
import { discordClient } from "./modules/discord/client/discord-client";
import { DISCORD_AUTO_START } from "../constants/discord.constants";
import { testingController } from "./modules/testing";
import { testingWs } from "./modules/testing/ws";
import { evaluationController } from "./modules/evaluation";

// Import all metrics to ensure they register themselves
import "./modules/evaluation/metrics/cooperation.metric";
import "./modules/evaluation/metrics/task-completion.metric";
import "./modules/evaluation/metrics/response-latency.metric";
import "./modules/evaluation/metrics/resource-sharing.metric";
import "./modules/evaluation/metrics/communication-quality.metric";

// Initialize action handlers and state observer before starting the server
registerAllActions();
startStateObserver();

const app = new Elysia()
	.use(
		cors({
			origin: [CLIENT_URL],
			methods: ["POST", "PATCH", "GET", "DELETE"],
		}),
	)
	.use(openapi({ enabled: NODE_ENV === "development" }))
	.get("/", () => "Hello Elysia")
	.get("/health", () => ({ status: "ok" }))
	.use(llmController)
	.use(minecraftController)
	.use(minecraftWs)
	.use(agentController)
	.use(discordController)
	.use(discordWs)
	.use(testingController)
	.use(testingWs)
	.use(evaluationController)
	.listen(3000);

console.log(
	`Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

console.log("[Testing Agent System] Initialized with 6 behavioral profiles");
console.log("[Testing Agent System] API endpoints available at /api/agents");
console.log("[Test Orchestration] API endpoints available at /api/testing");
console.log("[Test Orchestration] WebSocket available at /ws/testing");
console.log("[Evaluation System] Initialized with 5 metrics");
console.log("[Evaluation System] API endpoints available at /api/evaluation");

// Optionally auto-start the Discord bot
if (DISCORD_AUTO_START) {
	discordClient
		.start()
		.then(() => {
			console.log("[Discord] Bot auto-started successfully.");
		})
		.catch((err: unknown) => {
			const message = err instanceof Error ? err.message : "Unknown error";
			console.error(`[Discord] Auto-start failed: ${message}`);
		});
}
