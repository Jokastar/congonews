import { config } from 'dotenv'
config()

import { supabase } from '../lib/supabase.js'

const validThemes = ['politique', 'economie', 'art', 'fait_divers']

const { data } = await supabase.from('theme_centroids').select('theme_name')
console.log('All centroids in DB:', data?.map(r => r.theme_name))

const toDelete = data?.filter(r => !validThemes.includes(r.theme_name)).map(r => r.theme_name) ?? []
console.log('Stale centroids to delete:', toDelete)

if (toDelete.length) {
  const { error } = await supabase.from('theme_centroids').delete().in('theme_name', toDelete)
  console.log('Delete:', error?.message ?? 'OK')
} else {
  console.log('Nothing to delete.')
}
