
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAbaPhoto() {
    // Using a reliable public image URL
    const validPhotoUrl = 'https://picsum.photos/400/600';

    const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('first_name', '%Aba%');

    if (fetchError || !profiles || profiles.length === 0) {
        console.error('Could not find Aba:', fetchError);
        return;
    }

    const abaId = profiles[0].id;
    console.log(`Updating photo for Aba (${abaId})...`);

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_urls: [validPhotoUrl] })
        .eq('id', abaId);

    if (updateError) {
        console.error('Update failed:', updateError);
    } else {
        console.log('Success! Updated Aba\'s photo to a valid URL.');
    }
}

fixAbaPhoto();
