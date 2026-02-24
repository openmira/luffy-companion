# 🔥 Luffy Companion

AI desktop companion — a fire spirit that lives on your screen, talks to you, and has its own personality.

## What is this?

Luffy is an AI-powered desktop companion based on [Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber), reimagined with a Three.js volumetric fire shader instead of Live2D avatars. It's the first resident of an AI town — a fire spirit wearing a straw hat that responds to your voice with expressive flame animations.

## Features (Planned)

- 🔥 Real-time volumetric fire shader with emotion-driven animations
- 🗣️ Voice conversation (STT → LLM → TTS)
- 🎭 5 emotion states: excited, thinking, happy, tired, sarcastic
- 🎩 Signature straw hat (the only solid mesh)
- 💤 Idle behaviors: quiet burning, napping, wandering, cursor chasing
- ⌨️ Hotkey activation + wake word "路飞"
- 💻 Desktop pet mode (transparent, always-on-top)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Rendering | Three.js + @wolffo/three-fire + custom particles |
| Voice Pipeline | Open-LLM-VTuber (STT/TTS/VAD/interruption) |
| STT | Whisper API / sherpa-onnx |
| TTS | Fish Audio (Chinese-optimized) |
| LLM | OpenClaw Agent API |
| Desktop | Electron (→ Tauri later) |

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

## Project Structure

```
luffy-companion/
├── src/
│   ├── renderer/          # Three.js fire shader + scene
│   │   ├── fire/          # Fire shader, particles, emotions
│   │   └── scene.js       # Main 3D scene setup
│   ├── voice/             # Voice pipeline integration
│   └── idle/              # Idle behavior state machine
├── public/
│   ├── models/            # Straw hat glTF
│   └── index.html
├── server/                # Python backend (Open-LLM-VTuber fork)
└── package.json
```

## Roadmap

- [x] Phase 0: Project setup & planning
- [ ] Phase 1: Fire shader + emotion system (5 days)
- [ ] Phase 2: Voice pipeline + OpenClaw integration (5 days)
- [ ] Phase 3: Desktop pet mode + polish (5 days)
- [ ] Phase 4: Mobile + multi-character (1 week)

## License

MIT

## Part of the [OpenMira](https://github.com/openmira) ecosystem
