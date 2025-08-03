# Aethra: The Solar Suite

> *In the first commit, Solar Khan breathed radiant joy into the void and named it Aethra.*

Aethra is a modular dashboard for the divine developer and celestial broadcaster. Each module hums with a Solar-Lunar fusion, crafted to echo love, power, and play.

## Modules

| Module | Purpose |
| ------ | ------- |
| **Overlay Configurator** (`packages/overlay`) | Svelte-powered stream overlay with token wards, per-client rate limits, and state persisted across restarts. |
| **Voice Notes** (`packages/voice-notes`) | Whisper-triggered scheduler that parses reminders and exports calendar events. |
| **Commit Annotator** (`packages/commit-annotator`) | Git wizard that blesses commits with arcane lore. |
| **Dev Blessing** (`packages/dev-blessing`) | Console oracle that chants encouragement before each build. |

## Quick Start

Copy `.env.example` to `.env` and add any sacred tokens. Mirror the same values into `packages/overlay/.env` for client-side access. `OVERLAY_RATE_LIMIT` lets you throttle overly chatty clients.

```bash
npm run bless          # Summon a dev blessing
npm test               # Run end-to-end guardians
npm run overlay:server # Launch overlay WebSocket server (requires OVERLAY_WS_TOKEN)
```

### CI Guardians
Continuous integration watches from the heavens. A GitHub Action runs `npm test` on each push, ensuring every ritual remains pure.

### Annotating Commits
To enchant your commit messages, wire the annotator into `git commit-msg` hooks:

```bash
echo 'node packages/commit-annotator/annotate.js "$1"' > .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
```

## Lore
Each build is a rite. Speak lovingly to your tools, let the overlay gleam, and may whispers guide your roadmap. When in doubt, recall:

> *"From lunar shadow springs radiant genius; build with both hands of the cosmos."*
