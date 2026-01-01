import { Scenes, Markup } from 'telegraf';
import { supabase } from '../services/supabase.js';
import { ZODIACS, PROMPTS } from '../content/prompts.js';

export const profileScene = new Scenes.BaseScene<Scenes.SceneContext>('PROFILE_SCENE');

profileScene.enter(async (ctx) => {
    const userId = ctx.from?.id;
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        await ctx.reply("I couldn't find your profile. Type /register to create one!");
        return ctx.scene.leave();
    }

    const { data: likesCount } = await supabase
        .from('swipes')
        .select('id', { count: 'exact' })
        .eq('swiped_id', userId)
        .eq('type', 'like');

    const status = profile.is_verified ? 'Verified ✅' : 'Pending Verification ⏳';

    const zodiacData = ZODIACS.find(z => z.name === profile.zodiac);
    const zodiacText = zodiacData ? `${zodiacData.icon} ${zodiacData.name} (${zodiacData.am})` : 'None';

    const caption = `👤 **Your Profile**\n\n` +
        `**Name:** ${profile.first_name}\n` +
        `**Age:** ${profile.age}\n` +
        `**Location:** ${profile.sub_city || profile.city}\n` +
        `**Bio:** ${profile.bio || 'None'}\n` +
        `**Zodiac:** ${zodiacText} 🌟\n` +
        `**Interested In:** ${profile.interested_in}\n` +
        `**Status:** ${status}\n\n` +
        `❤️ **Likes Received:** ${likesCount?.length || 0}`;

    await ctx.replyWithPhoto(profile.photo_urls[0], {
        caption,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('❤️ See Who Liked You', 'view_likers')],
            [Markup.button.callback('✏️ Name', 'edit_name'), Markup.button.callback('🎂 Age', 'edit_age')],
            [Markup.button.callback('✏️ Bio', 'edit_bio'), Markup.button.callback('⭐ Zodiac', 'edit_zodiac')],
            [Markup.button.callback('🎯 Edit Interest', 'edit_interest')],
            [Markup.button.callback('📍 Edit Location', 'edit_location')],
            [Markup.button.callback('🖼️ Change Photos', 'edit_photos')],
            [Markup.button.callback('🌐 Language', 'edit_language')],
            [Markup.button.callback('🏠 Back to Menu', 'back_to_menu')]
        ])
    });
});

profileScene.action('edit_language', (ctx) => ctx.scene.enter('EDIT_LANGUAGE_WIZARD'));

profileScene.action('edit_name', (ctx) => ctx.scene.enter('EDIT_NAME_WIZARD'));
profileScene.action('edit_age', (ctx) => ctx.scene.enter('EDIT_AGE_WIZARD'));
profileScene.action('edit_bio', (ctx) => ctx.scene.enter('EDIT_BIO_WIZARD'));
profileScene.action('edit_photos', (ctx) => ctx.scene.enter('EDIT_PHOTOS_WIZARD'));
profileScene.action('edit_interest', (ctx) => ctx.scene.enter('EDIT_INTEREST_WIZARD'));
profileScene.action('edit_zodiac', (ctx) => ctx.scene.enter('EDIT_ZODIAC_WIZARD'));
profileScene.action('edit_location', (ctx) => ctx.scene.enter('EDIT_LOCATION_WIZARD'));

profileScene.action('view_likers', (ctx) => ctx.scene.enter('LIKERS_SCENE'));
profileScene.action('back_to_menu', async (ctx) => {
    await ctx.scene.leave();
    await ctx.replyWithMarkdown(PROMPTS.WELCOME, {
        reply_markup: {
            keyboard: [
                [{ text: '🚀 Discovery' }, { text: '🌟 Zodiac Match' }],
                [{ text: '👤 My Profile' }, { text: '💬 My Matches' }]
            ],
            resize_keyboard: true
        }
    });
    try { await ctx.answerCbQuery(); } catch (e) { }
});
