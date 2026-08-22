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
