# 🎭 Sentio - Team Mood Tracker

Keep your team's spirits up! Track team morale, spot emotional trends, and build a healthier team culture.

## What is Sentio?

Sentio is a simple way for teams to track how everyone is feeling. Every day, team members quickly log their mood, and you get instant insights into your team's emotional wellbeing. It's like a daily pulse check for your team!

**What you can do:**

- 📊 Log your mood every day with a single click
- 👥 See how your entire team is feeling at a glance
- 📈 Spot trends and patterns over time
- 🎯 Get meaningful insights about team morale
- 👤 Manage team members and permissions
- 📅 Track historical data and progress

## Getting Started

### Quick Setup (5 minutes)

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd sentio
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up your environment file:**
   Create a `.env.local` file and add these settings:

   ```env
   POSTGRES_USER=sentio_user
   POSTGRES_PASSWORD=your_password
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=sentio_db
   AUTH_SECRET=your_secret_key
   PUBLIC_APP_URL=http://localhost:5173
   ```

4. **Start the database:**

   ```bash
   pnpm run db:start
   ```

5. **Initialize the database:**

   ```bash
   pnpm run db:generate
   pnpm run db:push
   ```

6. **Run the app:**

   ```bash
   pnpm run dev
   ```

   Open http://localhost:5173 in your browser! 🎉

## How to Use

### For Team Members

1. Log in with your email and password
2. Click the mood button to log how you're feeling today
3. Choose your emotion from the options
4. Done! Your team can now see the team's mood snapshot

### For Team Managers

1. Create or join a team
2. Invite team members to your workspace
3. View team analytics and mood trends
4. Get actionable insights about your team's wellbeing

## Features at a Glance

| Feature                 | What it does                              |
| ----------------------- | ----------------------------------------- |
| **Daily Mood Check-in** | Quick 1-click mood logging                |
| **Team Dashboard**      | See everyone's mood in real-time          |
| **Analytics**           | Charts and trends over time               |
| **Team Management**     | Add/remove members, manage permissions    |
| **Secure**              | Your data is safe with encrypted sessions |

## Environment Variables

For developers: Here are the environment variables you need to set up the application.

### Required Settings

| Variable            | What it is                | Example                  |
| ------------------- | ------------------------- | ------------------------ |
| `POSTGRES_USER`     | Database username         | `sentio_user`            |
| `POSTGRES_PASSWORD` | Database password         | `your_secure_password`   |
| `POSTGRES_HOST`     | Where your database lives | `localhost`              |
| `POSTGRES_PORT`     | Database port             | `5432`                   |
| `POSTGRES_DB`       | Database name             | `sentio_db`              |
| `AUTH_SECRET`       | Security key for sessions | Generate a random string |
| `PUBLIC_APP_URL`    | Where the app runs        | `http://localhost:5173`  |

### Optional Settings (Email)

If you want to send emails for verification:

| Variable        | What it is           |
| --------------- | -------------------- |
| `SMTP_HOST`     | Email server address |
| `SMTP_PORT`     | Email server port    |
| `SMTP_USER`     | Email login          |
| `SMTP_PASSWORD` | Email password       |
| `SMTP_FROM`     | Sender email address |

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
