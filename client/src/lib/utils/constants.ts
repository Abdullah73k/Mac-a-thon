/**
 * Application constants.
 */

/** LLM models available for testing via OpenRouter. */
export const LLM_MODELS = [
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    description: "Google's most capable model with advanced reasoning",
  },
  {
    id: "openai/gpt-5",
    name: "GPT-5",
    provider: "OpenAI",
    description: "OpenAI's flagship reasoning model",
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    description: "Open-weight reasoning model with strong performance",
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    description: "Anthropic's balanced model for complex tasks",
  },
  {
    id: "meta-llama/llama-4-maverick",
    name: "Llama 4 Maverick",
    provider: "Meta",
    description: "Meta's open-source multimodal model",
  },
  {
    id: "mistralai/mistral-large-2",
    name: "Mistral Large 2",
    provider: "Mistral AI",
    description: "Mistral's enterprise-grade reasoning model",
  },
] as const;

/** Default Minecraft server configuration. */
export const DEFAULT_MC_CONFIG = {
  host: "localhost",
  port: 25565,
  version: "1.21.10",
} as const;

/** Default test run configuration. */
export const DEFAULT_TEST_CONFIG = {
  durationSeconds: 300,
  behaviorIntensity: 0.5,
  llmPollingIntervalMs: 7000,
  enableVoice: false,
  enableText: true,
} as const;
