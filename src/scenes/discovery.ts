import { Scenes, Markup } from 'telegraf';
import { supabase } from '../services/supabase.js';
import { PROMPTS } from '../content/prompts.js';

export const discoveryScene = new Scenes.BaseScene<Scenes.SceneContext>('DISCOVERY_SCENE');

discoveryScene.enter(async (ctx) => {
    await ctx.reply("Searching for your vibe-mate... 🔍");
    return showNextProfile(ctx);
});

async function showNextProfile(ctx: Scenes.SceneContext) {
    const userId = ctx.from?.id;

    // 1. Get user's profile to know preferences
    const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (!userProfile) {
        await ctx.reply("You need to /register first!");
        return ctx.scene.leave();
    }

    // 2. Fetch a profile they haven't swiped on yet
    const { data: swipedIds } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', userId);

    const swipedList = swipedIds?.map(s => s.swiped_id) || [];
    if (userId) swipedList.push(userId as any);

    // Filter out session-skipped IDs
    const skippedIds = (ctx.session as any).skippedIds || [];
    const excludeList = [...swipedList, ...skippedIds];

    const filters = (ctx.session as any).filters || {};

    let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', userId)
        .filter('id', 'not.in', `(${excludeList.join(',')})`)
        .eq('is_active', true)
        .eq('is_verified', true);

    // Apply Filters
    if (filters.minAge) query = query.gte('age', filters.minAge);
    if (filters.maxAge) query = query.lte('age', filters.maxAge);
    if (filters.location) {
        if (filters.isAddis) {
            query = query.eq('sub_city', filters.location);
        } else {
            // Case insensitive location search if possible, or exact match
            query = query.ilike('city', `%${filters.location}%`);
        }
    }

    if (userProfile.interested_in !== 'both') {
        query = query.eq('gender', userProfile.interested_in);
    }

    const { data: profiles, error } = await query.limit(1);

    if (error || !profiles || profiles.length === 0) {
        // Check if we have skipped profiles to loop back to
        const session = ctx.session as any;
        if (session.skippedIds && session.skippedIds.length > 0) {
            await ctx.reply("Reached the end! 🔄 Looping back to profiles you skipped...");
            session.skippedIds = []; // Reset skipped IDs
            return showNextProfile(ctx); // Retry fetch
        }

        await ctx.replyWithMarkdown(PROMPTS.SYSTEM.NO_MORE_SWIPES);
        return ctx.scene.leave();
    }

    const target = profiles[0];
    await renderProfile(ctx, target);
}

async function renderProfile(ctx: Scenes.SceneContext, target: any) {
    const caption = `🔥 **${target.first_name}**, ${target.age}\n📍 ${target.sub_city || target.city}\n⛪️ ${target.religion || 'No religion specified'}\n\n"${target.bio || 'No bio yet'}"`;

    const buttons = [
        [
            Markup.button.callback('❌ Pass', `swipe_dislike_${target.id}`),
            Markup.button.callback('❤️ Like', `swipe_like_${target.id}`)
        ],
        [
            Markup.button.callback('⚙️ Filters', 'open_filters'),
            Markup.button.callback('↩️ Undo', 'undo_swipe')
        ]
    ];

    const extraButtons = [];
    if (target.voice_intro_url) {
        extraButtons.push(Markup.button.callback('🎤 Voice Intro', `play_voice_${target.id}`));
    }
    extraButtons.push(Markup.button.callback('Next ⏭️', `next_profile_${target.id}`));

    if (extraButtons.length > 0) {
        buttons.push(extraButtons);
    }

    buttons.push([Markup.button.callback('🚩 Report User', `report_user_${target.id}`)]);

    try {
        await ctx.replyWithPhoto(target.photo_urls[0], {
            caption,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
        });
    } catch (e) {
        console.error(`[Discovery] Failed to send photo for ${target.id}`, e);
        try {
            await ctx.reply(`🔥 **${target.first_name}**, ${target.age} (Photo missing)\n\n"${target.bio || 'No bio'}"`, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard(buttons)
            });
        } catch (innerError) {
            await ctx.reply(`🔥 ${target.first_name}, ${target.age}\n"${target.bio}"`, Markup.inlineKeyboard(buttons));
        }
    }
}

// Handle Voice Intro Playback
discoveryScene.action(/play_voice_(.+)/, async (ctx) => {
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
discoveryScene.action(/next_profile_(.+)/, async (ctx) => {
    const targetId = ctx.match[1];
    if (!targetId) return;

    // Add to specific session skippedIds
    if (!(ctx.session as any).skippedIds) {
        (ctx.session as any).skippedIds = [];
    }
    (ctx.session as any).skippedIds.push(targetId);

    try { await ctx.answerCbQuery(); } catch (e) { }
    try { await ctx.deleteMessage(); } catch (e) { } // Clean up old profile
    return showNextProfile(ctx);
});

// Handle Swipes
discoveryScene.action(/swipe_(like|dislike)_(.+)/, async (ctx) => {
    const [, type, targetId] = ctx.match;
    const userId = ctx.from?.id;

    // Save swipe
    await supabase.from('swipes').insert({
        swiper_id: userId,
        swiped_id: targetId,
        type: type
    });

    if (type === 'like') {
        // Check for match
        const { data: matchSwipe } = await supabase
            .from('swipes')
            .select('*')
            .eq('swiper_id', targetId)
            .eq('swiped_id', userId)
            .eq('type', 'like')
            .single();

        if (matchSwipe) {
            // It's a match!
            await supabase.from('matches').insert({
                user1_id: userId,
                user2_id: targetId
            });

            const { data: targetProfile } = await supabase.from('profiles').select('*').eq('id', targetId).single();
            const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();

            // Notify CURRENT user (the swiper)
            await ctx.replyWithMarkdown(PROMPTS.MATCH.CELEBRATION(targetProfile.first_name, targetProfile.sub_city || targetProfile.city), {
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🪄 Send Magic Icebreaker', `icebreaker_${targetId}`)]
                ])
            });

            // Notify TARGET user (the person who was liked earlier)
            try {
                await ctx.telegram.sendMessage(targetId as string,
                    `አይበረኩም! (It's a Match!) 🎉\n\nYou just matched with **${myProfile?.first_name}** from ${myProfile?.sub_city || myProfile?.city}!\n\n**Next Steps:**\n1. Say hi! 👋\n2. Use a Magic Icebreaker to break the ice.\n3. Keep it Arada. 😎\n\nClick their name above to start chatting! 🔥`,
                    { parse_mode: 'Markdown' }
                );
            } catch (e) {
                console.error("Failed to notify target user of match:", e);
            }
        } else {
            // Not a match yet, just a like. Notify the target!
            const { data: targetProfile } = await supabase.from('profiles').select('language').eq('id', targetId).single();
            const targetLang = targetProfile?.language || 'en';

            const notifyMsg = targetLang === 'am'
                ? "👀 አንድ ሰው ወደዶታል! ማን እንደሆነ ለማየት በፕሮፋይልህ ውስጥ '❤️ See Who Liked You' የሚለውን ንካ።"
                : "👀 Someone just liked you! Go to '❤️ See Who Liked You' in your profile to reveal them.";

            try {
                if (targetId) {
                    await ctx.telegram.sendMessage(targetId, notifyMsg);
                }
            } catch (e) {
                // User might have blocked bot, ignore
            }
        }
    }

    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    return showNextProfile(ctx);
});

// Handle Filters
discoveryScene.action('open_filters', (ctx) => ctx.scene.enter('FILTERS_SCENE'));

// Handle Undo
discoveryScene.action('undo_swipe', async (ctx) => {
    const userId = ctx.from?.id;

    // 1. Get the very last swipe action by this user
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

    // 2. Delete the swipe
    await supabase.from('swipes').delete().eq('id', lastSwipe.id);

    // 3. If it was a match, delete the match too
    if (lastSwipe.type === 'like') {
        await supabase.from('matches').delete()
            .or(`and(user1_id.eq.${userId},user2_id.eq.${lastSwipe.swiped_id}),and(user1_id.eq.${lastSwipe.swiped_id},user2_id.eq.${userId})`);
    }

    // 4. Fetch the profile of the user we just 'un-swiped'
    const { data: previousProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', lastSwipe.swiped_id)
        .single();

    if (previousProfile) {
        await ctx.answerCbQuery("Rewinding... 🔄");
        try { await ctx.deleteMessage(); } catch (e) { }
        return renderProfile(ctx, previousProfile);
    } else {
        await ctx.answerCbQuery("Could not restore profile. fetching new one.");
        return showNextProfile(ctx);
    }
});

// Handle Icebreakers moved to index.ts for global availability
// Handle Reports moved to index.ts for global availability
