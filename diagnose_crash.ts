import dotenv from 'dotenv';
dotenv.config();

console.log("Starting diagnostic...");

async function run() {
    try {
        console.log("Importing supabase service...");
        const { supabase } = await import('./src/services/supabase.js');
        console.log("Success.");

        console.log("Importing prompts...");
        const { PROMPTS, ICEBREAKERS } = await import('./src/content/prompts.js');
        console.log("Success.");

        console.log("Importing registration scene...");
        await import('./src/scenes/registration.js');
        console.log("Success.");

        console.log("Importing discovery scene...");
        await import('./src/scenes/discovery.js');
        console.log("Success.");

        console.log("Importing zodiac discovery scene...");
        await import('./src/scenes/zodiacDiscovery.js');
        console.log("Success.");

        console.log("Importing matches scene...");
        await import('./src/scenes/matches.js');
        console.log("Success.");

        console.log("Importing profile scene...");
        await import('./src/scenes/profile.js');
        console.log("Success.");

        console.log("Importing admin scene...");
        await import('./src/scenes/admin.js');
        console.log("Success.");

        console.log("Importing editProfile scenes...");
        await import('./src/scenes/editProfile.js');
        console.log("Success.");

        console.log("Importing likers scene...");
        await import('./src/scenes/likers.js');
        console.log("Success.");

        console.log("Diagnostic complete. All modules loaded.");
    } catch (e: any) {
        console.error("DIAGNOSTIC FAILED!");
        console.error(e);
        if (e.stack) console.error(e.stack);
        process.exit(1);
    }
}

run();
