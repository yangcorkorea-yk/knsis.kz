# Preview URL volatility — the "I see X but HEAD has Y" trap

## What happens

The PM does a visual matrix on a Vercel preview URL, finds a
defect, files it, the implementer reads HEAD and the code is
already correct. Three things conspire:

1. **Branch alias serves the latest deploy for `{branch}`** —
   not the commit you just pushed. If two pushes land in the
   same minute the alias may briefly serve the older one until
   the newer build finishes.
2. **PWA service worker** caches navigations
   (`NetworkFirst` since PR #8, but the SW itself updates on
   next nav after the new build registers — one nav lag).
3. **Vercel's CDN** caches static assets aggressively. The
   first request after a deploy may serve the previous JS
   chunk because the HTML hash changed but the chunk hash
   matched.

PR #11 sign-off hit all three: PM reported "/before-after 404,
KZ placeholder unsubstituted, KR '면허' present" — HEAD had
the route shipped, the ICU fix landed, and "면허" was scrubbed.
The defects were the preview being stale by ~2 minutes across
those three layers.

## Triage checklist when a reported defect doesn't reproduce on HEAD

Run in order — stop at the first hit.

1. **Confirm the commit on the preview URL matches HEAD.**
   The Vercel preview comment on the PR includes the SHA. If
   it doesn't match `git rev-parse HEAD` on the branch, the
   defect is on an older deploy — ask the reporter to refresh
   after the new build finishes.
2. **Hard refresh the browser** (Cmd-Shift-R / Ctrl-Shift-R).
   This bypasses the disk cache. If the defect vanishes, it
   was browser cache.
3. **Unregister the service worker.**
   DevTools → Application → Service Workers → Unregister →
   reload. If the defect vanishes, it was PWA cache.
4. **Wait 2 minutes and re-hit the URL.** CDN purge propagates
   in seconds-to-minutes; the new build's HTML may need a
   moment to displace the cached one.
5. **Open the preview URL in a private window** — no SW, no
   disk cache, no extensions.

If after all five the defect still reproduces, it's a real
HEAD defect — file it.

## Guard against the same triage waste next time

- The PR description's "Test plan" should list the **exact
  preview URL pattern** + a sentence noting steps 1-5 above.
- When a defect is reported, the responder should ask the
  reporter "which SHA does the preview comment show?" before
  diving into the code.

## Production has the same trap

Same three layers (branch alias = production alias for `main`,
PWA SW, CDN) apply post-merge. After a merge to `main`, allow
~2 minutes before declaring "shipped" and run the same
hard-refresh / SW-unregister loop on the first matrix.

## Why we don't disable the SW or shorten the cache

PWA caching is the whole reason the app is fast on slow
Kazakhstan mobile networks. The right fix is the triage
checklist above, not weakening the cache.
