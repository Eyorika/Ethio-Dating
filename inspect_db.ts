import { supabase } from './src/services/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkProfiles() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    const { data: swipes } = await supabase.from('swipes').select('*');

    console.log("--- TEBESA DATABASE INSPECTION ---");
    console.log(`Total Profiles Found: ${profiles?.length || 0}`);
    console.log(`Total Swipes Found: ${swipes?.length || 0}`);

    if (profiles && profiles.length > 0) {
        console.log("\nRAW COLUMNS IN 'profiles' TABLE (from first record):");
        console.log(Object.keys(profiles[0]));
    }

    profiles?.forEach(p => {
        const userSwipes = swipes?.filter(s => s.swiper_id === p.id).map(s => s.swiped_id);
        console.log(`\nPROFILE: ${p.first_name} (${p.id})`);
        console.log(`- Gender: "${p.gender}"`);
        console.log(`- Interest: "${p.interested_in}"`);
        console.log(`- Verified: ${p.is_verified} | Active: ${p.is_active} | Banned: ${p.is_banned}`);
        console.log(`- Swipes Sent to IDs: [${userSwipes?.join(', ')}]`);
    });

    if (swipes && swipes.length > 0) {
        console.log("\n--- ALL SWIPES ---");
        swipes.forEach(s => console.log(`${s.swiper_id} --(${s.type})--> ${s.swiped_id}`));
    }
    console.log("\n----------------------------------");
}

checkProfiles();
