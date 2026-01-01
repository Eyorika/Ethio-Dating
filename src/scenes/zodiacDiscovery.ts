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

    let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', userId)
        .in('zodiac', compatibleZodiacs)
        .filter('id', 'not.in', `(${swipedList.join(',')})`)
        .eq('is_active', true)
        .eq('is_verified', true);

    if (userProfile.interested_in !== 'both') {
        query = query.eq('gender', userProfile.interested_in);
    }

    const { data: profiles, error } = await query.limit(1);

    if (error || !profiles || profiles.length === 0) {
        await ctx.reply("I couldn't find any more compatible stars for now. 🌌 Try standard Discovery or check back later!");
        return ctx.scene.leave();
    }

    const target = profiles[0];
    const targetZodiac = ZODIACS.find(z => z.name === target.zodiac);

    const caption = `⭐ **Zodiac Match!** ⭐\n\n` +
        `**${target.first_name}** (${target.age})\n` +
        `**Zodiac:** ${targetZodiac?.icon} ${target.zodiac}\n` +
        `**Location:** ${target.sub_city || target.city}\n` +
        `**Bio:** ${target.bio || 'No bio'}\n\n` +
        `The stars say you're a great match! ❤️`;

    await ctx.replyWithPhoto(target.photo_urls[0], {
        caption,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [
                Markup.button.callback('❌ Pass', `zodiac_dislike_${target.id}`),
                Markup.button.callback('❤️ Like!', `zodiac_like_${target.id}`)
            ],
            [Markup.button.callback('🏠 Back to Menu', 'back_to_menu')]
        ])
    });
}

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
        }
    }

    await ctx.answerCbQuery();
    await ctx.deleteMessage();

    // Refresh user profile and continue
    const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const compatibleZodiacs = ZODIAC_COMPATIBILITY[userProfile.zodiac] || [];
    return showNextZodiacProfile(ctx, userProfile, compatibleZodiacs);
});

zodiacDiscoveryScene.action('back_to_menu', (ctx) => ctx.scene.leave());
