import { Scenes, Markup } from 'telegraf';
import { supabase } from '../services/supabase.js';
import { KIFLE_KETEMAS, PROMPTS, ZODIACS } from '../content/prompts.js';

// Edit Bio Wizard
export const editBioWizard = new Scenes.WizardScene(
    'EDIT_BIO_WIZARD',
    async (ctx) => {
        await ctx.reply("Tell me something Arada for your bio! 😉 (Send your new bio text)");
        return ctx.wizard.next();
    },
    async (ctx) => {
        const bio = (ctx.message as any).text;
        if (!bio) {
            await ctx.reply("Please send some text for your bio!");
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ bio })
            .eq('id', ctx.from?.id);

        if (error) {
            await ctx.reply("Aiyee! I couldn't update your bio. Try again later.");
        } else {
            await ctx.reply("Bio updated! You're looking even more Arada now. 🔥");
        }
        return ctx.scene.enter('PROFILE_SCENE');
    }
);

// Edit Photos Wizard
export const editPhotosWizard = new Scenes.WizardScene(
    'EDIT_PHOTOS_WIZARD',
    async (ctx) => {
        const { data: profile } = await supabase.from('profiles').select('language').eq('id', ctx.from?.id).single();
        const lang = profile?.language || 'en';
        (ctx.wizard.state as any).language = lang;

        const prompt = lang === 'am'
            ? "ስታይልህን/ሽን እያደስክ/ሽ ነው? 😎 እስከ 3 አዳዲስ ፎቶዎችን (አንድ በአንድ) ላክልኝ። \n\nስትጨርስ/ሺ '✅ ጨርሻለሁ' የሚለውን ንካ።"
            : "Refreshing your look? 😎 Send me up to 3 new photos (one by one). \n\nClick '✅ Done' when you're finished.";

        await ctx.reply(prompt, Markup.keyboard([
            [lang === 'am' ? '✅ ጨርሻለሁ' : '✅ Done']
        ]).resize());

        (ctx.wizard.state as any).photos = [];
        return ctx.wizard.next();
    },
    async (ctx) => {
        const state = ctx.wizard.state as any;
        const lang = state.language;

        if ((ctx.message as any).photo) {
            const photo = (ctx.message as any).photo.pop();
            state.photos.push(photo.file_id);
            const prompt = lang === 'am' ? `ፎቶ ${state.photos.length} ተጨምሯል! ሌላ ላክ ወይስ '✅ ጨርሻለሁ' የሚለውን ንካ።` : `Photo ${state.photos.length} added! Send another or click '✅ Done'.`;
            await ctx.reply(prompt);
        } else if ((ctx.message as any).text === '✅ Done' || (ctx.message as any).text === '✅ ጨርሻለሁ') {
            if (state.photos.length === 0) {
                await ctx.reply(lang === 'am' ? "ፎቶዎችን መቀየር ከፈለግህ/ሽ ቢያንስ አንድ ፎቶ መላክ አለብህ/ሽ!" : "You need to send at least one photo if you want to change them!");
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .update({ photo_urls: state.photos })
                .eq('id', ctx.from?.id);

            if (error) {
                await ctx.reply(lang === 'am' ? "Aiyee! ፎቶዎችህን/ሽን ማስተካከል አልቻልኩም።" : "Aiyee! Something went wrong updating your photos.");
            } else {
                await ctx.reply(lang === 'am' ? "ፎቶዎችህ/ሽ ተስተካክለዋል! 📸" : "Photos updated! Looking sharp. 📸", Markup.removeKeyboard());
            }
            return ctx.scene.enter('PROFILE_SCENE');
        }
    }
);
// Edit Interest Wizard
export const editInterestWizard = new Scenes.WizardScene(
    'EDIT_INTEREST_WIZARD',
    async (ctx) => {
        const { data: profile } = await supabase.from('profiles').select('language').eq('id', ctx.from?.id).single();
        const lang = profile?.language || 'en';
        (ctx.wizard.state as any).language = lang;

        const prompt = lang === 'am'
            ? "ማንን ማግኘት ትፈልጋለህ/ሽ? (ወንዶች/ሴቶች/ሁለቱንም)"
            : "Who are you interested in meeting? (male/female/both)";

        await ctx.reply(prompt, {
            reply_markup: {
                keyboard: lang === 'am'
                    ? [[{ text: 'ወንዶች' }, { text: 'ሴቶች' }], [{ text: 'ሁለቱንም' }]]
                    : [[{ text: 'male' }, { text: 'female' }], [{ text: 'both' }]],
                one_time_keyboard: true,
                resize_keyboard: true
            }
        });
        return ctx.wizard.next();
    },
    async (ctx) => {
        const interestText = (ctx.message as any).text;
        const lang = (ctx.wizard.state as any).language;

        let interested_in = 'both';
        if (interestText === 'ወንዶች' || interestText === 'male') interested_in = 'male';
        if (interestText === 'ሴቶች' || interestText === 'female') interested_in = 'female';

        const { error } = await supabase
            .from('profiles')
            .update({ interested_in })
            .eq('id', ctx.from?.id);

        if (error) {
            await ctx.reply(lang === 'am' ? "Aiyee! ምርጫህን/ሽን ማስተካከል አልቻልኩም።" : "Aiyee! I couldn't update your preference.", Markup.removeKeyboard());
        } else {
            await ctx.reply(lang === 'am' ? "ምርጫህ/ሽ ተስተካክሏል! 🎯" : "Preferences updated! 🎯", Markup.removeKeyboard());
        }
        return ctx.scene.enter('PROFILE_SCENE');
    }
);
// Edit Location Wizard
export const editLocationWizard = new Scenes.WizardScene(
    'EDIT_LOCATION_WIZARD',
    // Step 1: Territory choice
    async (ctx) => {
        const { data: profile } = await supabase.from('profiles').select('language').eq('id', ctx.from?.id).single();
        const lang = profile?.language || 'en';
        (ctx.wizard.state as any).language = lang;

        const locPrompt = lang === 'am'
            ? "ግዛትህ የት ነው? 📍 አዲስ አበባ ወይስ ከዛ ውጭ?"
            : PROMPTS.REGISTRATION.LOCATION;

        await ctx.reply(locPrompt, {
            reply_markup: {
                keyboard: lang === 'am'
                    ? [[{ text: 'አዲስ አበባ' }], [{ text: 'ከአዲስ አበባ ውጭ' }]]
                    : [[{ text: 'Addis Ababa' }], [{ text: 'Outside Addis' }]],
                one_time_keyboard: true,
                resize_keyboard: true
            }
        });
        return ctx.wizard.next();
    },
    // Step 2: Specific Sub-city or City
    async (ctx) => {
        const loc = (ctx.message as any).text;
        const lang = (ctx.wizard.state as any).language;
        (ctx.wizard.state as any).location_type = (loc === 'Addis Ababa' || loc === 'አዲስ አበባ') ? 'addis' : 'regional';

        if ((ctx.wizard.state as any).location_type === 'addis') {
            const prompt = lang === 'am' ? "የክፍለ ከተማ ምርጫህ/ሽ:" : "Select your Sub-city (Kifle Ketema):";
            await ctx.reply(prompt, {
                reply_markup: {
                    keyboard: KIFLE_KETEMAS.map(k => [{ text: k }]),
                    one_time_keyboard: true,
                    resize_keyboard: true
                }
            });
        } else {
            const prompt = lang === 'am' ? "የየትኛው ከተማ ተወካይ ነህ/ሽ? (ለምሳሌ አዳማ፣ ሀዋሳ)" : "Which city are you repping? (e.g., Adama, Hawassa)";
            await ctx.reply(prompt, Markup.removeKeyboard());
        }
        return ctx.wizard.next();
    },
    // Step 3: Save to DB
    async (ctx) => {
        const msg = (ctx.message as any).text;
        const lang = (ctx.wizard.state as any).language;
        const state = ctx.wizard.state as any;

        const updateData: any = {
            location_type: state.location_type
        };

        if (state.location_type === 'addis') {
            updateData.sub_city = msg;
            updateData.city = 'Addis Ababa';
        } else {
            updateData.city = msg;
            updateData.sub_city = null;
        }

        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', ctx.from?.id);

        if (error) {
            await ctx.reply(lang === 'am' ? "Aiyee! አድራሻህን/ሽን ማስተካከል አልቻልኩም።" : "Aiyee! I couldn't update your location.", Markup.removeKeyboard());
        } else {
            await ctx.reply(lang === 'am' ? "አድራሻህ/ሽ ተስተካክሏል! 📍" : "Location updated! 📍", Markup.removeKeyboard());
        }
        return ctx.scene.enter('PROFILE_SCENE');
    }
);
// Edit Zodiac Wizard
export const editZodiacWizard = new Scenes.WizardScene(
    'EDIT_ZODIAC_WIZARD',
    async (ctx) => {
        const { data: profile } = await supabase.from('profiles').select('language').eq('id', ctx.from?.id).single();
        const lang = profile?.language || 'en';
        (ctx.wizard.state as any).language = lang;

        const prompt = lang === 'am' ? "የኮከብ ምልክትህ/ሽ የትኛው ነው? ⭐" : "What's your zodiac sign? ⭐";

        await ctx.reply(prompt, Markup.keyboard(
            ZODIACS.map(z => [{ text: `${z.icon} ${lang === 'am' ? z.am : z.name}` }])
        ).resize());

        return ctx.wizard.next();
    },
    async (ctx) => {
        const zodiacText = (ctx.message as any).text;
        const lang = (ctx.wizard.state as any).language;
        const foundZodiac = ZODIACS.find(z => zodiacText.includes(z.name) || zodiacText.includes(z.am));
        const zodiac = foundZodiac?.name || 'Aries';

        const { error } = await supabase
            .from('profiles')
            .update({ zodiac })
            .eq('id', ctx.from?.id);

        if (error) {
            await ctx.reply(lang === 'am' ? "Aiyee! ኮከብህን/ሽን ማስተካከል አልቻልኩም።" : "Aiyee! I couldn't update your zodiac.", Markup.removeKeyboard());
        } else {
            await ctx.reply(lang === 'am' ? "ኮከብህ/ሽ ተስተካክሏል! ⭐" : "Zodiac updated! ⭐", Markup.removeKeyboard());
        }
        return ctx.scene.enter('PROFILE_SCENE');
    }
);
// Edit Name Wizard
export const editNameWizard = new Scenes.WizardScene(
    'EDIT_NAME_WIZARD',
    async (ctx) => {
        const { data: profile } = await supabase.from('profiles').select('language').eq('id', ctx.from?.id).single();
        const lang = profile?.language || 'en';
        (ctx.wizard.state as any).language = lang;

        const prompt = lang === 'am' ? "በምን ስም ልጥራህ/ሽ? 👤" : "What should I call you? 👤";
        await ctx.reply(prompt);
        return ctx.wizard.next();
    },
    async (ctx) => {
        const name = (ctx.message as any).text;
        const lang = (ctx.wizard.state as any).language;

        if (!name) {
            await ctx.reply(lang === 'am' ? "እባክህ/ሽ ትክክለኛ ስም አስገባ።" : "Please enter a valid name.");
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ first_name: name })
            .eq('id', ctx.from?.id);

        if (error) {
            await ctx.reply(lang === 'am' ? "Aiyee! ስምህን/ሽን መቀየር አልቻልኩም።" : "Aiyee! I couldn't update your name.");
        } else {
            await ctx.reply(lang === 'am' ? "ስምህ/ሽ ተስተካክሏል! ✅" : "Name updated! ✅");
        }
        return ctx.scene.enter('PROFILE_SCENE');
    }
);

// Edit Age Wizard
export const editAgeWizard = new Scenes.WizardScene(
    'EDIT_AGE_WIZARD',
    async (ctx) => {
        const { data: profile } = await supabase.from('profiles').select('language').eq('id', ctx.from?.id).single();
        const lang = profile?.language || 'en';
        (ctx.wizard.state as any).language = lang;

        const prompt = lang === 'am' ? "እድሜህ/ሽ ስንት ነው? 🎂" : "How old are you? 🎂";
        await ctx.reply(prompt);
        return ctx.wizard.next();
    },
    async (ctx) => {
        const ageMsg = (ctx.message as any).text;
        const age = parseInt(ageMsg);
        const lang = (ctx.wizard.state as any).language;

        if (isNaN(age) || age < 18 || age > 100) {
            const errorPrompt = lang === 'am'
                ? "እባክህ/ሽ ትክክለኛ ቁጥር አስገባ (ከ18 በላይ)። 🔞"
                : "Please enter a valid age (18+). 🔞";
            await ctx.reply(errorPrompt);
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ age })
            .eq('id', ctx.from?.id);

        if (error) {
            await ctx.reply(lang === 'am' ? "Aiyee! እድሜህን/ሽን መቀየር አልቻልኩም።" : "Aiyee! I couldn't update your age.");
        } else {
            await ctx.reply(lang === 'am' ? "እድሜህ/ሽ ተስተካክሏል! ✅" : "Age updated! ✅");
        }
        return ctx.scene.enter('PROFILE_SCENE');
    }
);

// Edit Language Wizard
export const editLanguageWizard = new Scenes.WizardScene(
    'EDIT_LANGUAGE_WIZARD',
    async (ctx) => {
        await ctx.reply("Select your language / ቋንቋ ይምረጡ:", Markup.keyboard([
            ['🇺🇸 English', '🇪🇹 አማርኛ']
        ]).resize());
        return ctx.wizard.next();
    },
    async (ctx) => {
        const text = (ctx.message as any).text;
        let lang = 'en';

        if (text === '🇪🇹 አማርኛ') lang = 'am';
        else if (text === '🇺🇸 English') lang = 'en';
        else {
            await ctx.reply("Please select from the buttons / እባክዎ ከምርጫዎቹ አንዱን ይምረጡ");
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ language: lang })
            .eq('id', ctx.from?.id);

        if (error) {
            await ctx.reply("Aiyee! Failed to update language. / ቋንቋ መቀየር አልተሳካም።");
        } else {
            const confirm = lang === 'am' ? "ቋንቋህ/ሽ ተቀይሯል! 🇪🇹" : "Language updated! 🇺🇸";
            await ctx.reply(confirm, Markup.removeKeyboard());
        }
        return ctx.scene.enter('PROFILE_SCENE');
    }
);
