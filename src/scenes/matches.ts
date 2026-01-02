import { Scenes, Markup } from 'telegraf';
import { supabase } from '../services/supabase.js';

export const matchesScene = new Scenes.BaseScene<Scenes.SceneContext>('MATCHES_SCENE');

matchesScene.enter(async (ctx) => {
    const userId = ctx.from?.id;
    const { data: profile } = await supabase.from('profiles').select('language').eq('id', userId).single();
    const lang = profile?.language || 'en';

    await ctx.reply(lang === 'am' ? "ተዛማጆችህን/ሽን በማምጣት ላይ... 🥂" : "Fetching your Arada connections... 🥂");

    // Fetch matches where user is user1 or user2
    const { data: matches, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false });

    if (error || !matches || matches.length === 0) {
        await ctx.reply(lang === 'am' ? "እስካሁን ምንም ተዛማጅ የለም! ሰዎችን ለመፈለግ 'Discovery' ተጠቀም። 🚀" : "No matches yet! Keep swiping in Discovery to find your vibe-mate. 🚀");
        return ctx.scene.leave();
    }

    await ctx.reply(lang === 'am' ? `**${matches.length}** ተዛማጆች አሉህ/ሽ! ለማውራት ስማቸውን ንካ፦` : `You have **${matches.length}** matches! Click to open chat:`, { parse_mode: 'Markdown' });

    const keyboard = Markup.keyboard([
        [lang === 'am' ? '🏠 ዋና ምናሌ' : '🏠 Main Menu']
    ]).resize();

    for (const match of matches) {
        const otherId = match.user1_id === userId ? match.user2_id : match.user1_id;
        const { data: otherProfile } = await supabase.from('profiles').select('*').eq('id', otherId).single();


        if (otherProfile) {
            const buttons: any[] = [
                [Markup.button.callback(lang === 'am' ? '💬 ቦት ውስጥ አውራ' : '💬 In-Bot Chat', `chat_with_${otherId}`)]
            ];

            // Only add Telegram Chat button if user has a username
            if (otherProfile.username) {
                const greeting = encodeURIComponent(`Hey ${otherProfile.first_name}! I matched with you on Tebesa ✨`);
                const chatLink = `https://t.me/${otherProfile.username}?text=${greeting}`;
                buttons.push([Markup.button.url(lang === 'am' ? '✈️ ቴሌግራም ላይ አውራ' : '✈️ Telegram Chat', chatLink)]);
            }

            buttons.push([Markup.button.callback(lang === 'am' ? '🪄 አስማታዊ መልእክት' : '🪄 Send Magic Icebreaker', `icebreaker_${otherId}`)]);

            await ctx.reply(
                `✨ <b>${otherProfile.first_name}</b> (${otherProfile.age})\n` +
                `📍 ${otherProfile.sub_city || otherProfile.city}\n`,
                {
                    parse_mode: 'HTML',
                    ...Markup.inlineKeyboard(buttons)
                }
            );
        }
    }

    // Send keyboard after all matches
    await ctx.reply(lang === 'am' ? '👆 ከላይ ያሉትን ተዛማጆች ይመልከቱ' : '👆 Check out your matches above', keyboard);
});

matchesScene.hears(['🏠 ዋና ምናሌ', '🏠 Main Menu'], async (ctx) => {
    const { data: profile } = await supabase.from('profiles').select('language').eq('id', ctx.from?.id).single();
    const lang = profile?.language || 'en';

    await ctx.scene.leave();

    const mainKeyboard = Markup.keyboard(
        lang === 'am' ? [
            [{ text: '🚀 ፍለጋ (Discovery)' }, { text: '🌟 ኮከብ ጥምረት' }],
            [{ text: '👤 ፕሮፋይሌ' }, { text: '💬 የኔ ተዛማጆች' }]
        ] : [
            [{ text: '🚀 Discovery' }, { text: '🌟 Zodiac Match' }],
            [{ text: '👤 My Profile' }, { text: '💬 My Matches' }]
        ]
    ).resize();

    await ctx.reply(
        lang === 'am' ? '🏠 ዋና ምናሌ' : '🏠 Main Menu',
        mainKeyboard
    );
});
