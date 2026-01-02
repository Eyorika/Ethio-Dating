
import { supabase } from './src/services/supabase.js';
import dotenv from 'dotenv';
dotenv.config();

async function inspectProfile() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('first_name', '%Aba%');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log('Found profiles:', JSON.stringify(profiles, null, 2));
}

inspectProfile();
