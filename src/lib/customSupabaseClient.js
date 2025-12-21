import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://szsxsovratkrxabgrjti.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6c3hzb3ZyYXRrcnhhYmdyanRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMTIzNDUsImV4cCI6MjA2NTc4ODM0NX0.GwMDsjjF1n_plUA6UFdz7DZAhLdkvyvd7-ViH8Hn9O0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);