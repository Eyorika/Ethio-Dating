import { Telegraf, Scenes, session, Markup } from 'telegraf';
import dotenv from 'dotenv';
import { PROMPTS, ICEBREAKERS } from './content/prompts.js';
import { supabase } from './services/supabase.js';

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) {
    throw new Error('BOT_TOKEN must be provided!');
}

import { registrationWizard } from './scenes/registration.js';
import { discoveryScene } from './scenes/discovery.js';
import { profileScene } from './scenes/profile.js';
import { adminScene } from './scenes/admin.js';
import { editBioWizard, editPhotosWizard, editInterestWizard, editLocationWizard, editZodiacWizard, editNameWizard, editAgeWizard, editLanguageWizard, editVoiceWizard } from './scenes/editProfile.js';
import { likersScene } from './scenes/likers.js';
import { matchesScene } from './scenes/matches.js';
import { zodiacDiscoveryScene } from './scenes/zodiacDiscovery.js';
import { filtersScene } from './scenes/filters.js';

const bot = new Telegraf<Scenes.SceneContext>(token);

// Middleware for sessions and scenes
const stage = new Scenes.Stage<Scenes.SceneContext>([
    registrationWizard as any,
    discoveryScene as any,
    profileScene as any,
    adminScene as any,
    editBioWizard as any,
    editPhotosWizard as any,
    editInterestWizard as any,
    editLocationWizard as any,
    editZodiacWizard as any,
    editNameWizard as any,
    editAgeWizard as any,
    editLanguageWizard as any,
    editVoiceWizard as any,
    matchesScene as any,
    zodiacDiscoveryScene as any,
    verificationScene as any,
    filtersScene as any
]);

bot.use(session());

// Force Join Channel Middleware
// Force Join Channel Middleware
bot.use(async (ctx, next) => {
    // Ignore my_chat_member updates (e.g. user blocking bot)
    if ('my_chat_member' in ctx.update) return next();

    const userId = ctx.from?.id;
    if (!userId) return next();

    const CHANNEL_ID = '-1003547990031';
    const CHANNEL_LINK = 'https://t.me/ethio_flirt';

    try {
        const member = await ctx.telegram.getChatMember(CHANNEL_ID, userId);
        const isMember = ['creator', 'administrator', 'member', 'restricted'].includes(member.status);

        if (isMember) {
            if (ctx.callbackQuery && (ctx.callbackQuery as any).data === 'check_subscription') {
                await ctx.answerCbQuery("Welcome to the Arada fam! 🚀");
                try { await ctx.deleteMessage(); } catch (e) { }
                return; // Stop here, don't trigger other handlers
            }
            return next();
        } else {
            // Not a member
            if (ctx.callbackQuery && (ctx.callbackQuery as any).data === 'check_subscription') {
                await ctx.answerCbQuery("Still not in! Join the channel first. 👀", { show_alert: true });
                return;
            }

            // Allow /start command to pass through IF we want to show welcome first? 
            // Usually force join blocks everything. Let's block everything except maybe if they are just starting?
            // User requested "at the beginning". Blocking everything is safer.

            const joinMsg = "⚠️ **Action Required!**\n\nYou must join our channel to use **Tebesa**.\n\nWe post exclusive dating tips and matchmaking updates! 🔥";
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.url('🚀 Join Channel', CHANNEL_LINK)],
                [Markup.button.callback('✅ I have Joined', 'check_subscription')]
            ]);

            if (ctx.callbackQuery) {
                // If they clicked something else, prompt them
                try { await ctx.editMessageText(joinMsg, { parse_mode: 'Markdown', ...keyboard }); } catch (e) { }
            } else {
                // If they posted a message
                await ctx.reply(joinMsg, { parse_mode: 'Markdown', ...keyboard });
            }
            return; // Block execution
        }
    } catch (e: any) {
        // Ignore "blocked by user" error
        if (e?.description?.includes('blocked by the user')) return;

        console.error('Force join check failed:', e);
        return next(); // Fail open if API error
    }
});

bot.use(stage.middleware());

bot.start((ctx) => {
    ctx.replyWithMarkdown(PROMPTS.WELCOME, {
        reply_markup: {
            keyboard: [
                [{ text: '🚀 Discovery' }, { text: '🌟 Zodiac Match' }],
                [{ text: '👤 My Profile' }, { text: '💬 My Matches' }]
            ],
            resize_keyboard: true
        }
    });
});

bot.hears('🚀 Discovery', (ctx) => ctx.scene.enter('DISCOVERY_SCENE'));
bot.hears('🌟 Zodiac Match', (ctx) => ctx.scene.enter('ZODIAC_DISCOVERY_SCENE'));
bot.hears('👤 My Profile', (ctx) => ctx.scene.enter('PROFILE_SCENE'));
bot.hears('💬 My Matches', (ctx) => ctx.scene.enter('MATCHES_SCENE'));
bot.command('register', (ctx) => ctx.scene.enter('REGISTRATION_SCENE'));
bot.command('discovery', (ctx) => ctx.scene.enter('DISCOVERY_SCENE'));
bot.command('profile', (ctx) => ctx.scene.enter('PROFILE_SCENE'));
bot.command('admin', (ctx) => ctx.scene.enter('ADMIN_SCENE'));

// Global Action Handlers

bot.action(/icebreaker_(.+)/, async (ctx) => {
    const targetId = ctx.match[1] as string;
    const userId = ctx.from?.id;
    if (!userId || !targetId) return;

    const { data: senderProfile } = await supabase.from('profiles').select('language').eq('id', userId).single();
    const lang = senderProfile?.language || 'en';

    const prompt = lang === 'am' ? "የትኛውን አይስብሬከር መላክ ትፈልጋለህ/ሽ? ✨" : "Which Magic Icebreaker do you want to send? ✨";

    const buttons = ICEBREAKERS.map((ice, index) => [
        Markup.button.callback(ice.label, `ice_preview_${targetId}_${index}`)
    ]);

    const keyboard = Markup.inlineKeyboard(buttons);

    try {
        await ctx.editMessageText(prompt, keyboard);
    } catch {
        await ctx.reply(prompt, keyboard);
    }
    try { await ctx.answerCbQuery(); } catch (e) {
        console.error("Callback query failed (likely timeout):", e);
    }
});

bot.action(/ice_preview_(.+)_(.+)/, async (ctx) => {
    const targetId = ctx.match[1] as string;
    const iceIndex = parseInt(ctx.match[2]!);
    const userId = ctx.from?.id;

    if (!userId || !targetId) return;

    const { data: sender } = await supabase.from('profiles').select('language').eq('id', userId).single();
    const { data: target } = await supabase.from('profiles').select('gender').eq('id', targetId).single();

    const lang = sender?.language || 'en';
    const ice = ICEBREAKERS[iceIndex] as any;
    const targetGender = target?.gender || 'female';

    let previewText = '';
    if (lang === 'am') {
        previewText = (targetGender === 'female' && ice.amFemale) ? ice.amFemale : (ice.amMale || ice.am);
    } else {
        previewText = (targetGender === 'female' && ice.enFemale) ? ice.enFemale : (ice.enMale || ice.en);
    }

    const title = lang === 'am' ? "👀 የመልእክት ቅምሻ (Preview):" : "👀 Message Preview:";
    const confirmBtn = lang === 'am' ? "✅ እሺ ላክ" : "✅ Yes, Send it";
    const backBtn = lang === 'am' ? "🔙 ተመለስ" : "🔙 Back";

    const previewMsg = `${title}\n\n"${previewText}"`;

    try {
        await ctx.editMessageText(previewMsg, Markup.inlineKeyboard([
            [Markup.button.callback(confirmBtn, `ice_send_${targetId}_${iceIndex}`)],
            [Markup.button.callback(backBtn, `icebreaker_${targetId}`)]
        ]));
    } catch (e) {
        // Fallback or retry logic if needed
        await ctx.reply(previewMsg, Markup.inlineKeyboard([
            [Markup.button.callback(confirmBtn, `ice_send_${targetId}_${iceIndex}`)],
            [Markup.button.callback(backBtn, `icebreaker_${targetId}`)]
        ]));
    }

    try { await ctx.answerCbQuery(); } catch (e) {
        console.error("Callback query failed (likely timeout):", e);
    }
});

bot.action(/ice_send_(.+)_(.+)/, async (ctx) => {
    const targetId = ctx.match[1] as string;
    const iceIndex = parseInt(ctx.match[2]!);
    const userId = ctx.from?.id;

    if (!userId || !targetId) return;

    const { data: senderProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const { data: targetProfile } = await supabase.from('profiles').select('*').eq('id', targetId).single();

    const selectedIce = ICEBREAKERS[iceIndex] as any;
    const senderLang = senderProfile?.language || 'en';
    const targetGender = targetProfile?.gender || 'female';

    let finalIceText = '';
    if (senderLang === 'am') {
        finalIceText = (targetGender === 'female' && selectedIce.amFemale) ? selectedIce.amFemale : (selectedIce.amMale || selectedIce.am);
    } else {
        finalIceText = (targetGender === 'female' && selectedIce.enFemale) ? selectedIce.enFemale : (selectedIce.enMale || selectedIce.en);
    }

    try {
        const targetLang = targetProfile?.language || 'en';
        const targetTitle = targetLang === 'am' ? `🔥 ማጂክ አይስብሬከር ከ ${senderProfile?.first_name}! 🪄` : `🔥 Magic Icebreaker from ${senderProfile?.first_name}! 🪄`;
        const targetLinkText = targetLang === 'am' ? `👉 ከ ${senderProfile?.first_name} ጋር ለማውራት እዚህ ይጫኑ` : `👉 Tap here to chat with ${senderProfile?.first_name}`;

        let targetChatLink = `tg://user?id=${userId}`;
        if (senderProfile?.username) {
            targetChatLink = `https://t.me/${senderProfile.username}?text=${encodeURIComponent("Hey! I matched with you on Tebesa ✨")}`;
        }

        // 1. Notify the TARGET
        await ctx.telegram.sendMessage(targetId,
            `${targetTitle}\n\n` +
            `"${finalIceText}"\n\n` +
            `👉 <a href="${targetChatLink}">${targetLinkText}</a>`,
            { parse_mode: 'HTML' }
        );

        // 2. Confirm to the SENDER
        const senderConfirm = senderLang === 'am' ? `✅ ተልኳል!\n\n"${finalIceText}"\n\nአትጠብቅ/ቂ—ሂድና ሰላም በላት/ለው! 🚀` : `✅ Sent!\n\n"${finalIceText}"\n\nDon't wait—go say hi to **${targetProfile?.first_name}** too! 🚀`;
        const senderLinkText = senderLang === 'am' ? `👉 ከ ${targetProfile?.first_name} ጋር ወሬ ጀምር` : `👉 Open Chat with ${targetProfile?.first_name}`;

        let senderChatLink = `tg://user?id=${targetId}`;
        if (targetProfile?.username) {
            senderChatLink = `https://t.me/${targetProfile.username}?text=${encodeURIComponent(finalIceText)}`;
        }

        await ctx.reply(
            `${senderConfirm}\n\n` +
            `<a href="${senderChatLink}">${senderLinkText}</a>`,
            { parse_mode: 'HTML' }
        );

        // Clean up choice menu
        try {
            await ctx.deleteMessage();
        } catch (e) { }
    } catch (e) {
        const errorMsg = senderProfile?.language === 'am' ? "አይዬ! መልእክቱን መላክ አልቻልኩም። ምናልባት ብሎክ አድርገውኝ ይሆን? 😅" : "Aiyee! I couldn't send the message. Maybe they blocked me? 😅";
        await ctx.reply(errorMsg);
    }

    try { await ctx.answerCbQuery(); } catch (e) {
        console.error("Callback query failed (likely timeout):", e);
    }
});

import { verificationScene } from './scenes/verification.js';

bot.action('try_again_verification', (ctx) => ctx.scene.enter('VERIFICATION_SCENE'));

bot.action(/report_user_(.+)/, async (ctx) => {
    const targetId = ctx.match[1] as string;
    const userId = ctx.from?.id;

    await supabase.from('reports').insert({
        reporter_id: userId,
        reported_id: targetId,
        reason: 'General Report'
    });

    try { await ctx.answerCbQuery("User reported. Our Arada security team will look into it! 🛡️"); } catch (e) { }
    try {
        await ctx.deleteMessage();
    } catch (e) { } // Might be already deleted
});

bot.launch().then(() => {
    console.log('ጠበሳ (Tebesa) is online! 🚀');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
