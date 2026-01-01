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

    let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', userId)
        .filter('id', 'not.in', `(${swipedList.join(',')})`)
        .eq('is_active', true)
        .eq('is_verified', true);

    if (userProfile.interested_in !== 'both') {
        query = query.eq('gender', userProfile.interested_in);
    }

    const { data: profiles, error } = await query.limit(1);

    if (error || !profiles || profiles.length === 0) {
        await ctx.replyWithMarkdown(PROMPTS.SYSTEM.NO_MORE_SWIPES);
        return ctx.scene.leave();
    }

    const target = profiles[0];
    const caption = `🔥 **${target.first_name}**, ${target.age}\n📍 ${target.sub_city || target.city}\n⛪️ ${target.religion || 'No religion specified'}\n\n"${target.bio || 'No bio yet'}"`;

    try {
        await ctx.replyWithPhoto(target.photo_urls[0], {
            caption,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [
                    Markup.button.callback('❌ Pass', `swipe_dislike_${target.id}`),
                    Markup.button.callback('❤️ Like', `swipe_like_${target.id}`)
                ],
                [Markup.button.callback('🚩 Report User', `report_user_${target.id}`)]
            ])
        });
    } catch (e) {
        console.error("Discovery photo failed to send:", e);
        await ctx.reply(`🔥 **${target.first_name}**, ${target.age} (Photo missing)\n📍 ${target.sub_city || target.city}\n\n"${target.bio || 'No bio'}"`, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [
                    Markup.button.callback('❌ Pass', `swipe_dislike_${target.id}`),
                    Markup.button.callback('❤️ Like', `swipe_like_${target.id}`)
                ],
                [Markup.button.callback('🚩 Report User', `report_user_${target.id}`)]
            ])
        });
    }
}

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

// Handle Icebreakers moved to index.ts for global availability
// Handle Reports moved to index.ts for global availability
