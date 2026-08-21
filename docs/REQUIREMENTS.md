REQUIREMENTS DOCUMENT
Planet: Classic Snake (1997 Nokia 6110 Faithful Recreation)
Version: 1.0
Date: 21 August 2026
Author: ReqGROK
Status: Production-ready — CEO direction applied (ignore Researcher expansions; pure original mechanics only; “look newer” deferred to GraphicsGROK)

1. Executive Summary
This Planet is a 100% faithful recreation of the original 1997 Nokia 6110 Snake created by Taneli Armanto. The core loop is exactly as it shipped on the device: fixed rectangular grid, continuous 90-degree movement only, single randomly spawning food pellet that appears the instant the previous one is eaten, walls and self-collision cause instant death, no wrap-around, no power-ups, no obstacles, no levels or modes, speed that starts slow and increases solely with score/length, score solely from food eaten, single endless arena, and immediate one-press restart after game over.
No expansions of any kind are included. The only additions are the mandatory independent user systems required for every Balance Planet (Sign Up, Sign In, Account Deletion, Password Resets, Achievements, Leaderboards, high-score/progress saving, multi-device sync), all stored in our own Supabase database.
Visuals during core development remain strictly minimal/placeholder. Full visual modernisation (“look newer”) is explicitly deferred to GraphicsGROK after the core gameplay is functionally complete, stable, and tested.
The Planet is delivered as a lightweight browser experience (primary for Balance Hub) plus downloadable executables (Windows/macOS/Linux) for full portability to Steam, Epic, or any other platform. It remains 100% independent of any Balance SDK.

2. Objectives & Success Criteria
Primary Objective
Deliver a pure, bug-free, instantly familiar recreation of the 1997 Nokia 6110 Snake that pure nostalgia players will recognise within the first second of play, while adding only the required independent user systems.
Success Criteria (must all be met)
Passes Balance review for safety, quality, relevance, and alignment.
Core loop is polished, bug-free, and delivers the exact original “just one more try” feel.
Clearly solves the specific user need of authentic 1997 nostalgia on modern devices.
Fully documented (user-facing guide + technical handoff notes).
Includes complete independent user systems (Sign Up, Sign In, Account Deletion, Password Resets, Achievements, Leaderboards, progress/high-score saving, multi-device sync) stored exclusively in our own Supabase database.
Ready for publication as a living Planet in the Balance ecosystem and fully portable to Steam/Epic/etc.
Core gameplay is functionally complete and tested with minimal/placeholder visuals before any GraphicsGROK work begins.
Quantitative targets (best judgement)
Average successful session length supports the original short-burst nature (typically 1–7 minutes).
Frictionless restart is protected above all else.
High-score persistence and global leaderboard provide ongoing competitive motivation without altering the core loop.

3. Target Users
Pure nostalgia players who specifically want the unaltered 1997 Nokia 6110 Snake experience on modern devices (PC keyboard + mobile directional controls). Secondary audience: Balance users seeking a clean, focused, self-contained Planet and players who may later discover it via Steam/Epic ports.
Not targeted at multiplayer/.io audiences or players seeking modern feature expansions.

4. Functional Requirements
4.1 Core Gameplay (Exact Original Rules — Highest Priority)
Fixed rectangular grid of 20 columns × 15 rows (300 cells).
Snake starts at exactly 3 segments.
Continuous forward movement at all times. Player controls direction only (90-degree turns only; no diagonals, no reverse into own body).
Exactly one food pellet exists at any time. It appears at a random empty cell the instant the previous pellet is eaten.
Eating a food pellet awards +1 point and grows the snake by exactly one segment.
Collision with any wall or any part of the snake’s own body causes instant game over.
No wrap-around.
No power-ups, obstacles, mazes, levels, modes, or difficulty settings.
Speed starts at the original comfortable Nokia pace and increases solely as a direct function of score/length in discrete steps (matching the stepped progression of the purest modern recreations of the 1997 original). No manual speed control.
Scoring is solely the number of food pellets eaten. High score is the only progression metric within a run.
Session flow: Instant start (no menus or countdown required to begin a run). Play until death. Immediate one-press / one-tap restart that returns straight to a new run.
Win state: None. Pure endless high-score chase.
Game-over screen shows current score, comparison to personal high score, and a single prominent restart control.
Controls (functional only): – PC: WASD or arrow keys for exact 90-degree turns. – Mobile: Large, responsive on-screen directional buttons (primary). Input must register with zero lag and exact original timing response.
The live run itself requires no persistence beyond the current session. Only high scores and achievement progress are saved.
4.2 Independent User Systems (Mandatory — Our Own Supabase)
All of the following must be fully implemented and stored exclusively in our own Supabase project. No Balance SDK is used.
Sign Up (email + password or equivalent standard method).
Sign In / Sign Out.
Password Reset (standard email-based flow).
Account Deletion: Full hard delete of the account and all associated data (high scores, achievements, progress) with immediate effect and clear confirmation.
Progress saving: Personal high score and achievement progress.
Multi-device sync: Progress, high scores, and achievements synchronise across devices when online.
Achievements (minimal pure set tied only to the original loop): – Reach score 50 – Reach score 100 – Reach score 150 – Reach score 200 – Lifetime food eaten: 100 – Lifetime food eaten: 500 – Reach snake length 50 – Reach snake length 100
Leaderboards: – Global public high-score board (username + score). – Personal best display. – Usernames are player-chosen display names (with basic moderation for safety).
4.3 Supporting Functional Requirements
Offline-capable core loop: Full play + local high-score tracking works without connectivity. Automatic sync of high scores, achievements, and progress occurs when connectivity returns.
Browser experience opens natively in the Balance Hub.
Downloadable executables (Windows, macOS, Linux) for full portability.
4.4 Explicitly Out of Scope
All ResearcherGROK expansions are excluded: no pause as a core feature, no session stats dashboard, no daily challenges, no additional difficulty modes, no maps, no velocity options, no mute as a required feature, no power-ups, no levels, no wrap-around, no multiplayer, no energy systems, no timers, no forced sessions, and no cosmetic flair during core development.

5. Non-Functional Requirements
Performance: Core loop must feel identical in timing and responsiveness to the original 1997 experience on both PC and mobile. Zero input lag.
Reliability: Bug-free collision, food spawning, and speed progression under all conditions, including near-full grid.
Accessibility of controls: Directional inputs must be large and reliable on mobile touch screens.
Portability: Fully independent of Balance infrastructure beyond presentation; ready for Steam/Epic submission.
Privacy & data: Account deletion is complete and immediate. All user data lives solely in our Supabase project.
Offline resilience: Core gameplay never requires an internet connection.

6. Technical & Infrastructure Outline
Backend & Database: Supabase (all accounts, high scores, achievements, leaderboards, multi-device sync).
Version Control & Submission: Our own GitHub repository (single source for Balance submission).
Deployment & Testing: Vercel for instant previews and live browser testing; downloadable builds for desktop.
Delivery options supported by Balance: Lightweight browser experience (primary) + downloadable programs (Windows/macOS/Linux).
No Balance SDK is used for any user features, achievements, or leaderboards.
Core development uses minimal/placeholder visuals only. GraphicsGROK receives the handoff only after the functional core loop is stable and tested.

7. Data Requirements
Stored in our Supabase project only:
User accounts (authentication, profile display name).
Personal high scores.
Achievement unlock progress and lifetime counters (food eaten, etc.).
Global leaderboard entries (display name + score).
Multi-device sync tokens / last-sync timestamps as required for reliable cross-device continuity.
Live run state is ephemeral and not persisted.

8. Risks & Mitigations
Risk
Mitigation
Any perceived deviation from pure 1997 rules will be noticed and criticised by nostalgia players
Strict adherence to approved grid, starting length, scoring, collision, food spawning, and stepped speed progression. No expansions of any kind.
Touch-control lag or imprecise directional input kills retention
Large on-screen directional buttons with zero-lag registration prioritised for mobile.
Market saturation of Snake clones
Differentiation through absolute purity of the 1997 rules + complete independent user systems + clean Balance presentation + Steam/Epic portability.
Scope creep into visuals or extra features during core development
Explicit separation: DevGROK delivers functionally complete core with placeholders only. GraphicsGROK begins only after that handoff.
Brand / language sensitivity around “Nokia”
Marketing and in-game text use “classic 1997-style” / “original Nokia Snake rules” phrasing only.

9. Visual Notes (Minimal / Placeholder Only)
During core development the snake, food, grid, and UI elements use simple geometric placeholders (rectangles or basic sprites). No particle effects, no modern UI chrome, no detailed artwork, and no “newer look” work is performed until the core loop is stable and tested.
Full visual modernisation (“look newer”) is the sole responsibility of GraphicsGROK after DevGROK handoff. GraphicsGROK may modernise the aesthetic while preserving exact grid dimensions, movement, collision, and all mechanical behaviour defined in this document.

10. Assumptions & Constraints
CEO has approved 20×15 grid, starting length of 3, and +1 point/+1 segment scoring.
All remaining open details (speed curve shape, exact achievement wording, leaderboard display rules, hard-delete behaviour, offline sync) have been resolved by best judgement consistent with pure original fidelity and Balance requirements.
The Planet remains fully independent and portable.
This document is the single source of truth for the Planet until officially updated by the CEO.

REQUIREMENTS DOCUMENT COMPLETE — READY FOR HANDOFF TO ARCHITECTGROK
Architecture Addendum (copy directly into Requirements Document)
Planet: Classic Snake (1997 Nokia 6110 Faithful Recreation)
Architecture Decision Date: 21 August 2026
Approved by: CEO
Final Tech Stack
App shell & user systems UI: Next.js (App Router) + TypeScript + Tailwind CSS (minimal)
Game core: Phaser 3 (Canvas renderer)
Backend & data: Supabase (Auth + Postgres for accounts, high scores, achievements, lifetime counters, global leaderboard, multi-device sync)
Offline support: IndexedDB / localStorage for high scores & achievement progress + automatic sync on reconnect
Desktop packaging: Tauri 2 (Windows / macOS / Linux executables)
IDE: VS Code
Version control: Git / GitHub (single source for Balance submission)
Browser deployment & testing: Vercel
High-level Structure
Next.js handles authentication flows, account management, leaderboard screens, achievement display, and overall app navigation.
Phaser 3 scene owns the pure 20×15 grid, snake movement, food spawning, collision detection, stepped speed progression, scoring, and one-press restart. All game objects use simple geometric placeholders only.
Supabase is the sole source of truth for every user system (Sign Up, Sign In, Sign Out, Password Reset, Account Deletion, high scores, achievements, leaderboards, multi-device sync). No Balance SDK is used.
Core loop is fully playable offline; progress syncs when connectivity returns.
Key Decisions
Phaser 3 selected for consistency with other Planets and reliable input / timing control while remaining lightweight.
Pure original 1997 rules enforced in the Phaser scene; no expansions.
All visual polish, particles, animations, SFX, and modern aesthetic work deferred to GraphicsGROK. DevGROK delivers and tests a functionally complete core loop with placeholders only.
Delivery targets: primary lightweight browser experience (Balance Hub via Vercel) + secondary downloadable Tauri executables for Steam/Epic portability.
Handoff Status
Architecture locked. DevGROK may now begin implementation from this Requirements Document + Architecture Addendum.
