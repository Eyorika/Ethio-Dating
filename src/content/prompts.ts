// ጠበሳ (Tebesa) Content & Personality

export const PROMPTS = {
    WELCOME: `Selam Arada! 👋 I’m **Tebesa**, your digital wingman. I’m not here to just show you photos; I’m here to find your *vibe-mate*.\n\nWhether you’re a **Bole** 'Burger' lover or a **Piassa** 'Macchiato' enthusiast, I’ve got someone for you. ዝግጁ ነህ/ነሽ? (Are you ready?) Let’s get you set up!`,

    REGISTRATION: {
        LOCATION: "Where’s your territory? 📍 Are you holding it down in **Addis** (which Kifle Ketema?), or are you repping **Adama, Hawassa,** or elsewhere?",
        RELIGION: "Faith matters! ⛪️🕌 Who should I look for? (Orthodox, Muslim, Protestant, etc.) I want to make sure the connection is deep from the start.",
        LIFESTYLE: "Pick your weekend vibe: 💃 **Club night in Bole**, ☕ **Chill cafe in Kazanchis**, or 🏠 **Netflix & Doro Wot** at home?",
        PHOTO_VERIFY: "Hold up, Gorgeous/Sheba! ✋\n\nBefore I let you into the VIP section, I need to make sure you’re real. Nobody likes a 'Catfish.' 🐟\n\nSnap a quick selfie holding up **two fingers (Peace sign)**. Only my eyes will see it, then you’re officially **Verified Arada**! ✅"
    },

    MATCH: {
        CELEBRATION: (name: string, city: string) => `አይበረኩም! (Incredible!) 🎉 It’s a **Match!**\n\nYou and ${name} both think **${city}** is the most romantic city. The ball is in your court now. Don't be a 'Fara'—send the first message!\n\n**Pro-tip:** Ask about their favorite spot for Kitfo. Works every time. 😉`,
        NUDGE: (name: string) => `Wait... you guys are still quiet? 🤐\n\n${name} is waiting for a 'Selam'! Don't let this vibe go to waste. Use my **'Magic Icebreaker'** button if you’re feeling shy, and I’ll send a funny opener for you!`
    },

    SYSTEM: {
        NO_MORE_SWIPES: "You’ve seen everyone for today! 🛑\n\nEven a wingman needs a coffee break. Go out, live your life, and I’ll have a fresh batch of profiles waiting for you tomorrow morning. See you then! ☕✨"
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
