{
  "name": "knsis",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "db:migrate": "prisma migrate deploy",
    "db:migrate:dev": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "i18n:check": "tsx scripts/i18n-check.ts",
    "price:check": "tsx scripts/no-price-guard.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.18.0",
    "@tanstack/react-query": "^5.51.0",
    "better-auth": "^1.0.0",
    "inngest": "^3.20.0",
    "next": "14.2.5",
    "next-intl": "^3.17.0",
    "next-pwa": "^5.6.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-hook-form": "^7.52.0",
    "resend": "^4.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@playwright/test": "^1.45.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.5",
    "postcss": "^8.4.39",
    "prettier": "^3.3.2",
    "prisma": "^5.18.0",
    "tailwindcss": "^3.4.6",
    "tsx": "^4.16.0",
    "typescript": "5.4.5",
    "vitest": "^2.0.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.7.0"
}
