import { useState } from 'react'
import type { Day, MealPlanItem, Recipe, UserData } from '../types'
import { RecipePicker } from '../components/RecipePicker'
import { EmptyState } from '../components/States'

const days: { id: Day; name: string }[] = [{id:'monday',name:'Luni'},{id:'tuesday',name:'Marți'},{id:'wednesday',name:'Miercuri'},{id:'thursday',name:'Joi'},{id:'friday',name:'Vineri'},{id:'saturday',name:'Sâmbătă'},{id:'sunday',name:'Duminică'}]
const meals: { id: MealPlanItem['mealType']; name: string }[] = [{id:'breakfast',name:'Mic dejun'},{id:'lunch',name:'Prânz'},{id:'dinner',name:'Cină'},{id:'snack',name:'Gustare'}]

export function MealPlan({ recipes, data, save }: { recipes: Recipe[]; data: UserData; save: (patch: Partial<UserData>) => Promise<boolean> }) {
  const [slot, setSlot] = useState<{ day: Day; meal: MealPlanItem['mealType'] } | null>(null)
  const add = async (recipe: Recipe) => { if (slot) { await save({ meal_plan: [...data.meal_plan, { id: crypto.randomUUID(), day: slot.day, mealType: slot.meal, recipeId: recipe.id, servings: recipe.servings }] }); setSlot(null) } }
  const modify = (item: MealPlanItem, servings: number) => void save({ meal_plan: data.meal_plan.map((entry) => entry.id === item.id ? { ...entry, servings: Math.max(1, servings) } : entry) })
  return <><header><span className="eyebrow">PLAN</span><h1>Săptămâna ta, pe scurt</h1></header>{data.meal_plan.length === 0 && <EmptyState>Nu ai planificat încă mese.</EmptyState>}<div className="plan">{days.map((day) => <section className="card" key={day.id}><h2>{day.name}</h2>{meals.filter((meal) => data.meal_preferences[meal.id]).map((meal) => { const items = data.meal_plan.filter((entry) => entry.day === day.id && entry.mealType === meal.id); return <div className="meal" key={meal.id}><small>{meal.name}</small>{items.map((item) => { const recipe = recipes.find((entry) => entry.id === item.recipeId); return recipe ? <div className="planned-dish" key={item.id}><strong>{recipe.name}</strong><label>Porții <input type="number" min="1" value={item.servings} onChange={(event) => modify(item, Number(event.target.value))}/></label><button className="text-button" onClick={() => void save({ meal_plan: data.meal_plan.filter((entry) => entry.id !== item.id) })}>Elimină</button></div> : null })}<button className="add-slot" onClick={() => setSlot({ day: day.id, meal: meal.id })}>+ Adaugă fel de mâncare</button></div> })}</section>)}</div>{slot && <RecipePicker recipes={recipes} onPick={add} onClose={() => setSlot(null)}/>}</>
}
