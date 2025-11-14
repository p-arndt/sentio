# Sentio - Team Mood Tracker

<p align="center">
  <img src="src/lib/assets/logo.png" alt="Sentio Logo" width="200" />
</p>

_sentio [ˈsen.ti.oː]_ is Latin for "I feel" or "to perceive".

And that is exactly what Sentio is about. It helps teams to track and improve their emotional wellbeing. Team members share their daily mood. Sentio turns those moods into insights, trends and metrics so managers and teammates can spot problems early and celebrate wins. Functionally, it's similar to a Niko-Niko calendar but with more analytics and team features.

**What is a Niko-Niko calendar?** - It's a simple tool used in Agile teams where members log their daily mood (happy, neutral, sad) to visualize team morale over time.

## Features

- 🚀 Daily Mood Check-in - one-click logging
- 📋 Team Dashboard - snapshots of current team wellbeing
- 📈 Analytics & Trends - charts for days/weeks/months
- 🔍 Spot emerging issues early - detect dips in morale and recurring negative trends
- 🔐 Team Management - invite members, roles, and permissions
- 📊 Personal mood history & insights
- ⏰ Reminders - schedule recurring mood reminders (time + days-of-week)
- 🔔 Notifications - browser push notifications for reminders and event alerts
- 📆 Google Calendar - connect and sync (read-only) to show events and avoid conflicts
- 🔜 MS Outlook - Microsoft calendar integration is **coming soon**

## Quickstart

Choose whichever setup fits you: run locally with pnpm or use Docker Compose for a production-like environment.

### Docker Compose

You can pull the image directly from either Docker Hub or the GitHub Container Registry:

- [Sentio Docker Hub](https://hub.docker.com/r/sentio/sentio)
- [Sentio GitHub Container Registry](https://github.com/p-arndt/sentio/pkgs/container/sentio)

#### Steps:

1. Copy the `docker/.env.example` to `docker/.env` and set your environment variables as needed (see below).
2. Then run:
   ```bash
   docker compose up -d
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Developing locally

1. Clone the repo:
   ```bash
   git clone <your-repo-url>
   cd sentio
   ```
2. Install dependencies and start dev server:
   ```bash
   pnpm install
   pnpm run dev
   ```
3. Open http://localhost:5173 (or the port you configure)

---

## Environment variables

Set these in `.env` or your environment. Keep secrets safe.

Required/important variables:

| Variable            | Purpose                          | Example                              |
| ------------------- | -------------------------------- | ------------------------------------ |
| PUBLIC_ALLOW_SIGNUP | whether public signup is allowed | `"false"`                            |
| BETTER_AUTH_SECRET  | auth/session signing secret      | generate with `openssl rand -hex 32` |
| BETTER_AUTH_URL     | auth service URL                 | `http://localhost:3000`              |
| POSTGRES_HOST       | DB host                          | `localhost`                          |
| POSTGRES_PORT       | DB port                          | `5432`                               |
| POSTGRES_USER       | DB user                          | `sentio`                             |
| POSTGRES_PASSWORD   | DB password                      | `sentio`                             |
| POSTGRES_DB         | DB name                          | `sentio`                             |

#### **Auth configuration**

| Variable            | Purpose                       |
| ------------------- | ----------------------------- |
| AUTH_PROVIDER       | `email` or `oidc`             |
| EMAIL_AUTH_DISABLED | set `true` to force OIDC-only |
| OIDC_CLIENT_ID      | when using OIDC               |
| OIDC_CLIENT_SECRET  | when using OIDC               |
| OIDC_ISSUER         | OIDC provider issuer URL      |

Note: if `EMAIL_AUTH_DISABLED=true` make sure invites correspond to the OAuth email users will sign in with.

#### **SMTP / Email configuration**

You can provide SMTP credentials either via the Admin → Settings UI (these values are persisted to the database) or via environment variables which act as defaults when no DB value is set.

Environment variable names supported:

| Variable                   | Purpose                                      |
| -------------------------- | -------------------------------------------- |
| SMTP_HOST                  | SMTP server host (e.g. smtp.mail.invalid)    |
| SMTP_PORT                  | SMTP server port (e.g. 587)                  |
| SMTP_USER or SMTP_USERNAME | SMTP username / login                        |
| SMTP_PASSWORD              | SMTP password                                |
| SMTP_FROM                  | From address (`Sentio <sentio@example.com>`) |

> [!NOTE] Database SMTP settings (set over UI) take precedence; missing values fall back to env vars. UI changes are saved to the DB and override env defaults.

#### **VAPID / Web Push Configuration**

Setup web push notifications by providing VAPID keys and subject in environment variables:

| Variable                 | Purpose                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| VAPID_PUBLIC_KEY         | VAPID public key for web push notifications                                                                  |
| VAPID_PRIVATE_KEY        | VAPID private key for web push notifications                                                                 |
| VAPID_SUBJECT            | Contact email or URL for VAPID subject (mailto:your-email@example.com)                                       |
| PUBLIC_GOOGLE_CLIENT_ID  | Public Google OAuth client ID used for Google Calendar connect (set the OAuth client as authorized redirect) |
| VITE_MICROSOFT_CLIENT_ID | Microsoft OAuth client ID for Outlook/Calendar connect (set on Vite/environment and server-side)             |

## Authentication

Use `AUTH_PROVIDER=email` for classic email/password. For OIDC (SaaS SSO) set `AUTH_PROVIDER=oidc` and provide the client ID, secret and issuer.

Example:

```bash
AUTH_PROVIDER=oidc
OIDC_CLIENT_ID=abc
OIDC_CLIENT_SECRET=xxx
OIDC_ISSUER=https://accounts.example.com
```

---

## Reminders & Notifications

Sentio supports recurring mood reminders and browser push notifications so individuals and teams can stay consistent with their check-ins.

- Create reminders in Settings → Reminders with a title, message, time, and days-of-week (e.g., Mon-Fri 09:00).
- Reminders respect your timezone and show a next trigger time in the UI.
- Push notifications use VAPID keys (web push). Generate VAPID keys and set them in your environment or Admin settings (see the VAPID section above).

Create VAPID keys (a one-liner):

```pwsh
pnpx web-push generate-vapid-keys
```

Once VAPID keys are configured, go to Settings → Notifications to enable push notifications and send a test notification.

## Calendar Integration

Sentio allows users to connect calendars for display and optional event-based notifications. Google Calendar is supported today, and Microsoft Outlook calendar support is coming soon.

How to connect Google Calendar:

1. Create a Google OAuth client ID in the Google Cloud Console and add the redirect URL: `https://<your-host>/api/oauth/google/callback`.
2. Set the `PUBLIC_GOOGLE_CLIENT_ID` environment variable to your Google client ID (or enter it into the Admin settings if your instance supports it).
3. Visit Settings → Calendar and connect your Google account. Sentio requests read-only calendar access.

For Microsoft Outlook/Office 365, the sign-in flow is in development and will be available soon. When ready, configure the Microsoft OAuth client ID through your environment or Admin settings using the key `VITE_MICROSOFT_CLIENT_ID`.

## Useful commands

Development:

```bash
pnpm run dev        # start dev server
pnpm run build      # build for production
pnpm run test       # run tests
pnpm run format     # format code
```

Database helpers (project scripts):

```bash
pnpm run db:start
pnpm run db:generate
pnpm run db:push
pnpm run db:studio
```

## Contributing

We welcome contributors! A few quick tips:

- Open an issue to discuss larger changes first
- Keep changes small and focused
- Add or update tests for new behavior
- Follow existing code style (run `pnpm run format`)

See `CONTRIBUTING.md` (if present) for more details.

---

Built with ❤️ to help teams stay well.
