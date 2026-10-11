import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qskilkgrignvkqvspyia.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFza2lsa2dyaWdudmtxdnNweWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NDQ4OTAsImV4cCI6MjEwMjAyMDg5MH0.MkOGithUzWhW5nNfr9TEqDv-2UpD5YH4J85AYD4v5t0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
