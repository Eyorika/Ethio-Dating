import { Scenes, Markup } from 'telegraf';
import { supabase } from '../services/supabase.js';

export const verificationScene = new Scenes.BaseScene<Scenes.SceneContext>('VERIFICATION_SCENE');

verificationScene.enter(async (ctx) => {
    await ctx.reply("🔄 **Re-Verification**\n\nPlease send a NEW selfie with two fingers (Peace sign) ✌️ to verify.", Markup.removeKeyboard());
});

verificationScene.on('photo', async (ctx) => {
    const photo = (ctx.message as any).photo.pop();
    const photoId = photo.file_id;

    await ctx.reply("Perfect! Resubmitting for review... ⏳");

    // Update DB
    const { error } = await supabase.from('profiles').update({
        verification_photo_url: photoId,
        rejection_reason: null, // Clear previous rejection
        is_verified: false // Ensure it's pending
    }).eq('id', ctx.from?.id);

    if (error) {
        console.error('Supabase Re-verify Error:', error);
        await ctx.reply(`Aiyee! Something went wrong. Error: ${error.message}. Try again.`);
    } else {
        await ctx.reply("Done! Your profile is pending verification again. ✅", Markup.removeKeyboard());

        // Notify Admin
        const adminId = process.env.ADMIN_ID;
        if (adminId) {
            try {
                const { data: profile } = await supabase.from('profiles').select('first_name, age').eq('id', ctx.from?.id).single();
                await ctx.telegram.sendMessage(adminId,
                    `🔔 **Re-Verification Submitted!**\n\n` +
                    `**Name:** ${profile?.first_name}\n` +
                    `**Age:** ${profile?.age}\n` +
                    `**ID:** \`${ctx.from?.id}\`\n\n` +
                    `Go to /admin -> Pending Verifications to approve.`,
                    { parse_mode: 'Markdown' }
                );
            } catch (e) {
                console.error("Failed to notify admin:", e);
            }
        }
    }
    return ctx.scene.leave();
});

verificationScene.on('text', async (ctx) => {
    await ctx.reply("Please send a photo, not text! 📸");
});
