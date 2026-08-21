import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Recipe, UserData } from '../types'
import { generateShoppingList } from '../lib/calculations'

const defaultPreferences = { breakfast: true, lunch: true, dinner: true, snack: true }
const emptyData = (userId: string) => ({ user_id: userId, pantry: [], favorites: [], meal_plan: [], shopping_list: [], custom_lists: [], meal_preferences: defaultPreferences })
const normalizeUserData = (value: UserData): UserData => ({ ...value, pantry: (value.pantry || []).map((item) => ({ id: item.id, name: item.name, stock: item.stock || 'enough' })), custom_lists: value.custom_lists || [], meal_preferences: { ...defaultPreferences, ...(value.meal_preferences || {}) } })
export function useAppData(userId?: string) {
  const [recipes, setRecipes] = useState<Recipe[]>([]); const [data, setData] = useState<UserData | null>(null); const [loading, setLoading] = useState(Boolean(userId)); const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => { if (!userId) return; setLoading(true); setError(null)
    const [{ data: recipeRows, error: recipeError }, { data: userRow, error: userError }] = await Promise.all([supabase.from('recipes').select('*').order('name'), supabase.from('user_data').select('*').eq('user_id', userId).maybeSingle()])
    if (recipeError || userError) {
      const detail = recipeError?.message || userError?.message || 'Eroare necunoscută'
      setError(`Nu s-au putut încărca datele: ${detail}`)
      setLoading(false)
      return
    }
    setRecipes((recipeRows || []) as Recipe[])
    if (userRow) setData(normalizeUserData(userRow as UserData)); else { const base = emptyData(userId); const { data: created, error: createError } = await supabase.from('user_data').insert(base).select().single(); if (createError) setError(`Nu s-au putut crea datele utilizatorului: ${createError.message}`); else setData(normalizeUserData(created as UserData)) }
    setLoading(false)
  }, [userId])
  useEffect(() => { void load() }, [load])
  const save = async (patch: Partial<UserData>) => {
    if (!data) return false
    const shouldRegenerate = patch.pantry !== undefined || patch.meal_plan !== undefined
    const withShopping = shouldRegenerate ? { ...patch, shopping_list: generateShoppingList(patch.meal_plan ?? data.meal_plan, recipes, patch.pantry ?? data.pantry, data.shopping_list) } : patch
    const next = normalizeUserData({ ...data, ...withShopping })
    setData(next)
    const { error: saveError } = await supabase.from('user_data').update(withShopping).eq('user_id', data.user_id)
    if (saveError) { setError(`Nu s-au putut salva datele: ${saveError.message}`); return false }
    return true
  }
  return { recipes, data, loading, error, reload: load, save, clearError: () => setError(null) }
}
