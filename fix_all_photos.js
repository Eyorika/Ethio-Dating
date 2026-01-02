
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

async function fixAllPhotos() {
    // Using a reliable public image URL
    const validPhotoUrl = 'https://picsum.photos/400/600';

    console.log('Updating ALL profiles to use valid placeholder photo...');

    const { data, error } = await supabase
        .from('profiles')
        .update({ photo_urls: [validPhotoUrl] })
        .neq('first_name', 'System'); // Update basically everyone

    if (error) {
        console.error('Bulk update failed:', error);
    } else {
        console.log('Success! Updated all profiles to valid URL.');
    }
}

fixAllPhotos();
