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
        [Markup.button.callback('📊 View Statistics', 'view_stats')],
        [Markup.button.callback('📜 Recent Activity', 'view_activity')],
        [Markup.button.callback('🏆 Referral Leaderboard', 'view_referrals')],
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

adminScene.action('view_stats', async (ctx) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Total & Verified Users
        const { count: totalUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
        const { count: verifiedUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_verified', true);

        // 2. New Signups Today
        const { count: newSignups } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).gt('created_at', today.toISOString());

        // 3. Swipes Today
        const { data: swipesToday } = await supabase.from('swipes').select('type').gt('created_at', today.toISOString());
        const likeCount = swipesToday?.filter(s => s.type === 'like').length || 0;
        const dislikeCount = swipesToday?.filter(s => s.type === 'dislike').length || 0;

        // 4. Matches Today
        const { count: matchesToday } = await supabase.from('matches').select('id', { count: 'exact', head: true }).gt('created_at', today.toISOString());

        const statsMsg = `📊 **Tebesa Bot Statistics** 📊\n\n` +
            `👥 **Total Users:** ${totalUsers || 0}\n` +
            `✅ **Verified Users:** ${verifiedUsers || 0}\n` +
            `✨ **New Today:** ${newSignups || 0}\n\n` +
            `🔥 **Activity Today:**\n` +
            `- Swipes: ${likeCount + dislikeCount} (❤️ ${likeCount} / ❌ ${dislikeCount})\n` +
            `- Matches: ${matchesToday || 0}\n\n` +
            `*Keep the vibe growing!* 🚀`;

        await ctx.editMessageText(statsMsg, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('⬅️ Back to Admin', 'reenter_admin')]
            ])
        });
    } catch (e) {
        console.error("Stats fetch error:", e);
        await ctx.answerCbQuery("Failed to fetch stats. 😔");
    }
    try { await ctx.answerCbQuery(); } catch (e) { }
});

adminScene.action('view_activity', async (ctx) => {
    try {
        // 1. Recent Signups
        const { data: recentSignups } = await supabase
            .from('profiles')
            .select('first_name, age, city, sub_city, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        // 2. Recent Matches
        // This is tricky because we need the names. We'll fetch the last 5 matches and then their profiles.
        const { data: recentMatches } = await supabase
            .from('matches')
            .select('user1_id, user2_id, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        let activityMsg = `📜 **Recent Activity Log** 📜\n\n`;

        activityMsg += `✨ **New Signups:**\n`;
        if (recentSignups && recentSignups.length > 0) {
            recentSignups.forEach(u => {
                activityMsg += `• ${u.first_name} (${u.age}), ${u.sub_city || u.city}\n`;
            });
        } else {
            activityMsg += `• No recent signups.\n`;
        }

        activityMsg += `\n❤️ **Recent Matches:**\n`;
        if (recentMatches && recentMatches.length > 0) {
            for (const m of recentMatches) {
                const { data: u1 } = await supabase.from('profiles').select('first_name').eq('id', m.user1_id).single();
                const { data: u2 } = await supabase.from('profiles').select('first_name').eq('id', m.user2_id).single();
                activityMsg += `• ${u1?.first_name || 'User'} ↔️ ${u2?.first_name || 'User'}\n`;
            }
        } else {
            activityMsg += `• No recent matches.\n`;
        }

        await ctx.editMessageText(activityMsg, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('⬅️ Back to Admin', 'reenter_admin')]
            ])
        });
    } catch (e) {
        console.error("Activity fetch error:", e);
        await ctx.answerCbQuery("Failed to fetch activity log.");
    }
    try { await ctx.answerCbQuery(); } catch (e) { }
});

adminScene.action('view_referrals', async (ctx) => {
    const { data: topReferrers, error } = await supabase
        .from('profiles')
        .select('first_name, referral_count')
        .gt('referral_count', 0)
        .order('referral_count', { ascending: false })
        .limit(10);

    if (error) {
        await ctx.answerCbQuery("Could not load leaderboard 😔");
        return;
    }

    let leaderboardMsg = `🏆 **Referral Leaderboard** 🏆\n\n`;
    if (!topReferrers || topReferrers.length === 0) {
        leaderboardMsg += "No referrals yet. 🚀";
    } else {
        topReferrers.forEach((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
            leaderboardMsg += `${medal} **${user.first_name}**: ${user.referral_count} referrals\n`;
        });
    }

    await ctx.editMessageText(leaderboardMsg, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Back to Admin', 'reenter_admin')]
        ])
    });
    try { await ctx.answerCbQuery(); } catch (e) { }
});

adminScene.action('reenter_admin', (ctx) => ctx.scene.reenter());

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
    (ctx.scene.state as any).rejecting_user_id = targetId;
    await ctx.reply(`❌ **Rejecting User ${targetId}**\n\nPlease type the reason for rejection (e.g., "Photo is blurry", "No peace sign").\n\nType 'cancel' to stop.`);
    await ctx.answerCbQuery();
});

adminScene.action('start_broadcast', async (ctx) => {
    await ctx.reply("📢 **Global Broadcast Mode**\n\nSend me the message you want to blast to EVERYONE. (Type 'cancel' to abort)");
    (ctx.scene.state as any).awaiting_broadcast = true;
    await ctx.answerCbQuery();
});

adminScene.on('text', async (ctx) => {
    const state = ctx.scene.state as any;
    const message = (ctx.message as any).text;

    if (message.toLowerCase() === 'cancel') {
        if (state.awaiting_broadcast) await ctx.reply("Broadcast cancelled.");
        if (state.rejecting_user_id) await ctx.reply("Rejection cancelled.");

        state.awaiting_broadcast = false;
        state.rejecting_user_id = null;
        return ctx.scene.reenter();
    }

    // Allow main menu buttons to work even from here
    const menuButtons = [
        '🚀 Discovery', '🚀 ፍለጋ (Discovery)',
        '🌟 Zodiac Match', '🌟 ኮከብ ተኳሽ', '🌟 ከክብ ተኳሽ', '🌟 ከከብ ተኳሽ',
        '👤 My Profile', '👤 ፕሮፋይሌ',
        '💬 My Matches', '💬 የኔ ተዛማጆች'
    ];

    if (menuButtons.includes(message)) {
        await ctx.scene.leave();
        if (message.includes('Discovery') || message.includes('ፍለጋ')) return ctx.scene.enter('DISCOVERY_SCENE');
        if (message.includes('Zodiac') || message.includes('ኮከብ') || message.includes('ከክብ') || message.includes('ከከብ')) return ctx.scene.enter('ZODIAC_DISCOVERY_SCENE');
        if (message.includes('Profile') || message.includes('ፕሮፋይሌ')) return ctx.scene.enter('PROFILE_SCENE');
        if (message.includes('Matches') || message.includes('ተዛማጆች')) return ctx.scene.enter('MATCHES_SCENE');
    }

    if (state.awaiting_broadcast) {
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
    }

    if (state.rejecting_user_id) {
        const userId = state.rejecting_user_id;
        const reason = message;

        // Update DB
        const { error } = await supabase
            .from('profiles')
            .update({
                is_verified: false,
                rejection_reason: reason
            })
            .eq('id', userId);

        if (error) {
            await ctx.reply(`Failed to update DB for user ${userId}: ${error.message}`);
        } else {
            // Notify User
            try {
                await ctx.telegram.sendMessage(userId,
                    `🚫 **Verification Update**\n\n` +
                    `Unfortunately, your profile verification was rejected.\n` +
                    `**Reason:** ${reason}\n\n` +
                    `Don't worry! You can try again right now. 👇`,
                    {
                        parse_mode: 'Markdown',
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback('🔄 Try Again', 'try_again_verification')]
                        ])
                    }
                );
                await ctx.reply(`User ${userId} rejected and notified.`);
            } catch (e) {
                console.error(e);
                await ctx.reply(`User ${userId} rejected but FAILED to notify (maybe they blocked the bot).`);
            }
        }

        state.rejecting_user_id = null;
        return ctx.scene.reenter();
    }
});

adminScene.action('exit_admin', (ctx) => ctx.scene.leave());
