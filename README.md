# Classic Snake

Faithful recreation of the original 1997 Nokia 6110 Snake rules.

- Grid: 20×15
- Start length: 3
- +1 score / +1 segment per food
- Walls and self-collision end the run
- Instant restart

See `docs/REQUIREMENTS.md` and `docs/BALANCE-PLATFORM.md`.

```bash
npm install
npm run dev
```

Email sign-in uses the linked Snake Supabase project. Sessions persist in the browser. High scores sync as the max of local and cloud, so the same account can continue on another device after signing in.

## Publishing map

One web game (`main` on GitHub) feeds every store:

| Target | How |
|---|---|
| Balance Hub | Live site: https://snake-self-pi.vercel.app |
| Android (this step) | Capacitor wrapper in `android/` |
| iPhone | Same Capacitor project + `npx cap add ios` on a Mac |
| Steam | Later: Tauri 2 desktop build of the same `out/` folder |

### Steam (desktop)

Steam ships a **Windows (and later Mac/Linux) app**, not the Vercel website.

1. Steamworks partner account: [https://partner.steamgames.com](https://partner.steamgames.com)  
   App fee is **$100** per game (recouped from sales). This is separate from Play Console.
2. This repo now has a **Tauri 2** wrapper in `src-tauri/`. After Rust + Visual Studio C++ Build Tools are installed:

```bash
npm run steam:dev
npm run steam:build
```

3. The installer lands under `src-tauri/target/release/bundle/`.
4. Then in Steamworks: create the app, upload that build with SteamPipe, fill the store page, submit for review.

Play Console stays paused until Google verification finishes.

### Android on your Pixel 7a (USB)

1. Install [Android Studio](https://developer.android.com/studio) (includes `adb` and the SDK).
2. Plug in the Pixel, accept USB debugging.
3. From this repo:

```bash
npm run android:sync
npm run android:open
```

4. In Android Studio: select the Pixel 7a → Run (green play). That installs a debug APK.

Store listing (Play / App Store / Steam) still needs developer accounts and signed release builds. The wrapper is the first native shell.
