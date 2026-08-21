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
