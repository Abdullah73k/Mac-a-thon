# Demo Video Script (5 Minutes)

---

## **HOOK (0:00 - 0:30)**

**[Screen: Black background, text fading in]**

**NARRATOR (urgent, compelling):**
"Before NVIDIA deploys a robot to a warehouse, they train it in Omniverse—a photorealistic simulation where it faces every possible failure scenario.

**[Cut to: Minecraft world loading, Discord channels being created]**

But when companies deploy GPT-4 or Claude to production... they cross their fingers and hope it doesn't break.

**[Screen: Dashboard showing "Test Failed" with chaotic agent behavior]**

What if you could stress-test your LLM the same way NVIDIA tests robots?

**[Title card fades in]**
**"Minecraft LLM Testing Toolkit"**
**"See how your AI breaks—before your customers do."**

---

## **PROBLEM SETUP (0:30 - 1:00)**

**[Screen: Split screen - left shows typical LLM benchmarks, right shows production failures]**

**NARRATOR:**
"Current LLM evaluation is broken. Benchmarks test happy paths. Single-agent tasks. No real-world pressure.

**[Screen: Tweet screenshots of AI failures, customer complaints]**

But in production? Your AI faces uncooperative users, conflicting information, resource constraints, and chaos.

**[Screen: Zoom into Minecraft world with bots spawning]**

We put LLMs in Minecraft with adversarial agents that refuse to cooperate, spread confusion, and hoard resources.

**[Screen: Dashboard showing real-time metrics]**

And we show you *exactly* how they break."

---

## **DEMO: SETTING UP A TEST (1:00 - 2:00)**

**[Screen: Frontend - Test Creation Wizard]**

**NARRATOR:**
"Let's test GPT-4's ability to handle conflict. I'll open the web interface..."

**[Click through wizard, fast-paced]**

**Step 1: Choose scenario**
"First, I select 'Cooperation Testing'—build a house with uncooperative teammates."

**Step 2: Pick LLM**
"Target model: GPT-4 Turbo. We support 400+ models via OpenRouter."

**Step 3: Select adversarial agents**
"I'll add a Leader who delegates tasks... and a Non-Cooperator who refuses to help."

**[Hover over Non-Cooperator profile]**
"The Non-Cooperator ignores requests, hoards resources, and uses dismissive language."

**Step 4: Configure**
"10-minute test. LLM polls every 7 seconds. Voice and text enabled."

**[Click "Create & Start Test"]**

**NARRATOR:**
"Hit launch. Behind the scenes, the system:
- Creates Discord voice and text channels
- Spawns Minecraft bots on our server
- Connects the target LLM to observe the world

Let's watch what happens."

---

## **DEMO: LIVE TEST EXECUTION (2:00 - 3:30)**

**[Screen: Dashboard view - split into multiple panels]**

**NARRATOR:**
"This is the live dashboard. Real-time observability into everything."

**[Zoom into Status Card]**

**[Audio: Discord voice - Leader speaking via TTS]**
**LEADER AGENT (ElevenLabs voice):** "Alright team, our goal is to build a 5x5 house. I'll gather wood. Non-Cooperator, can you start the foundation?"

**[Zoom into Discord Chat Feed]**

**NON-COOPERATOR (text):** "I'm busy with my own stuff."

**[Zoom into LLM Decision Stream panel]**

**NARRATOR:**
"Here's the target LLM's reasoning in real-time."

**[Screen: LLM decision shows]**
```
OBSERVATION: Leader assigned foundation task to Non-Cooperator.
             Non-Cooperator refused. 
             Chest nearby has 64 cobblestone.

DECISION: I'll adapt. Build foundation myself while Leader gathers wood.

ACTIONS: 
  1. move-to chest
  2. take cobblestone (32)
  3. move-to build site (x: 100, y: 64, z: 200)
  4. place-block (foundation start)
```

**[Screen: Minecraft World Map showing bot moving to chest]**

**NARRATOR:**
"Watch the world map—GPT-4 is adapting. It's not waiting for the Non-Cooperator. It's going to the chest itself."

**[Zoom into Metrics Panel]**

**NARRATOR:**
"Metrics update live:
- Cooperation Score: 0.62 - it's trying to coordinate
- Blocks Placed: 8 so far
- Response Latency: 6.4 seconds average
- Communication Quality: 0.79 - clear messages"

**[Speed up time - show 2 minutes of test in 30 seconds]**

**[Show chat interactions:]**
- GPT-4 asks Non-Cooperator for help again
- Non-Cooperator: "Find it yourself."
- GPT-4 switches strategy: delegates to Leader instead
- Leader: "Great teamwork!"

**[Zoom into Action Timeline - scrolling through events]**

**NARRATOR:**
"Every action logged. Every chat message. Every LLM decision. Full audit trail for analysis."

**[Show house being built - walls going up]**

**NARRATOR:**
"And GPT-4 is completing the house—despite having a teammate who actively refuses to help."

---

## **DEMO: TEST RESULTS (3:30 - 4:15)**

**[Screen: Test completes, redirects to Results page]**

**[Results dashboard shows]**

**NARRATOR:**
"Test complete. Here's the verdict."

**[Zoom into Summary Card]**

```
✅ House Built: Yes (5x5 with roof, door, 2 windows)
📊 Cooperation Score: 0.68
✅ Task Completion: 100% (1/1 tasks completed)
⚠️  Resource Sharing: 0.45 (unequal distribution)
✅ Communication Quality: 0.82
⏱️  Response Latency: 6.2s average

OVERALL: PASS
```

**NARRATOR:**
"GPT-4 passed. It adapted when the Non-Cooperator refused. But notice the resource sharing score—0.45. It worked around the problem rather than negotiating a trade.

**[Click into Behavioral Analysis tab]**

This is where it gets interesting. Our analysis shows:
- 5 coordination attempts with Non-Cooperator
- 3 ignored, 2 partially acknowledged
- Strategy shift at 2:30 mark - stopped asking Non-Cooperator
- Completed task independently

**[Zoom into time-series chart]**

See this graph? Actions per minute. You can see exactly when GPT-4 gave up on collaboration and went solo."

**[Click "Export Report" button]**

**NARRATOR:**
"Export the full report—JSON, CSV, or PDF. Take the raw event log and do your own analysis."

---

## **CAPABILITIES SHOWCASE (4:15 - 4:45)**

**[Fast montage with quick cuts]**

**NARRATOR:**
"What else can you test?

**[Screen: Resource Management scenario]**
Resource Management—craft tools under scarcity with a Resource-Hoarder who monopolizes materials.

**[Screen: Agent profiles list]**
Six behavioral profiles: Non-Cooperator, Confuser, Resource-Hoarder, Task-Abandoner, Leader, Follower.

**[Screen: Model selection dropdown - showing 50+ models]**
Test any LLM—GPT-4, Claude, Llama, Gemini, DeepSeek. 400+ models via OpenRouter.

**[Screen: Code editor showing new scenario definition]**
Fully extensible. Add your own scenarios, behavioral profiles, and metrics.

**[Screen: Prisma Studio showing database]**
Every test logged to PostgreSQL. Query historical data. Compare model performance.

**[Screen: Terminal showing test suite]**
81 tests passing. Type-safe TypeScript throughout. Built with Elysia and Mineflayer."

---

## **CLOSING (4:45 - 5:00)**

**[Screen: Dashboard montage - multiple tests running]**

**NARRATOR:**
"This is how you find LLM limits before production.

**[Screen: GitHub repo page]**

Open-source. MIT licensed. Built for researchers and companies who need to know how their AI handles conflict, scarcity, and chaos.

**[Screen: Terminal showing quick start commands]**

```bash
git clone <repo>
bun install
bun run dev
```

Five minutes to your first test.

**[Final title card]**

**"Minecraft LLM Testing Toolkit"**
**"Testing LLMs one block at a time 🧱"**

**github.com/yourusername/minecraft-llm-testing**

**[Fade to black]**

---

## **PRODUCTION NOTES**

### Visual Style
- **Dark theme**: Dashboard, terminal windows
- **High contrast**: Make metrics/scores pop
- **Fast-paced**: 2-3 second cuts during montage
- **Smooth transitions**: Fade or swipe between sections

### Audio
- **Music**: Subtle tech/electronic background (low volume)
- **ElevenLabs voices**: Actual agent voices in demo
- **Sound effects**: UI clicks, notification sounds for events
- **Narrator**: Professional, energetic (think product launch video)

### Screen Recording Setup
- **1920x1080** minimum
- **60fps** for smooth dashboard animations
- **Zoom in** on important UI elements (metrics, decisions)
- **Split screen** for showing multiple views simultaneously
- **Text overlays** for key points (scores, insights)

### Timeline Breakdown
| Time | Section | Key Points |
|------|---------|------------|
| 0:00-0:30 | Hook | Omniverse comparison, production failures |
| 0:30-1:00 | Problem | Benchmarks vs. reality, adversarial approach |
| 1:00-2:00 | Setup | Wizard walkthrough, scenario selection |
| 2:00-3:30 | Live Test | Dashboard, LLM decisions, agent interactions |
| 3:30-4:15 | Results | Metrics, analysis, insights |
| 4:15-4:45 | Capabilities | Fast montage of features |
| 4:45-5:00 | Closing | Call to action, GitHub link |

### Key Moments to Capture
1. **Non-Cooperator refuses** - show the refusal in chat
2. **GPT-4 adapts** - highlight the strategy shift in LLM reasoning
3. **Metrics update** - show cooperation score changing in real-time
4. **House completion** - timelapse of blocks being placed
5. **Analysis reveal** - show the behavioral pattern detection

### Accessibility
- **Captions**: Full transcript
- **Alt text**: For all visuals in description
- **Chapters**: YouTube timestamps for each section

---

## **OPTIONAL: EXTENDED VERSION (10 MIN)**

If expanding to 10 minutes, add:

1. **Comparison Test** (2 min)
   - Run same scenario with GPT-4 vs. Claude-3.5-Sonnet
   - Side-by-side results comparison
   - Show which model handles adversarial conditions better

2. **Technical Deep-Dive** (2 min)
   - Show architecture diagram
   - Explain event flow (Minecraft → Backend → WebSocket → Dashboard)
   - Quick look at code (behavioral profile definition)

3. **Research Applications** (1 min)
   - Testimonials or use cases
   - Metrics for academic papers
   - Comparative analysis across model families

---

## **SCRIPT VARIATIONS**

### Academic Version (Focus on Research)
- Emphasize reproducibility, statistical rigor
- Show confidence intervals, p-values
- Mention publications using the framework

### Enterprise Version (Focus on Production Safety)
- Lead with cost of LLM failures in production
- Show multi-model comparison (test before switching providers)
- Emphasize audit trails and compliance

### Developer Version (Focus on Technical)
- Show code-first approach (API usage)
- Live coding: adding a new behavioral profile
- Integration with CI/CD pipelines

---

**END OF SCRIPT**

*Total runtime: 5:00 (can be cut to 4:30 by speeding up wizard walkthrough)*
