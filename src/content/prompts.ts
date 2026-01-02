// ጠበሳ (Tebesa) Content & Personality

export const PROMPTS = {
    WELCOME: {
        en: `👋 Welcome to ** Tebesa ** !\n\nI'm here to help you find meaningful connections in Ethiopia. Let's create your profile together!\n\n📝 ** What I'll ask you:**\n• Your name\n• Age (18+)\n• Gender & who you want to meet\n• Location\n• Religion\n• Zodiac sign\n• Photos (1-3)\n• Bio (optional)\n\n⏱️ Takes about 2 minutes\n\n**Let's start! What's your first name?**`,
        am: `👋 ወደ **ጠበሳ** እንኳን በደህና መጡ!\n\nትርጉም ያለው ግንኙነት እንዲያገኙ ለመርዳት እዚህ ነኝ። የእርስዎን መገለጫ አንድ ላይ እንፍጠር!\n\n📝 **የምጠይቅዎት:**\n• ስምዎ\n• እድሜ (18+)\n• ጾታ እና ማንን ማግኘት እንደሚፈልጉ\n• አድራሻ\n• ሃይማኖት\n• የኮከብ ምልክት\n• ፎቶዎች (1-3)\n• ስለራስዎ (አማራጭ)\n\n⏱️ በግምት 2 ደቂቃ ይወስዳል\n\n**እንጀምር! የመጀመሪያ ስምዎ ምንድን ነው?**`
    },

    REGISTRATION: {
        LOCATION: {
            en: "Where’s your territory? 📍 Are you holding it down in **Addis** (which Kifle Ketema?), or are you repping **Adama, Hawassa,** or elsewhere?",
            am: "ግዛትህ/ሽ የት ነው? 📍 አዲስ አበባ (የትኛው ክፍለ ከተማ?) ወይስ አዳማ፣ ሀዋሳ...?"
        },
        RELIGION: {
            en: "Faith matters! ⛪️🕌 Who should I look for? (Orthodox, Muslim, Protestant, etc.) I want to make sure the connection is deep from the start.",
            am: "ሃይማኖት ወሳኝ ነው! ⛪️🕌 ማንን ልፈልግልህ/ሽ? (ኦርቶዶክስ፣ ሙስሊም፣ ፕሮቴስታንት...)"
        },
        LIFESTYLE: {
            en: "Pick your weekend vibe: 💃 **Club night in Bole**, ☕ **Chill cafe in Kazanchis**, or 🏠 **Netflix & Doro Wot** at home?",
            am: "የሳምንቱ መጨረሻ ምርጫህ/ሽ፦ 💃 **ቦሌ ክለብ**፣ ☕ **ካዛንቺስ ካፌ**፣ ወይስ 🏠 **ቤት ውስጥ ፊልም**?"
        },
        PHOTO_VERIFY: {
            en: "Hold up, Gorgeous/Sheba! ✋\n\nBefore I let you into the VIP section, I need to make sure you’re real. Snap a quick selfie holding up **two fingers (Peace sign)**. Only my eyes will see it, then you’re officially **Verified Arada**! ✅",
            am: "ቆይ ቆይ ቆንጆ! ✋\n\nወደ VIP ክፍሉ ከማስገባትህ/ሽ በፊት፤ ማንነትህን/ሽን ማረጋገጥ አለብኝ። **የሰላም ምልክት (ሁለት ጣት)** እያሳየህ/ሽ selfie ላክልኝ። እኔ አይቼው ወዲያውኑ **Verified Arada** ትሆናለህ/ሽ! ✅"
        }
    },

    MATCH: {
        CELEBRATION: {
            en: (name: string) => `አይበረኩም! 🎉 It’s a **Match!**\n\nYou and ${name} are a great match. Don't be a 'Fara'—send the first message! 😉`,
            am: (name: string) => `አይበረኩም! 🎉 **ተዛምደሃል/ሻል!**\n\nአንተ/ቺ እና ${name} ተገጣጥማችኋል። ፋራ አትሁን/ኚ፤ የመጀመሪያውን መልእክት ላክ/ኪ! 😉`
        },
        CELESTIAL: {
            en: (name: string) => `🎉 It's a **Celestial Match!**\n\nYou and ${name} are written in the stars. ✨`,
            am: (name: string) => `🎉 **የአምሳያ ኮከብ ተገኝቷል!**\n\nከ ${name} ጋር ከዋክብት ተገጣጥመዋል። ✨`
        }
    },

    SYSTEM: {
        NO_MORE_SWIPES: {
            en: "You’ve seen everyone for today! 🛑\n\nEven a wingman needs a coffee break. I’ll have a fresh batch of profiles waiting for you tomorrow morning. See you then! ☕✨",
            am: "ለዛሬ ሁሉንም አይተሃል/ሻል! 🛑\n\nጠበሳም የቡና እረፍት ያስፈልገዋል። እስከ ነገ ጠዋት ድረስ ሌሎች አዳዲስ ሰዎችን አዘጋጃለሁ። ቻው! ☕✨"
        }
    }
};

export const ICEBREAKERS = [
    {
        label: "Vibe Check (Match %)",
        amMale: "Selam! Tebesa እንዳለው ከሆነ 90% እንመጥናለን። ቀሪውን 10% በቡና ብናሟላው ይሻላል ወይስ በሻይ? ☕",
        amFemale: "Tebesa አገናኝቶናል... አሁን የቀረው ያንተ 'Rizz' (ብቃት) ነው! 😉",
        enMale: "Selam! Tebesa says we're a 90% match. Should we fill the other 10% with coffee or tea? ☕",
        enFemale: "Tebesa connected us... now the rest is up to your 'Rizz'! 😉"
    },
    {
        label: "Arada vs Fara",
        amMale: "ፎቶዎችህ 'Arada' እንደሆንክ ይመሰክራሉ፤ አመለካከትህስ? ✨",
        amFemale: "ፎቶዎችሽ 'Arada' እንደሆንሽ ይመሰክራሉ፤ አመለካከትሽስ? ✨",
        enMale: "Your photos say you're 'Arada'; what about your perspective? ✨",
        enFemale: "Your photos say you're 'Arada'; what about your perspective? ✨"
    },
    {
        label: "Addis Struggle",
        amMale: "ጥያቄ፦ ቦሌ ላይ ትራፊክ ውስጥ መቆም ወይስ ፒያሳ ላይ በእግር መጓዝ? የትኛውን ትመርጣለህ? 🏙️",
        amFemale: "ጥያቄ፦ ቦሌ ላይ ትራፊክ ውስጥ መቆም ወይስ ፒያሳ ላይ በእግር መጓዝ? የትኛውን ትመርጪያለሽ? 🏙️",
        enMale: "Question: Stuck in Bole traffic or walking in Piassa? Which do you prefer? 🏙️",
        enFemale: "Question: Stuck in Bole traffic or walking in Piassa? Which do you prefer? 🏙️"
    },
    {
        label: "The Date Invite",
        amMale: "በመጀመሪያ እንኳን ለዚህ ትውውቅ አበቃን! Tebesa ጥሩ ምርጫ ነው ያቀረበልኝ። 👋",
        amFemale: "የመጀመሪያውን 'Selam' እኔ ብልህ፣ ቡናውን ግን አንተ ትጋብዛለህ? ☕✨",
        enMale: "First, congrats to us for this match! Tebesa gave me a great choice. 👋",
        enFemale: "If I say the first 'Selam,' will you invite me for the coffee? ☕✨"
    },
    {
        label: "Bribe Tebesa (Flattery)",
        amMale: "(ጠበሳን ጉቦ ሰጥተኸው ነው?) ምክንያቱም በዚህ አፕ ላይ ካለው በጣም ቆንጆ ወንድ ጋር በአጋጣሚ ተገናኘሁ ብዬ ለማመን ይከብደኛል! 🔥",
        amFemale: "(ጠበሳን ጉቦ ሰጥተሽው ነው?) ምክንያቱም በዚህ አፕ ላይ ካለችው በጣም ቆንጆ ሴት ጋር በአጋጣሚ ተገናኘሁ ብዬ ለማመን ይከብደኛል! 🔥",
        enMale: "Did you bribe Tebesa? Because I find it hard to believe I just matched with the most handsome guy on this app by accident! 🔥",
        enFemale: "Did you bribe Tebesa? Because I find it hard to believe I just matched with the most beautiful girl on this app by accident! 🔥"
    }
];

export const KIFLE_KETEMAS = [
    "Addis Ketema", "Akaki Kality", "Arada", "Bole", "Gullele",
    "Kirkos", "Kolfe Keranio", "Lideta", "Nifas Silk-Lafto", "Yeka", "Lemi Kura"
];

export const RELIGIONS = [
    "Orthodox", "Protestant", "Muslim", "Catholic", "Other"
];
export const ZODIACS = [
    { name: 'Aries', am: 'ሐመል እሳት', icon: '♈' },
    { name: 'Taurus', am: 'ሰውር መሬት', icon: '♉' },
    { name: 'Gemini', am: 'ገውዝ ንፋስ', icon: '♊' },
    { name: 'Cancer', am: 'ሸርጣን ውሃ', icon: '♋' },
    { name: 'Leo', am: 'አሰድ እሳት', icon: '♌' },
    { name: 'Virgo', am: 'ሰንቡላ መሬት', icon: '♍' },
    { name: 'Libra', am: 'ሚዛን ንፋስ', icon: '♎' },
    { name: 'Scorpio', am: 'አቅራብ ውሃ', icon: '♏' },
    { name: 'Sagittarius', am: 'ቀውስ እሳት', icon: '♐' },
    { name: 'Capricorn', am: 'ጀዲ መሬት', icon: '♑' },
    { name: 'Aquarius', am: 'ደለው ንፋስ', icon: '♒' },
    { name: 'Pisces', am: 'ሁት ውሃ', icon: '♓' }
];

// Simple compatibility mapping
export const ZODIAC_COMPATIBILITY: { [key: string]: string[] } = {
    'Aries': ['Leo', 'Sagittarius', 'Gemini', 'Libra', 'Aquarius'],
    'Taurus': ['Virgo', 'Capricorn', 'Cancer', 'Scorpio', 'Pisces'],
    'Gemini': ['Libra', 'Aquarius', 'Aries', 'Leo', 'Sagittarius'],
    'Cancer': ['Scorpio', 'Pisces', 'Taurus', 'Virgo', 'Capricorn'],
    'Leo': ['Aries', 'Sagittarius', 'Gemini', 'Libra', 'Aquarius'],
    'Virgo': ['Taurus', 'Capricorn', 'Cancer', 'Scorpio', 'Pisces'],
    'Libra': ['Gemini', 'Aquarius', 'Aries', 'Leo', 'Sagittarius'],
    'Scorpio': ['Cancer', 'Pisces', 'Taurus', 'Virgo', 'Capricorn'],
    'Sagittarius': ['Aries', 'Leo', 'Gemini', 'Libra', 'Aquarius'],
    'Capricorn': ['Taurus', 'Virgo', 'Cancer', 'Scorpio', 'Pisces'],
    'Aquarius': ['Gemini', 'Libra', 'Aries', 'Leo', 'Sagittarius'],
    'Pisces': ['Cancer', 'Scorpio', 'Taurus', 'Virgo', 'Capricorn']
};

/**
 * Translation helper
 * @param lang 'en' or 'am'
 * @param path dot notation path (e.g. 'WELCOME' or 'REGISTRATION.LOCATION')
 * @param params optional parameters for functions
 */
export const t = (lang: 'en' | 'am' | string, path: string, ...params: any[]): string => {
    const keys = path.split('.');
    let current: any = PROMPTS;

    for (const key of keys) {
        if (current[key] === undefined) return path;
        current = current[key];
    }

    const val = current[lang] || current['en'];
    if (typeof val === 'function') {
        return val(...params);
    }
    return val || path;
};

