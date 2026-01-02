import { Scenes, Markup } from 'telegraf';
import { KIFLE_KETEMAS } from '../content/prompts.js';
import { supabase } from '../services/supabase.js';

export const filtersScene = new Scenes.BaseScene<Scenes.SceneContext>('FILTERS_SCENE');

filtersScene.enter(async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return ctx.scene.leave();

    const { data: profile } = await supabase.from('profiles').select('language').eq('id', userId).single();
    const lang = profile?.language || 'en';
    (ctx.scene.state as any).language = lang;

    const session = ctx.session as any;
    const currentFilters = session.filters || {};

    const status = lang === 'am'
        ? `⚙️ **የአሁኑ ፊልተሮች**\n` +
        `• **እድሜ:** ${currentFilters.minAge ? `${currentFilters.minAge} - ${currentFilters.maxAge}` : 'ሁሉም'}\n` +
        `• **አድራሻ:** ${currentFilters.location ? currentFilters.location : 'ሁሉም'}\n\n` +
        `ምን ለመቀየር ይፈልጋሉ?`
        : `⚙️ **Current Filters**\n` +
        `• **Age:** ${currentFilters.minAge ? `${currentFilters.minAge} - ${currentFilters.maxAge}` : 'All'}\n` +
        `• **Location:** ${currentFilters.location ? currentFilters.location : 'All'}\n\n` +
        `What would you like to filter by?`;

    await ctx.reply(status, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(lang === 'am' ? '📅 የእድሜ ክልል' : '📅 Age Range', 'filter_age')],
            [Markup.button.callback(lang === 'am' ? '📍 አድራሻ' : '📍 Location', 'filter_location')],
            [Markup.button.callback(lang === 'am' ? '🗑️ ሁሉንም አጥፋ' : '🗑️ Clear All', 'filter_clear')],
            [Markup.button.callback(lang === 'am' ? '🔙 ተመለስ' : '🔙 Back to Discovery', 'back_to_discovery')]
        ])
    });
});

// --- Age Filter ---
filtersScene.action('filter_age', async (ctx) => {
    const lang = (ctx.scene.state as any).language;
    const prompt = lang === 'am' ? "📅 **የእድሜ ክልል ይምረጡ**:" : "📅 **Select Age Range**:";
    await ctx.editMessageText(prompt, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('18 - 22', 'age_18_22'), Markup.button.callback('23 - 27', 'age_23_27')],
            [Markup.button.callback('28 - 35', 'age_28_35'), Markup.button.callback('35+', 'age_35_100')],
            [Markup.button.callback(lang === 'am' ? '🔙 ተመለስ' : '🔙 Back', 'filter_home')]
        ])
    });
});

filtersScene.action(/age_(\d+)_(\d+)/, async (ctx) => {
    if (!ctx.match || !ctx.match[1] || !ctx.match[2]) return;
    const min = parseInt(ctx.match[1] as string);
    const max = parseInt(ctx.match[2] as string);

    (ctx.session as any).filters = { ...(ctx.session as any).filters, minAge: min, maxAge: max };

    await ctx.answerCbQuery("Age filter applied! ✅");
    return ctx.scene.reenter(); // Go back to main menu to show updated status
});

// --- Location Filter ---
filtersScene.action('filter_location', async (ctx) => {
    const lang = (ctx.scene.state as any).language;
    const prompt = lang === 'am' ? "📍 **የአድራሻ አይነት ይምረጡ**:" : "📍 **Select Location Type**:";
    await ctx.editMessageText(prompt, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(lang === 'am' ? 'አዲስ አበባ' : 'Addis Ababa', 'loc_type_addis')],
            [Markup.button.callback(lang === 'am' ? 'ከአዲስ አበባ ውጭ' : 'Outside Addis', 'loc_type_regional')],
            [Markup.button.callback(lang === 'am' ? '🔙 ተመለስ' : '🔙 Back', 'filter_home')]
        ])
    });
});

filtersScene.action('loc_type_addis', async (ctx) => {
    const lang = (ctx.scene.state as any).language;
    const buttons = KIFLE_KETEMAS.map(k => [Markup.button.callback(k, `set_loc_addis_${k}`)]);
    buttons.push([Markup.button.callback(lang === 'am' ? '🔙 ተመለስ' : '🔙 Back', 'filter_location')]);

    await ctx.editMessageText(lang === 'am' ? "📍 **ክፍለ ከተማ ይምረጡ**:" : "📍 **Select Sub-City**:", {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
    });
});

filtersScene.action(/set_loc_addis_(.+)/, async (ctx) => {
    if (!ctx.match || !ctx.match[1]) return;
    const loc = ctx.match[1] as string;
    (ctx.session as any).filters = { ...(ctx.session as any).filters, location: loc, isAddis: true };
    await ctx.answerCbQuery(`Filter set to ${loc} ✅`);
    return ctx.scene.reenter();
});

filtersScene.action('loc_type_regional', async (ctx) => {
    const lang = (ctx.scene.state as any).language;
    await ctx.reply(lang === 'am' ? "እባክዎ መፈለግ የሚፈልጉትን ከተማ ስም ይጻፉ (ለምሳሌ፦ 'Adama')። 🏙️" : "Please type the name of the city you want to filter by (e.g., 'Adama'). 🏙️");
    (ctx.scene.state as any).awaiting_city = true;
    await ctx.answerCbQuery();
});

filtersScene.on('text', async (ctx) => {
    if ((ctx.scene.state as any).awaiting_city) {
        const city = (ctx.message as any).text;
        (ctx.session as any).filters = { ...(ctx.session as any).filters, location: city, isAddis: false };
        (ctx.scene.state as any).awaiting_city = false;
        await ctx.reply(`Filter set to ${city} ✅`);
        return ctx.scene.reenter();
    }
});

// --- Clear & Nav ---
filtersScene.action('filter_clear', async (ctx) => {
    (ctx.session as any).filters = {};
    await ctx.answerCbQuery("Filters cleared! 🗑️");
    return ctx.scene.reenter();
});

filtersScene.action('filter_home', (ctx) => ctx.scene.reenter());

filtersScene.action('back_to_discovery', (ctx) => ctx.scene.enter('DISCOVERY_SCENE'));
