import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import { CLIENT_URL } from "../constants/env.constants";

const app = new Elysia()
	.use(
		cors({
			origin: [CLIENT_URL],
			methods: ["POST", "PATCH", "GET", "DELETE"],
		}),
	)
	.get("/", () => "Hello Elysia")
	.listen(3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
