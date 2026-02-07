# Discord Bot Setup Guide

Step-by-step instructions for creating a Discord bot and configuring it for the Minecraft LLM Testing Toolkit.

## 1. Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Enter a name (e.g. "Minecraft LLM Tester") and click **Create**
4. Note the **Application ID** (also called Client ID) -- you'll need this later

## 2. Create a Bot User

1. In your application, go to the **Bot** tab in the left sidebar
2. Click **Add Bot** (if not already created)
3. Under **Token**, click **Reset Token** and copy the token
   - **Store this securely** -- you won't be able to see it again
4. Under **Privileged Gateway Intents**, enable:
   - **Server Members Intent** (optional, for future features)
   - **Message Content Intent** (optional, for reading messages)
   - **Presence Intent** is NOT needed

> The bot requires `Guilds` and `GuildVoiceStates` intents which are non-privileged and enabled by default.

## 3. Invite the Bot to Your Server

1. Go to the **OAuth2** tab in the left sidebar
2. Under **OAuth2 URL Generator**, select these scopes:
   - `bot`
   - `applications.commands` (optional, for future slash commands)
3. Under **Bot Permissions**, select:
   - **View Channels** -- see channels in the server
   - **Send Messages** -- send text messages
   - **Connect** -- join voice channels
   - **Speak** -- play audio in voice channels
   - **Manage Channels** -- create test session channels
4. Copy the generated URL and open it in your browser
5. Select your Discord server and click **Authorize**

### Required Permission Integer

If you prefer to set permissions manually, use this integer: `3155968`

This includes: View Channels, Send Messages, Connect, Speak, Manage Channels.

## 4. Get Your Guild (Server) ID

1. Open Discord (desktop or web app)
2. Go to **User Settings > Advanced** and enable **Developer Mode**
3. Right-click on your server name in the sidebar
4. Click **Copy Server ID**

## 5. Configure Environment Variables

Add the following to your `server/.env.local` file:

```bash
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_client_id_here
DISCORD_GUILD_ID=your_server_id_here
DISCORD_AUTO_START=false
```

Set `DISCORD_AUTO_START=true` if you want the bot to connect automatically when the server starts.

## 6. Configure ElevenLabs (Optional -- for TTS)

To enable text-to-speech for agent voices:

1. Sign up at [ElevenLabs](https://elevenlabs.io)
2. Go to **Profile + API Key** and copy your API key
3. Browse **Voice Library** and note voice IDs you want to use
4. Add to `server/.env.local`:

```bash
# ElevenLabs TTS Configuration
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_MODEL_ID=eleven_monolingual_v1
```

The default voice ID (`21m00Tcm4TlvDq8ikWAM`) is "Rachel". You can use any voice from the ElevenLabs library.

## 7. Start the Bot

```bash
# Start the server (bot will auto-start if DISCORD_AUTO_START=true)
bun run dev:backend

# Or start the bot manually via API:
curl -X POST http://localhost:3000/api/discord/start
```

## 8. Verify the Bot is Running

```bash
# Check bot status
curl http://localhost:3000/api/discord/status
```

Expected response:
```json
{
  "status": "online",
  "guilds": ["your_guild_id"],
  "voiceConnections": []
}
```

## API Quick Reference

### Bot Lifecycle
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/discord/start` | Start the bot |
| POST | `/api/discord/stop` | Stop the bot |
| GET | `/api/discord/status` | Get bot status |

### Voice
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/discord/voice/join` | Join a voice channel |
| POST | `/api/discord/voice/leave` | Leave a voice channel |
| POST | `/api/discord/speak` | Speak via TTS (default voice) |
| POST | `/api/discord/stop-speaking` | Stop playback |

### Agent Voice Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/discord/agents/register` | Register an agent voice |
| DELETE | `/api/discord/agents/:agentId` | Unregister an agent |
| GET | `/api/discord/agents` | List all agents |
| GET | `/api/discord/agents/:agentId` | Get agent profile |
| POST | `/api/discord/agents/speak` | Make an agent speak |
| POST | `/api/discord/agents/stop` | Stop agent + clear queue |

### Test Channels
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/discord/channels/test-session` | Create test channels |
| GET | `/api/discord/channels/test-sessions/:guildId` | List test channels |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `ws://localhost:3000/ws/discord` | Real-time Discord events |

**WebSocket client messages:** `subscribe`, `unsubscribe`, `ping`
**WebSocket server messages:** `voice-joined`, `voice-left`, `speaking-started`, `speaking-ended`, `bot-status-changed`, `error`, `pong`

## Troubleshooting

### Bot won't connect
- Verify `DISCORD_BOT_TOKEN` is correct and not expired
- Check that the bot has been invited to the server
- Ensure no firewall is blocking outbound WebSocket connections

### Bot can't join voice channels
- Verify the bot has **Connect** and **Speak** permissions
- Check that the channel ID is correct (enable Developer Mode to copy IDs)
- Make sure the voice channel exists and isn't full

### TTS not working
- Verify `ELEVENLABS_API_KEY` is set and valid
- Check your ElevenLabs account has remaining credits
- Ensure the voice ID exists in your ElevenLabs account

### "Channel not found" errors
- The bot can only see channels it has permission to access
- Ensure the bot role has **View Channels** in the relevant channel/category
