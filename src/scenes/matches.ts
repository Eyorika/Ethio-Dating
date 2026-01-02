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

    for (const match of matches) {
        const otherId = match.user1_id === userId ? match.user2_id : match.user1_id;
        const { data: otherProfile } = await supabase.from('profiles').select('*').eq('id', otherId).single();

        if (otherProfile) {
            let chatLink = `tg://user?id=${otherId}`;
            if (otherProfile.username) {
                const greeting = encodeURIComponent(`Hey ${otherProfile.first_name}! I matched with you on Tebesa ✨`);
                chatLink = `https://t.me/${otherProfile.username}?text=${greeting}`;
            }

            await ctx.reply(
                `✨ <b>${otherProfile.first_name}</b> (${otherProfile.age})\n` +
                `📍 ${otherProfile.sub_city || otherProfile.city}\n`,
                {
                    parse_mode: 'HTML',
                    ...Markup.inlineKeyboard([
                        [Markup.button.url(lang === 'am' ? '💬 ማውራት ጀምር' : '💬 Open Chat', chatLink)],
                        [Markup.button.callback(lang === 'am' ? '🪄 አስማታዊ መልእክት' : '🪄 Send Magic Icebreaker', `icebreaker_${otherId}`)]
                    ])
                }
            );
        }
    }
});
