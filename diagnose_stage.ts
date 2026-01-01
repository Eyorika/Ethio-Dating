import { Telegraf, Scenes, session, Markup } from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();

console.log("Starting stage diagnostic...");

async function run() {
    try {
        const { registrationWizard } = await import('./src/scenes/registration.js');
        const { discoveryScene } = await import('./src/scenes/discovery.js');
        const { profileScene } = await import('./src/scenes/profile.js');
        const { adminScene } = await import('./src/scenes/admin.js');
        const { editBioWizard, editPhotosWizard, editInterestWizard, editLocationWizard, editZodiacWizard, editNameWizard, editAgeWizard } = await import('./src/scenes/editProfile.js');
        const { likersScene } = await import('./src/scenes/likers.js');
        const { matchesScene } = await import('./src/scenes/matches.js');
        const { zodiacDiscoveryScene } = await import('./src/scenes/zodiacDiscovery.js');

        console.log("All scenes imported. initializing stage...");

        const stage = new Scenes.Stage<Scenes.SceneContext>([
            registrationWizard as any,
            discoveryScene as any,
            profileScene as any,
            adminScene as any,
            editBioWizard as any,
            editPhotosWizard as any,
            editInterestWizard as any,
            editLocationWizard as any,
            editZodiacWizard as any,
            editNameWizard as any,
            editAgeWizard as any,
            likersScene as any,
            matchesScene as any,
            zodiacDiscoveryScene as any
        ]);

        console.log("Stage created. Initializing bot...");
        const bot = new Telegraf<Scenes.SceneContext>(process.env.BOT_TOKEN || '123:abc');
        bot.use(session());
        bot.use(stage.middleware());

        console.log("Bot and middleware setup success!");
        process.exit(0);
    } catch (e: any) {
        console.error("STAGE DIAGNOSTIC FAILED!");
        console.error(e);
        process.exit(1);
    }
}

run();
