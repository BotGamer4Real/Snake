# Steam — first upload

Do not change these after the first Steamworks build is published. They are baked into the Windows installer and exe.

| Field | Value |
|---|---|
| App display name | **BotGamers Arcade** |
| Bundle identifier | `com.botgamer4real.arcade` |
| Publisher | BotGamer4Real |
| Windows exe | `BotGamersArcade.exe` |
| Version | `0.1.0` |
| Privacy policy | https://botgamers-arcade.vercel.app/privacy |
| NSIS installer | `src-tauri/target/release/bundle/nsis/` |
| MSI installer | `src-tauri/target/release/bundle/msi/` |

## Build

Needs Rust (stable) and Visual Studio C++ Build Tools.

```bash
npm run steam:build
```

Steam ships that Windows installer / exe, not the Vercel website.

Launch option in Steamworks should be:

```
BotGamersArcade.exe
```

## Create the Steamworks app

1. [Steamworks partner](https://partner.steamgames.com) — $100 app fee, recouped from sales
2. App name: `BotGamers Arcade`
3. Type: Game
4. Upload the Tauri build with SteamPipe
5. Store page privacy / website: https://botgamers-arcade.vercel.app/privacy

## Store listing (copy)

Reuse the Play listing in `docs/PLAY-CONSOLE.md`.

**Title:** BotGamers Arcade

**Short description:**
```
Five original arcade games. Snake, Chase, Blocks, Swarm, and Brick.
```

**About this game:**
```
BotGamers Arcade is a pocket arcade of original single-player games.

• Snake — classic 1997-style rules. Eat. Don't hit the walls.
• Chase — maze hunt. Eat the pips, dodge hunters, grab boosts.
• Blocks — falling pieces. Clear lines. Don't top out.
• Swarm — gallery shooter. Hold the line. Don't let them land.
• Brick — paddle and wall. Bounce. Clear the wall. Don't miss.

Sign in to sync high scores across devices, or play offline with a local best. No ads. No in-app purchases.

Keyboard on desktop. D-pad or swipe on phones.
```
