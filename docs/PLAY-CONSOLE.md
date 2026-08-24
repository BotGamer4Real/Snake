# Google Play — first upload

Package name (do not change after the first upload): `com.botgamer4real.arcade`  
On-device name: **BotGamers Arcade**  
Signed bundle: `android/app/build/outputs/bundle/release/app-release.aab`  
Privacy policy: https://botgamers-arcade.vercel.app/privacy

## Create the app

1. [Play Console](https://play.google.com/console) → **Create app**
2. App name: `BotGamers Arcade`
3. Default language: English (United States)
4. App or game: **Game**
5. Free
6. Declare that it meets the Developer Programme Policies

## Store listing (copy)

**Title:** BotGamers Arcade

**Short description (80 characters max):**
```
Five original arcade games. Snake, Chase, Blocks, Swarm, and Brick.
```

**Full description:**
```
BotGamers Arcade is a pocket arcade of original single-player games.

• Snake — classic 1997-style rules. Eat. Don't hit the walls.
• Chase — maze hunt. Eat the pips, dodge hunters, grab boosts.
• Blocks — falling pieces. Clear lines. Don't top out.
• Swarm — gallery shooter. Hold the line. Don't let them land.
• Brick — paddle and wall. Bounce. Clear the wall. Don't miss.

Sign in to sync high scores across devices, or play offline with a local best. No ads. No in-app purchases.

Controls work with a D-pad, swipe, or keyboard on desktop.
```

**App icon:** `public/icon-512.png` (512×512)

**Screenshots:** take at least 2 phone shots from your Pixel (Play wants 16:9 or 9:16). Capture the arcade menu plus one in-game screen.

**Feature graphic:** 1024×500 PNG. Use the BotGamers splash still if needed (`public/branding/botgamers-logo.jpg`) until a dedicated banner exists.

**Category:** Games → Arcade  
**Tags:** arcade, casual, single player, offline

## Policy forms

- Ads: **No**
- In-app purchases: **No**
- Target age: **Everyone** / 3+ (no user-generated chat)
- Content rating: fill the IARC questionnaire (this is a mild arcade game)
- Data safety:
  - Data collected: email, display name, per-game high scores (only if the player creates an account)
  - Not collected if they play signed out (scores stay on device)
  - Encrypted in transit: **Yes**
  - Sold: **No**
  - Required for the app: **No** (sign-in is optional)
  - Account deletion: GitHub issue with the account email (see privacy page)

## Release

1. From this repo: `npm run android:bundle`
2. Play Console → Testing → Internal testing → Create a release
3. Upload `app-release.aab`
4. Add yourself as an internal tester
5. After internal testing looks good: Closed testing (Play needs a 12–14 day track before production on a new personal account) then Production

Keep `android/upload-keystore.jks` and `android/keystore.properties` off GitHub. Losing the keystore means you cannot update this app.
