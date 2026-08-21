import type { Ingredient, PantryItem, Recipe, ShoppingItem, MealPlanItem } from '../types'

const normalizedUnit = (unit: string) => unit.trim().toLocaleLowerCase('ro')
// Treat "ouă", "oua" and "OUĂ" as the same ingredient. This keeps pantry
// subtraction useful even when users enter names without Romanian diacritics.
const normalizedName = (name: string) => name.trim().toLocaleLowerCase('ro').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ')
const keyFor = (item: Ingredient) => `${normalizedName(item.name)}:${normalizedUnit(item.unit)}`
const compatible = (unit: string) => normalizedUnit(unit) === 'kg' ? { unit: 'g', factor: 1000 } : normalizedUnit(unit) === 'l' ? { unit: 'ml', factor: 1000 } : { unit: normalizedUnit(unit), factor: 1 }

export function recipeScore(recipe: Recipe, pantry: PantryItem[]) {
  const names = new Set(pantry.filter((item) => item.stock === 'enough').map((item) => normalizedName(item.name)))
  return recipe.ingredients.filter((ingredient) => names.has(normalizedName(ingredient.name))).length
}

export function generateShoppingList(plan: MealPlanItem[], recipes: Recipe[], pantry: PantryItem[], existing: ShoppingItem[]): ShoppingItem[] {
  const totals = new Map<string, Ingredient>()
  plan.forEach((entry) => {
    const recipe = recipes.find((item) => item.id === entry.recipeId)
    if (!recipe) return
    recipe.ingredients.forEach((ingredient) => {
      const converted = compatible(ingredient.unit)
      const value: Ingredient = { name: ingredient.name.trim(), quantity: ingredient.quantity * entry.servings / recipe.servings * converted.factor, unit: converted.unit }
      const key = keyFor(value); const previous = totals.get(key)
      totals.set(key, previous ? { ...value, quantity: previous.quantity + value.quantity } : value)
    })
  })
  const enoughNames = new Set(pantry.filter((item) => item.stock === 'enough').map((item) => normalizedName(item.name)))
  for (const [key, item] of totals) if (enoughNames.has(normalizedName(item.name))) totals.delete(key)
  const prior = new Map(existing.filter((item) => !item.manual).map((item) => [keyFor(item), item]))
  const generated = [...totals.values()].filter((item) => item.quantity > 0).map((item) => ({ ...item, quantity: Number(item.quantity.toFixed(2)), id: prior.get(keyFor(item))?.id || crypto.randomUUID(), checked: prior.get(keyFor(item))?.checked || false, manual: false }))
  return [...generated, ...existing.filter((item) => item.manual)]
}
