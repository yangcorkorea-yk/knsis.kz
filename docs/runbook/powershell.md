# PowerShell operator notes

Windows PowerShell quirks that bit us once and should not bite again.
Add new traps as they're discovered.

## Variable interpolation eats bcrypt hashes (and any $-containing string)

PowerShell interpolates `$segments` inside double-quoted strings. A
bcrypt hash starts with `$2b$12$...`, so passing it to `node -e "..."`
with double quotes lets PowerShell munch the variables out before
Node ever sees the string.

**Don't** (PowerShell eats the `$segments`):

```powershell
node -e "const b=require('bcryptjs'); console.log(b.compareSync('plain', '$2b$12$hash...'))"
```

**Do** (write a temp `.mjs` file):

```powershell
@'
import bcryptjs from 'bcryptjs';
console.log(bcryptjs.compareSync('plain', '$2b$12$hash...'));
'@ | Out-File -Encoding ascii -FilePath verify.mjs
node verify.mjs
Remove-Item verify.mjs
```

The same trap applies to any PowerShell `-d` / `--data` flag with JSON
containing `$`. Always prefer `--data-binary "@body.json"` for bodies.

## JSON bodies in Invoke-WebRequest / curl

When the payload contains `$`, backticks, or other shell-special
characters, prefer `--data-binary "@body.json"` over inline JSON.
Same root cause as above — PowerShell's expansion runs first.

## ASCII encoding for Node-consumed files

When piping content into a file via `Out-File`, use `-Encoding ascii`
to avoid the UTF-8 BOM that Node rejects as a syntax error in some
contexts (notably top-level `import` statements in `.mjs`).

## Remove temp files after verification

Don't commit `verify.mjs` or similar one-shot scripts. Add a cleanup
line at the bottom of the snippet so it's part of the muscle memory.

## Env var changes require a redeploy

Vercel embeds env vars into the lambda bundle at build time. Editing
or adding env vars in Settings → Environment Variables does **NOT**
update running deployments. Redeploy the affected deployment
(Deployments → ⋯ → Redeploy, "Use existing Build Cache" **unchecked**)
before testing.

The Vercel UI shows a banner saying so right after you save — heed it.

## Vercel CDN caches 404s from the previous deployment

After a merge to `main`, Vercel cuts a new production deployment but
the previous deployment's 404 / 500 responses can stay in the CDN for
several minutes. Bypass for the post-merge smoke check:

```powershell
# Cache-bust query string + explicit no-cache header
$cb = Get-Random
$resp = Invoke-WebRequest "https://seoulbeauty-kz.vercel.app/api/auth/signin?cb=$cb" `
  -Method POST `
  -Headers @{ "Cache-Control" = "no-cache" } `
  -ContentType "application/json" `
  --data-binary '@body.json'
$resp.Headers["x-vercel-cache"]    # MISS = fresh, HIT/STALE = still old
```

`x-vercel-cache: MISS` is the green flag — anything else means you're
still seeing the previous deployment. Encountered after the M1 merge.

For curl on PowerShell, use `--data-binary "@body.json"` (see the
JSON-body trap above) and `-H "Cache-Control: no-cache"`.
