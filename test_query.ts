import { supabase } from './src/services/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

async function testQuery() {
    const userId = 5580364937; // Eyuel's ID

    const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    console.log("Current User:", userProfile?.first_name, "Gender:", userProfile?.gender, "Interest:", userProfile?.interested_in);

    const { data: swipedIds } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', userId);

    const swipedList = swipedIds?.map(s => s.swiped_id) || [];
    swipedList.push(userId as any);

    console.log("Excluded IDs (swiped + self):", swipedList);

    let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', userId)
        .filter('id', 'not.in', `(${swipedList.join(',')})`)
        .eq('is_active', true);

    if (userProfile?.interested_in !== 'both') {
        query = query.eq('gender', userProfile?.interested_in);
    }

    console.log("Executing discovery query...");
    const { data: profiles, error } = await query.limit(1);
    console.log("Query completed.");

    if (error) {
        console.error("Supabase Error:", JSON.stringify(error, null, 2));
    } else {
        console.log("Matches found:", profiles?.length || 0);
        if (profiles && profiles.length > 0) {
            console.log("First Match:", profiles[0].first_name, "Gender:", profiles[0].gender);
        } else {
            console.log("No profiles matched the criteria.");
        }
    }
    process.exit(0);
}

testQuery();
