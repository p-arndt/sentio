# Sentio - Team Mood Tracker

<p align="center">
    <img src="src/lib/assets/logo.png" alt="Sentio Logo" width="200" />
</p>

Keep your team's spirits up! Track team morale, spot emotional trends, and build a healthier team culture.

# What is Sentio?

Sentio is a simple way for teams to track how everyone is feeling. Every day, team members quickly log their mood, and you get instant insights into your team's emotional wellbeing. It's like a daily pulse check for your team!

**What you can do:**

- 📊 Log your mood every day with a single click
- 👥 See how your entire team is feeling at a glance
- 📈 Spot trends and patterns over time
- 🎯 Get meaningful insights about team morale
- 👤 Manage team members and permissions
- 📅 Track historical data and progress

# Getting Started

## Quick Setup with Docker Compose

The easiest way to get up and running! Just use Docker Compose:

### Use Docker Hub Image

Use the [Sentio Docker Hub Image](https://hub.docker.com/r/padi2312/sentio) the backend service in your `docker-compose.yml`.

### Build on your own

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd sentio
   ```

2. **Start everything with Docker Compose:**

   ```bash
   cd docker
   docker compose up -d
   ```

3. **Access the app:**

   Open your browser and go to `http://localhost:3000` (or the port you configured).

# How to Use

## For Team Members

1. Log in with your email and password
2. Click the mood button to log how you're feeling today
3. Choose your emotion from the options
4. Done! Your team can now see the team's mood snapshot

## For Team Managers

1. Create or join a team
2. Invite team members to your workspace
3. View team analytics and mood trends
4. Get actionable insights about your team's wellbeing

# Features at a Glance

| Feature                 | What it does                              |
| ----------------------- | ----------------------------------------- |
| **Daily Mood Check-in** | Quick 1-click mood logging                |
| **Team Dashboard**      | See everyone's mood in real-time          |
| **Analytics**           | Charts and trends over time               |
| **Team Management**     | Add/remove members, manage permissions    |
| **Secure**              | Your data is safe with encrypted sessions |

# Environment Variables

For developers: Here are the environment variables you need to set up the application.

## Required Settings

| Variable              | What it is                             | Example / Default                                        |
| --------------------- | -------------------------------------- | -------------------------------------------------------- |
| `PUBLIC_ALLOW_SIGNUP` | Enable user registration (true/false)  | `"false"`                                                |
| `BETTER_AUTH_SECRET`  | Secret used by the auth/session system | (generate a secure random string `openssl rand -hex 32`) |
| `BETTER_AUTH_URL`     | URL of the auth service                | `https://auth.example.com`                               |
| `POSTGRES_HOST`       | Where your database lives              | `localhost`                                              |
| `POSTGRES_PORT`       | Database port (optional)               | `5432`                                                   |
| `POSTGRES_USER`       | Database username                      | `sentio`                                                 |
| `POSTGRES_PASSWORD`   | Database password                      | `sentio`                                                 |
| `POSTGRES_DB`         | Database name                          | `sentio`                                                 |

## Auth Settings

| Variable              | What it is                              | Default |
| --------------------- | --------------------------------------- | ------- |
| `EMAIL_AUTH_DISABLED` | Disable email/password (OIDC-only mode) | `false` |
| `AUTH_PROVIDER`       | Choose auth method: `email` or `oidc`   | `email` |
| `OIDC_CLIENT_ID`      | OIDC Client ID (if using OIDC)          |         |
| `OIDC_CLIENT_SECRET`  | OIDC Client Secret (if using OIDC)      |         |
| `OIDC_ISSUER`         | OIDC Issuer URL (if using OIDC)         |         |

# Authentication Provider Configuration

Choose your authentication method by setting `AUTH_PROVIDER`:

## Email/Password (Default)

Traditional email and password authentication:

```bash
AUTH_PROVIDER=email
```

**Use when:** You want simple email/password login, or you're unsure which provider to use.

## OIDC Provider (Recommended)

Generic OpenID Connect support for any OIDC-compliant provider:

```bash
AUTH_PROVIDER=oidc
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_ISSUER=https://your-oidc-provider.com
```

## Optional Auth Settings

| Variable              | What it is                              | Default |
| --------------------- | --------------------------------------- | ------- |
| `EMAIL_AUTH_DISABLED` | Disable email/password (OIDC-only mode) | `false` |

Set to `true` only if using OIDC and want to force users through OAuth:

```bash
AUTH_PROVIDER=oidc
OIDC_CLIENT_ID=...
OIDC_CLIENT_SECRET=...
OIDC_ISSUER=...
EMAIL_AUTH_DISABLED=true
```

⚠️ **Note:** When `EMAIL_AUTH_DISABLED=true`, users with invitation links must use OIDC to sign up. Make sure their OAuth email matches the invitation email.

## Common Commands

### Development Commands

```bash
# Start developing
pnpm run dev

# Build for production
pnpm run build

# Run tests
pnpm run test

# Format code
pnpm run format
```

### Database Commands

```bash
# Start PostgreSQL
pnpm run db:start

# Set up database schema
pnpm run db:generate
pnpm run db:push

# View database GUI
pnpm run db:studio
```

## Troubleshooting

**Can't connect to database?**

- Make sure you ran `pnpm run db:start`
- Check your `.env.local` file has the right passwords
- Make sure `POSTGRES_DB` matches what's in your `.env.local`

**Login not working?**

- Try clearing your browser cookies
- Make sure `AUTH_SECRET` is set in `.env.local`

**Port 5173 already in use?**

- Run: `pnpm run dev -- --port 3000`

## Questions?

- Check the docs folder for more information
- Open an issue on GitHub
- Ask the team!

---

Built with ❤️ for happy teams
