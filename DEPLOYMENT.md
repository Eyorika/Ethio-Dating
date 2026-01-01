# Production Deployment Guide: ጠበሳ (Tebesa) Bot

To keep your bot running 24/7, follow these steps:

## 1. Choose a Platform
- **Railway.app** (Easiest, starts at $5/mo)
- **Render.com** (Free tier available for web services, but background workers are paid)
- **DigitalOcean / VPS** ($4-6/mo, most flexible)

## 2. Environment Variables
Make sure to set these in your hosting dashboard:
- `BOT_TOKEN`: Get from @BotFather
- `SUPABASE_URL`: From Supabase Project Settings
- `SUPABASE_ANON_KEY`: From Supabase Project Settings
- `ADMIN_ID`: Your Telegram ID

## 3. Database
- Ensure your `schema.sql` is fully executed in the Supabase SQL Editor.
- Enable RLS and verify policies allow the bot to read/write.

## 4. Deployment Steps (Railway Example)
1. Connect your GitHub repository.
2. Railway will detect the `package.json` and start the build.
3. Use the startup command: `node src/index.js` (or `npm start` after building).
4. **Note**: If using ESM, ensure your `package.json` has `"type": "module"`.

## 5. Webhooks vs Polling
For the MVP, the bot uses **Long Polling** (`bot.launch()`). This works fine on most platforms. If you have high traffic (10,000+ users), you may want to switch to Webhooks later.
