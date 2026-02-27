import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fzzetvwnkkpvlsuczgde.supabase.co';
const supabaseKey = 'sb_publishable_LoUrN-oEDeh0bfg2Gj98fA_Oiej4pLT';

export const supabase = createClient(supabaseUrl, supabaseKey);