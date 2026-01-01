import { Scenes, Markup } from 'telegraf';
import { supabase } from '../services/supabase.js';

export const likersScene = new Scenes.BaseScene<Scenes.SceneContext>('LIKERS_SCENE');

likersScene.enter(async (ctx) => {
    await ctx.reply("Checking out who's been eyeing your profile... ❤️");
    return showNextLiker(ctx);
});

async function showNextLiker(ctx: Scenes.SceneContext) {
    const userId = ctx.from?.id;

    // Fetch users who liked me but I haven't liked/disliked back yet
    // First, get everyone who liked me
    const { data: admirers } = await supabase
        .from('swipes')
        .select('swiper_id')
        .eq('swiped_id', userId)
        .eq('type', 'like');

    if (!admirers || admirers.length === 0) {
        await ctx.reply("No new likes yet! Keep your profile fresh and Arada. ✨");
        return ctx.scene.enter('PROFILE_SCENE');
    }

    const admirerIds = admirers.map(a => a.swiper_id);

    // Filter out those I already swiped on
    const { data: mySwipes } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', userId);

    const alreadySwipedIds = mySwipes?.map(s => s.swiped_id) || [];

    const pendingLikerIds = admirerIds.filter(id => !alreadySwipedIds.includes(id as any));

    if (pendingLikerIds.length === 0) {
        await ctx.reply("You've seen all your current admirers! Try Discovery to find more. 🚀");
        return ctx.scene.enter('PROFILE_SCENE');
    }

    // Show the first one
    const targetId = pendingLikerIds[0];
    const { data: target } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();

    if (!target) return showNextLiker(ctx);

    const caption = `❤️ **${target.first_name} liked you!**\n\n` +
        `**Age:** ${target.age}\n` +
        `**Location:** ${target.sub_city || target.city}\n` +
        `**Bio:** ${target.bio || 'No bio'}\n\n` +
        `Do you want to match back?`;

    await ctx.replyWithPhoto(target.photo_urls[0], {
        caption,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [
                Markup.button.callback('❌ Pass', `liker_dislike_${target.id}`),
                Markup.button.callback('❤️ Like Back!', `liker_like_${target.id}`)
            ],
            [Markup.button.callback('⬅️ Back to Profile', 'back_to_profile')]
        ])
    });
}

likersScene.action(/liker_(like|dislike)_(.+)/, async (ctx) => {
    const [, type, targetId] = ctx.match;
    const userId = ctx.from?.id;

    // Save swipe
    await supabase.from('swipes').insert({
        swiper_id: userId,
        swiped_id: targetId,
        type: type === 'like' ? 'like' : 'dislike'
    });

    if (type === 'like') {
        // It's a guaranteed match because we are in the "Who Liked Me" list
        await supabase.from('matches').insert({
            user1_id: userId,
            user2_id: targetId
        });

        const { data: targetProfile } = await supabase.from('profiles').select('*').eq('id', targetId).single();
        const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', userId!).single();

        await ctx.reply(`🎉 It's a Match with ${targetProfile.first_name}! You can now chat.`);

        // Notify target
        try {
            await ctx.telegram.sendMessage(targetId as string,
                `አይበረኩም! 🎉 **${myProfile.first_name}** liked you back! It's a match.\n\n[Open Chat](tg://user?id=${userId})`,
                { parse_mode: 'Markdown' }
            );
        } catch (e) { }
    }

    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    return showNextLiker(ctx);
});

likersScene.action('back_to_profile', (ctx) => ctx.scene.enter('PROFILE_SCENE'));
