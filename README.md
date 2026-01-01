# Tebesa (ጠበሳ) - Arada Dating Bot 🌹🇪🇹

**Tebesa** is a premium, localized Telegram dating bot designed for the vibrant dating scene in Ethiopia. It combines "Arada" (street-smart) culture with modern matchmaking features.

## ✨ Features

- **🚀 Discovery**: Swipe-style interface to like/pass profiles.
- **❤️ Instant Notifications**: Get notified immediately when someone likes you.
- **🌟 Zodiac Match**: Celestial compatibility matching (e.g., Aries ❤️ Leo).
- **🗣️ Bilingual**: Full support for **English** and **Amharic** (Arada style).
- **🧙‍♂️ Magic Icebreakers**: Gender-aware, localized opening lines to start conversations.
- **🔒 Community Gate**: Enforces joining `@ethio_flirt` channel to use the bot.
- **🛡️ Secure**: Verified profiles, photo moderation, and reporting system.
- **👤 Profile Management**: Edit bio, photos, interests, and **language** anytime.

## 🛠️ Tech Stack

- **Framework**: [Telegraf](https://telegraf.js.org/) (Node.js)
- **Language**: TypeScript
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Deployment**: Polling (Development) / Webhook (Production ready)

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- A Supabase project
- A Telegram Bot Token (from @BotFather)

### Installation

1.  **Clone the repo**
    ```bash
    git clone https://github.com/yourusername/tebesa-bot.git
    cd tebesa-bot
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    BOT_TOKEN=your_telegram_bot_token
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup**
    Run the `schema.sql` script in your Supabase SQL Editor to set up tables and RLS policies.

### Running the Bot

```bash
# Development (with hot-reload)
npm run dev

# Build & Start (Production)
npm run build
npm start
```

## 📂 Project Structure

- `src/index.ts` - Main entry point and middleware.
- `src/scenes/` - Logic for different bot flows (Registration, Discovery, Profile, etc.).
- `src/content/prompts.ts` - Centralized text content (Bilingual).
- `src/services/` - Database connection and utilities.

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---
*Made with ❤️ for Addis Ababa* 🏙️
