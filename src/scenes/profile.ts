import { Scenes, Markup } from 'telegraf';
import { supabase } from '../services/supabase.js';
import { ZODIACS, PROMPTS, t } from '../content/prompts.js';

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

    const lang = profile.language || 'en';
    const status = profile.is_verified
        ? (lang === 'am' ? 'የተረጋገጠ (Verified) ✅' : 'Verified ✅')
        : (lang === 'am' ? 'በመጠባበቅ ላይ ⏳' : 'Pending Verification ⏳');

    const zodiacData = ZODIACS.find(z => z.name === profile.zodiac);
    const zodiacText = zodiacData ? `${zodiacData.icon} ${lang === 'am' ? zodiacData.am : zodiacData.name}` : 'None';

    const caption = lang === 'am'
        ? `👤 <b>ፕሮፋይልህ/ሽ</b>\n\n` +
        `<b>ስም:</b> ${profile.first_name}\n` +
        `<b>እድሜ:</b> ${profile.age}\n` +
        `<b>አድራሻ:</b> ${profile.sub_city || profile.city}\n` +
        `<b>ባዮ:</b> ${profile.bio || 'የለም'}\n` +
        `<b>ኮከብ:</b> ${zodiacText} 🌟\n` +
        `<b>ፍላጎት:</b> ${profile.interested_in === 'male' ? 'ወንዶች' : profile.interested_in === 'female' ? 'ሴቶች' : 'ሁለቱንም'}\n` +
        `<b>ሁኔታ:</b> ${status}\n\n` +
        `❤️ <b>የተሰጡህ/ሽ ላይኮች:</b> ${likesCount?.length || 0}\n` +
        `🎁 <b>የጋበዝካቸው:</b> ${profile.referral_count || 0}`
        : `👤 <b>Your Profile</b>\n\n` +
        `<b>Name:</b> ${profile.first_name}\n` +
        `<b>Age:</b> ${profile.age}\n` +
        `<b>Location:</b> ${profile.sub_city || profile.city}\n` +
        `<b>Bio:</b> ${profile.bio || 'None'}\n` +
        `<b>Zodiac:</b> ${zodiacText} 🌟\n` +
        `<b>Interested In:</b> ${profile.interested_in}\n` +
        `<b>Status:</b> ${status}\n\n` +
        `❤️ <b>Likes Received:</b> ${likesCount?.length || 0}\n` +
        `🎁 <b>Referrals:</b> ${profile.referral_count || 0}`;

    const buttons = [
        [Markup.button.callback(lang === 'am' ? '❤️ ላይክ ያደረጉህ/ሽ' : '❤️ See Who Liked You', 'view_likers')],
        [Markup.button.callback(lang === 'am' ? '✏️ ስም ቀይር' : '✏️ Name', 'edit_name'), Markup.button.callback(lang === 'am' ? '🎂 እድሜ ቀይር' : '🎂 Age', 'edit_age')],
        [Markup.button.callback(lang === 'am' ? '✏️ ባዮ ቀይር' : '✏️ Bio', 'edit_bio'), Markup.button.callback(lang === 'am' ? '⭐ ኮከብ ቀይር' : '⭐ Zodiac', 'edit_zodiac')],
        [Markup.button.callback(lang === 'am' ? '🎯 ፍላጎት ቀይር' : '🎯 Edit Interest', 'edit_interest'), Markup.button.callback(lang === 'am' ? '📍 አድራሻ ቀይር' : '📍 Edit Location', 'edit_location')],
        [Markup.button.callback(lang === 'am' ? '🖼️ ፎቶ ቀይር' : '🖼️ Change Photos', 'edit_photos'), Markup.button.callback(lang === 'am' ? '🌐 ቋንቋ (Language)' : '🌐 Language', 'edit_language')],
        [Markup.button.callback(lang === 'am' ? '🎁 ጓደኛ ጋብዝ' : '🎁 Invite & Earn', 'invite_friends')]
    ];

    if (profile.voice_intro_url) {
        buttons.push([
            Markup.button.callback(lang === 'am' ? '🎤 ድምፄን ስማ' : '🎤 Hear My Voice', 'play_my_voice'),
            Markup.button.callback(lang === 'am' ? '🎤 ድምጽ ቀይር' : '🎤 Edit Voice Intro', 'edit_voice')
        ]);
    } else {
        buttons.push([Markup.button.callback(lang === 'am' ? '🎤 ድምጽ ጨምር' : '🎤 Add Voice Intro', 'edit_voice')]);
    }

    buttons.push([Markup.button.callback(lang === 'am' ? '🏠 ወደ ዋናው ዝርዝር' : '🏠 Back to Menu', 'back_to_menu')]);

    try {
        await ctx.replyWithPhoto(profile.photo_urls[0], {
            caption,
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(buttons)
        });
    } catch (e) {
        console.error("Profile photo failed to send:", e);
        // Fallback to text
        await ctx.reply(`👤 <b>Your Profile</b>\n(Photo missing)\n\n` +
            `<b>Name:</b> ${profile.first_name}\n` +
            `<b>Age:</b> ${profile.age}\n` +
            `<b>Location:</b> ${profile.sub_city || profile.city}\n` +
            `<b>Bio:</b> ${profile.bio || 'None'}\n` +
            `<b>Zodiac:</b> ${zodiacText} 🌟\n` +
            `<b>Interested In:</b> ${profile.interested_in}\n` +
            `<b>Status:</b> ${status}\n\n` +
            `❤️ <b>Likes Received:</b> ${likesCount?.length || 0}`, {
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard(buttons)
        });
    }
});

profileScene.action('edit_language', (ctx) => ctx.scene.enter('EDIT_LANGUAGE_WIZARD'));

profileScene.action('edit_name', (ctx) => ctx.scene.enter('EDIT_NAME_WIZARD'));
profileScene.action('edit_age', (ctx) => ctx.scene.enter('EDIT_AGE_WIZARD'));
profileScene.action('edit_bio', (ctx) => ctx.scene.enter('EDIT_BIO_WIZARD'));
profileScene.action('edit_photos', (ctx) => ctx.scene.enter('EDIT_PHOTOS_WIZARD'));
profileScene.action('edit_interest', (ctx) => ctx.scene.enter('EDIT_INTEREST_WIZARD'));
profileScene.action('edit_zodiac', (ctx) => ctx.scene.enter('EDIT_ZODIAC_WIZARD'));
profileScene.action('edit_location', (ctx) => ctx.scene.enter('EDIT_LOCATION_WIZARD'));
profileScene.action('edit_voice', (ctx) => ctx.scene.enter('EDIT_VOICE_WIZARD'));

profileScene.action('play_my_voice', async (ctx) => {
    const userId = ctx.from?.id;
    const { data: profile } = await supabase.from('profiles').select('voice_intro_url').eq('id', userId).single();
    if (profile?.voice_intro_url) {
        try {
            await ctx.replyWithVoice(profile.voice_intro_url);
        } catch (e) {
            await ctx.answerCbQuery("Aiyee! Your voice intro is not working. Try recording a new one!", { show_alert: true });
        }
    } else {
        await ctx.answerCbQuery("No voice intro found!");
    }
    try { await ctx.answerCbQuery(); } catch (e) { }
});

profileScene.action('view_likers', (ctx) => ctx.scene.enter('LIKERS_SCENE'));

profileScene.action('invite_friends', async (ctx) => {
    const userId = ctx.from?.id;
    const botInfo = await ctx.telegram.getMe();
    const referralLink = `https://t.me/${botInfo.username}?start=ref_${userId}`;

    const { data: profile } = await supabase.from('profiles').select('referral_count, language').eq('id', userId).single();
    const lang = profile?.language || 'en';
    const inviteMsg = lang === 'am'
        ? `🎁 <b>ጓደኛ ጋብዝ እና ተጠቀም!</b> 🎁\n\n` +
        `ይህን የግል ሊንክ ለጓደኞችህ/ሽ ላክ። ሲመዘገቡ እና ሲረጋገጡ አንተ/ቺ <b>የአራዳ ነጥብ</b> ታገኛለህ/ሽ! 🚀\n\n` +
        `<b>የአንተ/ቺ ሊንክ:</b> ${referralLink}\n\n` +
        `<b>የጋበዝካቸው:</b> ${profile?.referral_count || 0}\n\n` +
        `<i>አራዳ ሁን/ኚ፣ ፍቅርን አሰራጭ!</i>`
        : `🎁 <b>Invite & Earn!</b> 🎁\n\n` +
        `Share your unique link with friends. When they register and get verified, you'll earn <b>Arada Points</b>! 🚀\n\n` +
        `<b>Your Link:</b> ${referralLink}\n\n` +
        `<b>Current Referrals:</b> ${profile?.referral_count || 0}\n\n` +
        `<i>Stay Arada, spread the vibe!</i>`;

    await ctx.reply(inviteMsg, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
            [Markup.button.url(lang === 'am' ? '🚀 ሊንኩን ላክ' : '🚀 Share Link', `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(lang === 'am' ? "ጠበሳን ተቀላቀል - የልብህን ትርታ አግኝ! 🔥" : "Join Tebesa - find your vibe-mate! 🔥")}`)],
            [Markup.button.callback(lang === 'am' ? '🔙 ተመለስ' : '🔙 Back to Profile', 'reenter_profile')]
        ])
    });
    try { await ctx.answerCbQuery(); } catch (e) { }
});

profileScene.action('reenter_profile', (ctx) => ctx.scene.reenter());

profileScene.action('view_likers', (ctx) => ctx.scene.enter('LIKERS_SCENE'));
profileScene.action('back_to_menu', async (ctx) => {
    const { data: profile } = await supabase.from('profiles').select('language').eq('id', ctx.from?.id).single();
    const lang = profile?.language || 'en';

    await ctx.scene.leave();
    await ctx.replyWithMarkdown(t(lang, 'WELCOME'), {
        reply_markup: {
            keyboard: lang === 'am' ? [
                [{ text: '🚀 ፍለጋ (Discovery)' }, { text: '🌟 ኮከብ ጥምረት' }],
                [{ text: '👤 ፕሮፋይሌ' }, { text: '💬 የኔ ተዛማጆች' }]
            ] : [
                [{ text: '🚀 Discovery' }, { text: '🌟 Zodiac Match' }],
                [{ text: '👤 My Profile' }, { text: '💬 My Matches' }]
            ],
            resize_keyboard: true
        }
    });
    try { await ctx.answerCbQuery(); } catch (e) { }
});
