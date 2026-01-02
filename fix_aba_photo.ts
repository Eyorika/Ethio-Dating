
import { supabase } from './src/services/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

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

    const abaId = profiles?.[0]?.id;
    if (!abaId) {
        console.error('Profile found but has no ID?');
        return;
    }
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
