import { Scenes, Markup } from 'telegraf';
import { supabase } from '../services/supabase.js';
import { ZODIACS, ZODIAC_COMPATIBILITY, PROMPTS } from '../content/prompts.js';

export const zodiacDiscoveryScene = new Scenes.BaseScene<Scenes.SceneContext>('ZODIAC_DISCOVERY_SCENE');

zodiacDiscoveryScene.enter(async (ctx) => {
    const userId = ctx.from?.id;

    // Get user profile to know their zodiac and interest
    const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (!userProfile) {
        await ctx.reply("I couldn't find your profile. Please /register first!");
        return ctx.scene.leave();
    }

    if (!userProfile.zodiac) {
        await ctx.reply("You haven't set your zodiac yet! Go to 'My Profile' -> 'Zodiac' to set it first. ✨");
        return ctx.scene.leave();
    }

    const compatibleZodiacs = ZODIAC_COMPATIBILITY[userProfile.zodiac] || [];
    const zodiacData = ZODIACS.find(z => z.name === userProfile.zodiac);

    await ctx.reply(`🌟 **Zodiac Mode Active!** 🌟\n\nYou are a **${zodiacData?.icon} ${userProfile.zodiac}**. I'm looking for your most compatible stars: ${compatibleZodiacs.join(', ')}...`, { parse_mode: 'Markdown' });

    return showNextZodiacProfile(ctx, userProfile, compatibleZodiacs);
});

async function showNextZodiacProfile(ctx: Scenes.SceneContext, userProfile: any, compatibleZodiacs: string[]) {
    const userId = ctx.from?.id;

    // Get profiles I haven't swiped on yet
    const { data: swipedIds } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', userId);

    const swipedList = swipedIds?.map(s => s.swiped_id) || [];
    if (userId) swipedList.push(userId as any);

    // Filter out session-skipped IDs
    const skippedIds = (ctx.session as any).skippedIds || [];
    const excludeList = [...swipedList, ...skippedIds];

    let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', userId)
        .in('zodiac', compatibleZodiacs)
        .filter('id', 'not.in', `(${excludeList.join(',')})`)
        .eq('is_active', true)
        .eq('is_verified', true);

    if (userProfile.interested_in !== 'both') {
        query = query.eq('gender', userProfile.interested_in);
    }

    const { data: profiles, error } = await query.limit(5);

    if (error || !profiles || profiles.length === 0) {
        // Check if we have skipped profiles to loop back to
        const session = ctx.session as any;
        if (session.skippedIds && session.skippedIds.length > 0) {
            await ctx.reply("Reached the end of the stars! 🔄 Looping back to compatible matches you skipped...");
            session.skippedIds = []; // Reset
            return showNextZodiacProfile(ctx, userProfile, compatibleZodiacs);
        }

        await ctx.reply("I couldn't find any more compatible stars for now. 🌌 Try standard Discovery or check back later!");
        return ctx.scene.leave();
    }

    // Pick random from batch
    const target = profiles[Math.floor(Math.random() * profiles.length)];
    if (!target) return showNextZodiacProfile(ctx, userProfile, compatibleZodiacs);

    return renderZodiacProfile(ctx, target, userProfile, compatibleZodiacs);
}

async function renderZodiacProfile(ctx: Scenes.SceneContext, target: any, userProfile: any, compatibleZodiacs: string[]) {
    const targetZodiac = ZODIACS.find(z => z.name === target.zodiac);

    const caption = `⭐ **Zodiac Match!** ⭐\n\n` +
        `**${target.first_name}** (${target.age})\n` +
        `**Zodiac:** ${targetZodiac?.icon} ${target.zodiac}\n` +
        `**Location:** ${target.sub_city || target.city}\n` +
        `**Bio:** ${target.bio || 'No bio'}\n\n` +
        `The stars say you're a great match! ❤️`;

    const buttons = [
        [
            Markup.button.callback('❌ Pass', `zodiac_dislike_${target.id}`),
            Markup.button.callback('❤️ Like!', `zodiac_like_${target.id}`)
        ],
        [
            Markup.button.callback('↩️ Undo', 'undo_zodiac_swipe'),
            Markup.button.callback('🏠 Menu', 'back_to_menu')
        ]
    ];

    const extraButtons = [];
    if (target.voice_intro_url) {
        extraButtons.push(Markup.button.callback('🎤 Voice Intro', `play_zodiac_voice_${target.id}`));
    }
    extraButtons.push(Markup.button.callback('Next ⏭️', `next_zodiac_profile_${target.id}`));

    if (extraButtons.length > 0) {
        buttons.push(extraButtons);
    }

    try {
        await ctx.replyWithPhoto(target.photo_urls[0], {
            caption,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
        });
    } catch (e) {
        console.error("Zodiac photo failed to send:", e);
        await ctx.reply(caption, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
        });
    }
}

// Handle Voice Intro
zodiacDiscoveryScene.action(/play_zodiac_voice_(.+)/, async (ctx) => {
    const targetId = ctx.match[1];
    const { data: profile } = await supabase.from('profiles').select('voice_intro_url').eq('id', targetId).single();

    if (profile?.voice_intro_url) {
        try {
            await ctx.replyWithVoice(profile.voice_intro_url);
        } catch (e) {
            console.error("Failed to send voice:", e);
            await ctx.answerCbQuery("Aiyee! The voice note seems to be broken. 😔", { show_alert: true });
        }
    } else {
        await ctx.answerCbQuery("Oops! No voice intro found.", { show_alert: true });
    }
    try { await ctx.answerCbQuery(); } catch (e) { }
});

// Handle Next (Skip)
zodiacDiscoveryScene.action(/next_zodiac_profile_(.+)/, async (ctx) => {
    const targetId = ctx.match[1];
    if (!targetId) return;

    // Add to specific session skippedIds
    if (!(ctx.session as any).skippedIds) {
        (ctx.session as any).skippedIds = [];
    }
    (ctx.session as any).skippedIds.push(targetId);

    try { await ctx.answerCbQuery(); } catch (e) { }
    try { await ctx.deleteMessage(); } catch (e) { }

    // We need to re-fetch user profile to call showNextZodiacProfile... or we can store it in session?
    // Optimization: Just fetch it again for now.
    const userId = ctx.from?.id;
    const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const compatibleZodiacs = ZODIAC_COMPATIBILITY[userProfile.zodiac] || [];
    return showNextZodiacProfile(ctx, userProfile, compatibleZodiacs);
});

zodiacDiscoveryScene.action(/zodiac_(like|dislike)_(.+)/, async (ctx) => {
    const [, type, targetId] = ctx.match;
    const userId = ctx.from?.id;

    // Save swipe
    await supabase.from('swipes').insert({
        swiper_id: userId,
        swiped_id: targetId,
        type: type === 'like' ? 'like' : 'dislike'
    });

    if (type === 'like') {
        const { data: isMatch } = await supabase
            .from('swipes')
            .select('*')
            .eq('swiper_id', targetId)
            .eq('swiped_id', userId)
            .eq('type', 'like')
            .single();

        if (isMatch) {
            await supabase.from('matches').insert({ user1_id: userId, user2_id: targetId });

            const { data: targetProfile } = await supabase.from('profiles').select('*').eq('id', targetId).single();
            const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', userId!).single();

            await ctx.reply(`🎉 It's a Celestial Match! You and ${targetProfile.first_name} are written in the stars.`);

            try {
                await ctx.telegram.sendMessage(targetId as string,
                    `🌟 **Celestial Match!**\n\n${myProfile.first_name} liked you too! The stars aligned.\n\n[Open Chat](tg://user?id=${userId})`,
                    { parse_mode: 'Markdown' }
                );
            } catch (e) { }
        } else {
            // Notify target of a celestial like
            const { data: targetProfile } = await supabase.from('profiles').select('language').eq('id', targetId).single();
            const targetLang = targetProfile?.language || 'en';

            const notifyMsg = targetLang === 'am'
                ? "✨ አንድ አምሳያ ኮከብዎ ወዶታል! ማን እንደሆነ ለማየት በፕሮፋይልዎት ውስጥ '❤️ See Who Liked You' የሚለውን ይመልከቱ።"
                : "✨ A compatible star just liked you! Check '❤️ See Who Liked You' in your profile to see who it is.";

            try {
                if (targetId) await ctx.telegram.sendMessage(targetId, notifyMsg);
            } catch (e) { }
        }
    }

    await ctx.answerCbQuery();
    await ctx.deleteMessage();

    // Refresh user profile and continue
    const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const compatibleZodiacs = ZODIAC_COMPATIBILITY[userProfile.zodiac] || [];
    return showNextZodiacProfile(ctx, userProfile, compatibleZodiacs);
});

// Handle Undo
zodiacDiscoveryScene.action('undo_zodiac_swipe', async (ctx) => {
    const userId = ctx.from?.id;

    const { data: lastSwipe } = await supabase
        .from('swipes')
        .select('*')
        .eq('swiper_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!lastSwipe) {
        await ctx.answerCbQuery("Nothing to undo! 🤷‍♂️", { show_alert: true });
        return;
    }

    // Delete swipe
    await supabase.from('swipes').delete().eq('id', lastSwipe.id);

    // If it was a like/match, delete match
    if (lastSwipe.type === 'like') {
        await supabase.from('matches').delete()
            .or(`and(user1_id.eq.${userId},user2_id.eq.${lastSwipe.swiped_id}),and(user1_id.eq.${lastSwipe.swiped_id},user2_id.eq.${userId})`);
    }

    // Restore profile
    const { data: previousProfile } = await supabase.from('profiles').select('*').eq('id', lastSwipe.swiped_id).single();
    const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const compatibleZodiacs = ZODIAC_COMPATIBILITY[userProfile.zodiac] || [];

    if (previousProfile) {
        await ctx.answerCbQuery("The stars are rewinding... 🌌");
        try { await ctx.deleteMessage(); } catch (e) { }
        return renderZodiacProfile(ctx, previousProfile, userProfile, compatibleZodiacs);
    } else {
        await ctx.answerCbQuery("Could not restore. Let's find someone new!");
        return showNextZodiacProfile(ctx, userProfile, compatibleZodiacs);
    }
});

zodiacDiscoveryScene.action('back_to_menu', (ctx) => ctx.scene.leave());
