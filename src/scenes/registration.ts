import { Scenes, Markup } from 'telegraf';
import { PROMPTS, KIFLE_KETEMAS, RELIGIONS, ZODIACS } from '../content/prompts.js';
import { supabase } from '../services/supabase.js';

export const registrationWizard = new Scenes.WizardScene(
    'REGISTRATION_SCENE',
    // Step 0: Language Selection
    async (ctx) => {
        await ctx.reply("Select your preferred language / ቋንቋ ይምረጡ:", {
            reply_markup: {
                keyboard: [
                    [{ text: 'English 🇺🇸' }, { text: 'አማርኛ 🇪🇹' }]
                ],
                one_time_keyboard: true,
                resize_keyboard: true
            }
        });
        return ctx.wizard.next();
    },
    // Step 1: Ask for Name
    async (ctx) => {
        const lang = (ctx.message as any).text;
        (ctx.wizard.state as any).language = lang === 'አማርኛ 🇪🇹' ? 'am' : 'en';

        const prompt = (ctx.wizard.state as any).language === 'am'
            ? "በመጀመሪያ ምን ብዬ ልጥራህ/ሽ? (ስም)"
            : "First things first, what should I call you? (Name)";

        await ctx.reply(prompt);
        return ctx.wizard.next();
    },
    // Step 2: Ask for Age
    async (ctx) => {
        const name = (ctx.message as any).text;
        (ctx.wizard.state as any).name = name;

        const prompt = (ctx.wizard.state as any).language === 'am'
            ? `ተረድቻለሁ ${name}! እድሜህ/ሽ ስንት ነው?`
            : `Got it, ${name}! How old are you?`;

        await ctx.reply(prompt);
        return ctx.wizard.next();
    },
    // Step 3: Gender
    async (ctx) => {
        const age = parseInt((ctx.message as any).text);
        if (isNaN(age)) {
            const prompt = (ctx.wizard.state as any).language === 'am' ? "እባክህ/ሽ ትክክለኛ የቁጥር አመልካች ተጠቀም።" : "Oops! Please enter a valid number for age.";
            await ctx.reply(prompt);
            return;
        }
        (ctx.wizard.state as any).age = age;

        const genderPrompt = (ctx.wizard.state as any).language === 'am' ? "ጾታህ/ሽ? (ወንድ/ሴት)" : "And your gender? (male/female)";
        await ctx.reply(genderPrompt, {
            reply_markup: {
                keyboard: (ctx.wizard.state as any).language === 'am'
                    ? [[{ text: 'ወንድ' }, { text: 'ሴት' }]]
                    : [[{ text: 'male' }, { text: 'female' }]],
                one_time_keyboard: true,
                resize_keyboard: true
            }
        });
        return ctx.wizard.next();
    },
    // Step 4: Interested In
    async (ctx) => {
        const genderText = (ctx.message as any).text;
        (ctx.wizard.state as any).gender = (genderText === 'ወንድ' || genderText === 'male') ? 'male' : 'female';

        const interestPrompt = (ctx.wizard.state as any).language === 'am' ? "ማንን ማግኘት ትፈልጋለህ/ሽ? (ወንዶች/ሴቶች/ሁለቱንም)" : "Who are you interested in meeting? (male/female/both)";
        await ctx.reply(interestPrompt, {
            reply_markup: {
                keyboard: (ctx.wizard.state as any).language === 'am'
                    ? [[{ text: 'ወንዶች' }, { text: 'ሴቶች' }], [{ text: 'ሁለቱንም' }]]
                    : [[{ text: 'male' }, { text: 'female' }], [{ text: 'both' }]],
                one_time_keyboard: true,
                resize_keyboard: true
            }
        });
        return ctx.wizard.next();
    },
    // Step 5: Territory (Location)
    async (ctx) => {
        const interestText = (ctx.message as any).text;
        let interest = 'both';
        if (interestText === 'ወንዶች' || interestText === 'male') interest = 'male';
        if (interestText === 'ሴቶች' || interestText === 'female') interest = 'female';
        (ctx.wizard.state as any).interested_in = interest;

        const locPrompt = (ctx.wizard.state as any).language === 'am'
            ? "ግዛትህ የት ነው? 📍 አዲስ አበባ ወይስ ከዛ ውጭ?"
            : PROMPTS.REGISTRATION.LOCATION;

        await ctx.reply(locPrompt, {
            reply_markup: {
                keyboard: (ctx.wizard.state as any).language === 'am'
                    ? [[{ text: 'አዲስ አበባ' }], [{ text: 'ከአዲስ አበባ ውጭ' }]]
                    : [[{ text: 'Addis Ababa' }], [{ text: 'Outside Addis' }]],
                one_time_keyboard: true,
                resize_keyboard: true
            }
        });
        return ctx.wizard.next();
    },
    // Step 5: Sub-city or City
    async (ctx) => {
        const loc = (ctx.message as any).text;
        const lang = (ctx.wizard.state as any).language;
        const isAddis = loc === 'Addis Ababa' || loc === 'አዲስ አበባ';
        (ctx.wizard.state as any).location_type = isAddis ? 'addis' : 'regional';

        if (isAddis) {
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
    // Step 6: Religion
    async (ctx) => {
        const msg = (ctx.message as any).text;
        if ((ctx.wizard.state as any).location_type === 'addis') {
            (ctx.wizard.state as any).sub_city = msg;
        } else {
            (ctx.wizard.state as any).city = msg;
        }

        await ctx.replyWithMarkdown(PROMPTS.REGISTRATION.RELIGION, {
            reply_markup: {
                keyboard: RELIGIONS.map(r => [{ text: r }]),
                one_time_keyboard: true,
                resize_keyboard: true
            }
        });
        return ctx.wizard.next();
    },
    // Step 8: Zodiac
    async (ctx) => {
        (ctx.wizard.state as any).religion = (ctx.message as any).text;
        const lang = (ctx.wizard.state as any).language;
        const prompt = lang === 'am' ? "የኮከብ ምልክትህ/ሽ የትኛው ነው? ⭐" : "What's your zodiac sign? ⭐";

        await ctx.reply(prompt, Markup.keyboard(
            ZODIACS.map(z => [{ text: `${z.icon} ${lang === 'am' ? z.am : z.name}` }])
        ).resize());

        return ctx.wizard.next();
    },
    // Step 9: Photos
    async (ctx) => {
        const zodiacText = (ctx.message as any).text;
        const foundZodiac = ZODIACS.find(z => zodiacText.includes(z.name) || zodiacText.includes(z.am));
        (ctx.wizard.state as any).zodiac = foundZodiac?.name || 'Aries';

        const lang = (ctx.wizard.state as any).language;
        const prompt = lang === 'am'
            ? "አሁን የአራዳ ስታይልህን/ሽን አሳየን! 😎 እስከ 3 ፎቶዎችን (አንድ በአንድ) ላክልኝ። \n\nጨርሰህ/ሽ ከሆነ '✅ ጨርሻለሁ' የሚለውን ንካ።"
            : "Now, show off your Arada style! 😎 Send me up to 3 photos (one by one). \n\nClick '✅ Done' when you're finished.";

        await ctx.reply(prompt, Markup.keyboard([
            [lang === 'am' ? '✅ ጨርሻለሁ' : '✅ Done']
        ]).resize());

        return ctx.wizard.next();
    },
    // Step 10: Photo Collector
    async (ctx) => {
        const state = ctx.wizard.state as any;
        const lang = state.language;
        if (!state.photos) state.photos = [];

        if ((ctx.message as any).photo) {
            const photo = (ctx.message as any).photo.pop();
            state.photos.push(photo.file_id);
            const prompt = lang === 'am' ? `ፎቶ ${state.photos.length} ተጨምሯል! ሌላ ላክ ወይስ '✅ ጨርሻለሁ' የሚለውን ንካ።` : `Photo ${state.photos.length} added! Send another or click '✅ Done'.`;
            await ctx.reply(prompt);
        } else if ((ctx.message as any).text === '✅ Done' || (ctx.message as any).text === '✅ ጨርሻለሁ') {
            if (state.photos.length === 0) {
                await ctx.reply(lang === 'am' ? "ቆይ! ቢያንስ አንድ ፎቶ መላክ አለብህ/ሽ።" : "Wait! You need to send at least one photo.");
                return;
            }
            const voicePrompt = lang === 'am'
                ? "ጥቂት ቀረን! 🎤 ድምጽህን/ሽን መቅዳት ትችላለህ/ሽ (Voice Message)። ካልፈለግህ/ሽ '⏭️ እለፈው' የሚለውን ንካ።"
                : "Almost there! 🎤 Record a short 'Tebesa Intro' (Voice Message) so people can hear your vibe. Or click '⏭️ Skip' if you're shy.";

            await ctx.reply(voicePrompt, Markup.keyboard([
                [lang === 'am' ? '⏭️ እለፈው' : '⏭️ Skip']
            ]).resize());
            return ctx.wizard.next();
        }
    },
    // Step 9: Voice Intro
    async (ctx) => {
        const lang = (ctx.wizard.state as any).language;
        if ((ctx.message as any).voice) {
            (ctx.wizard.state as any).voice_intro_url = (ctx.message as any).voice.file_id;
            const prompt = lang === 'am' ? "ድምጽህን/ሽን ወድጄዋለሁ! አሁን የመጨረሻው ደረጃ... 🔒" : "Love the voice! Now for the final step... 🔒";
            await ctx.reply(prompt, Markup.removeKeyboard());
        } else if ((ctx.message as any).text === '⏭️ Skip' || (ctx.message as any).text === '⏭️ እለፈው') {
            await ctx.reply(lang === 'am' ? "ችግር የለም! የመጨረሻው ደረጃ... 🔒" : "No problem! Final step... 🔒", Markup.removeKeyboard());
        }
        await ctx.replyWithMarkdown(PROMPTS.REGISTRATION.PHOTO_VERIFY);
        return ctx.wizard.next();
    },
    // Step 10: Verification (Peace Sign)
    async (ctx) => {
        if ((ctx.message as any).photo) {
            const photo = (ctx.message as any).photo.pop();
            (ctx.wizard.state as any).verification_photo = photo.file_id;

            await ctx.reply("Perfect! Your profile is being finalized... ⏳");

            // Save to DB
            const data = ctx.wizard.state as any;
            const { error } = await supabase.from('profiles').upsert({
                id: ctx.from?.id,
                username: ctx.from?.username,
                first_name: data.name,
                age: data.age,
                gender: data.gender,
                interested_in: data.interested_in,
                location_type: data.location_type,
                sub_city: data.sub_city,
                city: data.city,
                religion: data.religion,
                zodiac: data.zodiac,
                photo_urls: data.photos,
                voice_intro_url: data.voice_intro_url,
                verification_photo_url: data.verification_photo,
                language: data.language,
                is_verified: false
            });

            if (error) {
                console.error('Supabase Upsert Error:', error);
                await ctx.reply(`Aiyee! Something went wrong saving your profile. Error: ${error.message}. Try /register again.`, Markup.removeKeyboard());
            } else {
                await ctx.reply("Done! You are officially an Arada Member. ✅ \n\nI'll let you know once an admin verifies your photo. In the meantime, type /discovery to see who's out there!", Markup.removeKeyboard());
            }
            return ctx.scene.leave();
        } else {
            await ctx.reply("Please send a selfie with two fingers (Peace sign) to verify!");
        }
    }
);
