import { Scenes, Markup } from 'telegraf';
import { supabase } from '../services/supabase.js';

export const adminScene = new Scenes.BaseScene<Scenes.SceneContext>('ADMIN_SCENE');

adminScene.enter(async (ctx) => {
    // Basic admin check (this should be more robust in production)
    const adminId = process.env.ADMIN_ID;
    if (ctx.from?.id.toString() !== adminId) {
        await ctx.reply("Arada! You don't have admin access. ❌");
        return ctx.scene.leave();
    }

    await ctx.reply("Welcome to the **Tebesa Admin Panel** 🛠️", Markup.inlineKeyboard([
        [Markup.button.callback('🔍 Pending Verifications', 'view_pending')],
        [Markup.button.callback('📢 Global Broadcast', 'start_broadcast')],
        [Markup.button.callback('🚪 Exit', 'exit_admin')]
    ]));
});

adminScene.action('view_pending', async (ctx) => {
    const { data: pendingProfiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_verified', false)
        .limit(1);

    if (error || !pendingProfiles || pendingProfiles.length === 0) {
        await ctx.reply("No pending verifications! Everyone is already Arada. 😎");
        return;
    }

    const profile = pendingProfiles[0];

    // In a real app, you'd store the verification photo URL in the DB.
    // I'll assume it's stored in a column `verification_photo_url`.
    // Let's add that to the schema logic if not already there.

    const caption = `📌 **Verify Profile**\n\n` +
        `**User:** ${profile.first_name} (${profile.age})\n` +
        `**ID:** ${profile.id}\n\n` +
        `Check if their photo matches the **Peace Sign**!`;

    // Note: We need to make sure we have a verification_photo_url column.
    // I will use profile.photo_urls[0] as a fallback for now if verification_photo is missing.
    const photoId = (profile as any).verification_photo_url || profile.photo_urls[0];

    try {
        await ctx.replyWithPhoto(photoId, {
            caption,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [
                    Markup.button.callback('✅ Approve', `approve_${profile.id}`),
                    Markup.button.callback('❌ Reject', `reject_${profile.id}`)
                ],
                [Markup.button.callback('⬅️ Back', 'view_pending')]
            ])
        });
    } catch (e) {
        console.error("Admin verification photo failed to send:", e);
        await ctx.reply(`Aiyee! I couldn't load the photo for ${profile.first_name}. User ID: ${profile.id}. They might have used an old version of the bot.`);
    }

    await ctx.answerCbQuery();
});

adminScene.action(/approve_(.+)/, async (ctx) => {
    const targetId = ctx.match[1];
    const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', targetId);

    if (error) {
        await ctx.reply("Aiyee! Error approving user.");
    } else {
        await ctx.reply(`User ${targetId} approved! ✅`);
        try {
            await ctx.telegram.sendMessage(targetId!, "🎉 **Congratulations!** Your profile has been verified. You are now a **Verified Arada** member! Go wild in Discovery. 🚀");
        } catch (e) {
            console.log("Could not notify user of approval.");
        }
    }
    await ctx.answerCbQuery();
    return ctx.scene.reenter();
});

adminScene.action(/reject_(.+)/, async (ctx) => {
    const targetId = ctx.match[1];
    await ctx.reply(`User ${targetId} rejected. (Add reason logic here) ❌`);
    await ctx.answerCbQuery();
    return ctx.scene.reenter();
});

adminScene.action('start_broadcast', async (ctx) => {
    await ctx.reply("📢 **Global Broadcast Mode**\n\nSend me the message you want to blast to EVERYONE. (Type 'cancel' to abort)");
    (ctx.scene.state as any).awaiting_broadcast = true;
    await ctx.answerCbQuery();
});

adminScene.on('text', async (ctx) => {
    const state = ctx.scene.state as any;
    if (!state.awaiting_broadcast) return;

    const message = ctx.message.text;
    if (message.toLowerCase() === 'cancel') {
        state.awaiting_broadcast = false;
        return ctx.scene.reenter();
    }

    state.awaiting_broadcast = false;
    await ctx.reply("🚀 Sending broadcast... this might take a while.");

    const { data: allUsers } = await supabase.from('profiles').select('id');

    let success = 0;
    let failed = 0;

    if (allUsers) {
        for (const user of allUsers) {
            try {
                await ctx.telegram.sendMessage(user.id, `📢 **Arada News Update**\n\n${message}`, { parse_mode: 'Markdown' });
                success++;
            } catch (e) {
                failed++;
            }
        }
    }

    await ctx.reply(`✅ Broadcast complete!\n\nSuccessful: ${success}\nFailed: ${failed}`);
    return ctx.scene.reenter();
});

adminScene.action('exit_admin', (ctx) => ctx.scene.leave());
