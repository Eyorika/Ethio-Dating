import { Scenes, Markup } from 'telegraf';
import { supabase } from '../services/supabase.js';
import { t } from '../content/prompts.js';

export const chatScene = new Scenes.BaseScene<Scenes.SceneContext>('CHAT_SCENE');

chatScene.enter(async (ctx) => {
    const state = ctx.scene.state as any;
    const targetUserId = state.targetUserId;
    const userId = ctx.from?.id;

    if (!targetUserId) {
        await ctx.reply("Invalid chat session.");
        return ctx.scene.enter('MATCHES_SCENE');
    }

    const { data: profile } = await supabase.from('profiles').select('language').eq('id', userId).single();
    const lang = profile?.language || 'en';
    state.lang = lang;

    const { data: targetProfile } = await supabase.from('profiles').select('first_name, age, sub_city, city').eq('id', targetUserId).single();
    const targetName = targetProfile?.first_name || 'User';

    // Send chat header with match info
    const headerMsg = lang === 'am'
        ? `💬 <b>ከ ${targetName} ጋር ውይይት</b>\n📍 ${targetProfile?.sub_city || targetProfile?.city}\n━━━━━━━━━━━━━━━`
        : `💬 <b>Chat with ${targetName}</b>\n📍 ${targetProfile?.sub_city || targetProfile?.city}\n━━━━━━━━━━━━━━━`;

    await ctx.reply(headerMsg, { parse_mode: 'HTML' });

    // Mark all messages from target as read
    await supabase.from('messages')
        .update({ is_read: true })
        .eq('sender_id', targetUserId)
        .eq('receiver_id', userId)
        .eq('is_read', false);

    // Fetch last 5 messages
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(5);

    if (messages && messages.length > 0) {
        // Send messages in chronological order (oldest first)
        for (const msg of messages.reverse()) {
            const isMe = msg.sender_id.toString() === userId?.toString();
            const senderEmoji = isMe ? '👤' : '💬';
            const senderName = isMe ? (lang === 'am' ? 'አንተ/ቺ' : 'You') : targetName;
            const timestamp = new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const readReceipt = isMe ? (msg.is_read ? '✓✓' : '✓') : '';

            let messageText = '';
            if (msg.message_type === 'voice') {
                messageText = lang === 'am' ? '🎤 የድምጽ መልእክት' : '🎤 Voice message';
            } else if (msg.message_type === 'photo') {
                messageText = lang === 'am' ? '📷 ፎቶ (ራስ-ሰራሽ ተሰርዟል)' : '📷 Photo (auto-deleted)';
            } else {
                messageText = msg.content || '';
            }

            const formattedMsg = `${senderEmoji} <b>${senderName}</b> <i>(${timestamp})</i> ${readReceipt}\n${messageText}`;
            await ctx.reply(formattedMsg, { parse_mode: 'HTML' });
        }
    } else {
        const icebreaker = lang === 'am'
            ? '✨ ጸጥታውን ይስበሩ! የመጀመሪያውን መልእክት ይላኩ። 🚀'
            : '✨ Break the ice! Send the first message. 🚀';
        await ctx.reply(icebreaker);
    }

    // Send instruction message with keyboard
    const instructionMsg = lang === 'am'
        ? '📝 ጽሑፍ፣ 🎤 ድምጽ ወይም 📷 ፎቶ ይላኩ'
        : '📝 Send text, 🎤 voice, or 📷 photo';

    const keyboard = Markup.keyboard([
        [lang === 'am' ? '🔙 ተመለስ' : '🔙 Back to Matches']
    ]).resize();

    await ctx.reply(instructionMsg, keyboard);
});

chatScene.hears(['🔙 ተመለስ', '🔙 Back to Matches'], async (ctx) => {
    await ctx.reply('↩️', Markup.removeKeyboard());
    return ctx.scene.enter('MATCHES_SCENE');
});

chatScene.on('text', async (ctx) => {
    const state = ctx.scene.state as any;
    const targetUserId = state.targetUserId;
    const userId = ctx.from?.id;
    const message = ctx.message.text;
    const lang = state.lang || 'en';

    if (message.startsWith('🔙')) return; // Handled by hears

    // Save message to DB
    const { error } = await supabase.from('messages').insert({
        sender_id: userId,
        receiver_id: targetUserId,
        content: message,
        message_type: 'text'
    });

    if (error) {
        await ctx.reply("Aiyee! Failed to send message.");
        return;
    }

    // Display sent message immediately
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const sentMsg = `👤 <b>${lang === 'am' ? 'አንተ/ቺ' : 'You'}</b> <i>(${timestamp})</i> ✓\n${message}`;
    await ctx.reply(sentMsg, { parse_mode: 'HTML' });

    // Notify receiver
    try {
        const { data: myProfile } = await supabase.from('profiles').select('first_name').eq('id', userId).single();
        const myName = myProfile?.first_name || 'Someone';

        const { data: targetProfile } = await supabase.from('profiles').select('language').eq('id', targetUserId).single();
        const targetLang = targetProfile?.language || 'en';

        const notifyMsg = targetLang === 'am'
            ? `📩 <b>ከ ${myName} አዲስ መልእክት:</b>\n\n"${message}"\n\nወደ 'የኔ ተዛማጆች' በመሄድ መልስ ይስጡ።`
            : `📩 <b>New message from ${myName}:</b>\n\n"${message}"\n\nGo to 'My Matches' to reply.`;

        await ctx.telegram.sendMessage(targetUserId, notifyMsg, {
            parse_mode: 'HTML'
        });
    } catch (e) {
        console.error("Failed to notify receiver:", e);
    }
});

// Handle Voice Messages
chatScene.on('voice', async (ctx) => {
    const state = ctx.scene.state as any;
    const targetUserId = state.targetUserId;
    const userId = ctx.from?.id;
    const lang = state.lang || 'en';
    const voiceFileId = ctx.message.voice.file_id;

    // Save voice message to DB
    const { error } = await supabase.from('messages').insert({
        sender_id: userId,
        receiver_id: targetUserId,
        message_type: 'voice',
        media_url: voiceFileId,
        content: lang === 'am' ? 'የድምጽ መልእክት' : 'Voice message'
    });

    if (error) {
        await ctx.reply("Aiyee! Failed to send voice message.");
        return;
    }

    // Display sent voice message immediately
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const sentMsg = `👤 <b>${lang === 'am' ? 'አንተ/ቺ' : 'You'}</b> <i>(${timestamp})</i> ✓
🎤 ${lang === 'am' ? 'የድምጽ መልእክት' : 'Voice message'}`;
    await ctx.reply(sentMsg, { parse_mode: 'HTML' });

    // Notify receiver
    try {
        const { data: myProfile } = await supabase.from('profiles').select('first_name').eq('id', userId).single();
        const myName = myProfile?.first_name || 'Someone';

        const { data: targetProfile } = await supabase.from('profiles').select('language').eq('id', targetUserId).single();
        const targetLang = targetProfile?.language || 'en';

        const notifyMsg = targetLang === 'am'
            ? `🎤 <b>${myName} የድምጽ መልእክት ላከ</b>\n\nወደ 'የኔ ተዛማጆች' በመሄድ ያዳምጡ።`
            : `🎤 <b>${myName} sent a voice message</b>\n\nGo to 'My Matches' to listen.`;

        await ctx.telegram.sendMessage(targetUserId, notifyMsg, { parse_mode: 'HTML' });

        // Also send the actual voice file
        await ctx.telegram.sendVoice(targetUserId, voiceFileId);
    } catch (e) {
        console.error("Failed to notify receiver:", e);
    }
});

// Handle Photos with Auto-Delete
chatScene.on('photo', async (ctx) => {
    const state = ctx.scene.state as any;
    const targetUserId = state.targetUserId;
    const userId = ctx.from?.id;
    const lang = state.lang || 'en';
    const photoFileId = ctx.message.photo?.[ctx.message.photo.length - 1]?.file_id;

    if (!photoFileId) {
        await ctx.reply("Failed to process photo.");
        return;
    }

    // Save photo message to DB
    const { error } = await supabase.from('messages').insert({
        sender_id: userId,
        receiver_id: targetUserId,
        message_type: 'photo',
        media_url: photoFileId,
        content: lang === 'am' ? 'ፎቶ' : 'Photo'
    });

    if (error) {
        await ctx.reply("Aiyee! Failed to send photo.");
        return;
    }

    // Send privacy warning (first time only)
    if (!state.photoWarningShown) {
        const warningMsg = lang === 'am'
            ? "⚠️ ፎቶዎች ከ60 ሰከንድ በኋላ በራስ-ሰራሽ ይሰረዛሉ።"
            : "⚠️ Photos will auto-delete after 60 seconds for privacy.";
        await ctx.reply(warningMsg);
        state.photoWarningShown = true;
    }

    // Display sent photo message immediately
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const sentMsg = `👤 <b>${lang === 'am' ? 'አንተ/ቺ' : 'You'}</b> <i>(${timestamp})</i> ✓
📷 ${lang === 'am' ? 'ፎቶ (60 ሰከንድ ይቀራል)' : 'Photo (60s remaining)'}`;
    await ctx.reply(sentMsg, { parse_mode: 'HTML' });

    // Notify receiver and send photo with spoiler
    try {
        const { data: myProfile } = await supabase.from('profiles').select('first_name').eq('id', userId).single();
        const myName = myProfile?.first_name || 'Someone';

        const { data: targetProfile } = await supabase.from('profiles').select('language').eq('id', targetUserId).single();
        const targetLang = targetProfile?.language || 'en';

        const notifyMsg = targetLang === 'am'
            ? `📷 <b>${myName} ፎቶ ላከ</b>\n\n⚠️ ከ60 ሰከንድ በኋላ በራስ-ሰራሽ ይሰረዛል።`
            : `📷 <b>${myName} sent a photo</b>\n\n⚠️ Auto-deletes in 60 seconds.`;

        await ctx.telegram.sendMessage(targetUserId, notifyMsg, { parse_mode: 'HTML' });

        // Send photo with spoiler effect
        const sentPhoto = await ctx.telegram.sendPhoto(targetUserId, photoFileId, {
            has_spoiler: true,
            caption: targetLang === 'am' ? '⏱️ 60 ሰከንድ ይቀራል' : '⏱️ 60 seconds remaining'
        });

        // Auto-delete after 60 seconds
        setTimeout(async () => {
            try {
                await ctx.telegram.deleteMessage(targetUserId, sentPhoto.message_id);
            } catch (e) {
                console.error("Failed to auto-delete photo:", e);
            }
        }, 60000);
    } catch (e) {
        console.error("Failed to send photo:", e);
    }
});
