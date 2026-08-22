import { useState } from 'react'
import type {
  Day,
  MealPlanItem,
  Recipe,
  UserData,
} from '../types'
import { RecipePicker } from '../components/RecipePicker'
import { RecipeDetail } from '../components/RecipeDetail'
import { EmptyState } from '../components/States'

const days: { id: Day; name: string }[] = [
  { id: 'monday', name: 'Luni' },
  { id: 'tuesday', name: 'Marți' },
  { id: 'wednesday', name: 'Miercuri' },
  { id: 'thursday', name: 'Joi' },
  { id: 'friday', name: 'Vineri' },
  { id: 'saturday', name: 'Sâmbătă' },
  { id: 'sunday', name: 'Duminică' },
]

const meals: {
  id: MealPlanItem['mealType']
  name: string
}[] = [
  { id: 'breakfast', name: 'Mic dejun' },
  { id: 'lunch', name: 'Prânz' },
  { id: 'dinner', name: 'Cină' },
  { id: 'snack', name: 'Gustare' },
]

export function MealPlan({
  recipes,
  data,
  save,
}: {
  recipes: Recipe[]
  data: UserData
  save: (patch: Partial<UserData>) => Promise<boolean>
}) {
  const [slot, setSlot] = useState<{
    day: Day
    meal: MealPlanItem['mealType']
  } | null>(null)

  const [selectedRecipe, setSelectedRecipe] =
    useState<Recipe | null>(null)

  const add = async (recipe: Recipe) => {
    if (!slot) {
      return
    }

    const success = await save({
      meal_plan: [
        ...data.meal_plan,
        {
          id: crypto.randomUUID(),
          day: slot.day,
          mealType: slot.meal,
          recipeId: recipe.id,
          servings: recipe.servings,
        },
      ],
    })

    if (success) {
      setSlot(null)
    }
  }

  const modify = (
    item: MealPlanItem,
    servings: number
  ) => {
    void save({
      meal_plan: data.meal_plan.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              servings: Math.max(
                1,
                Number.isFinite(servings)
                  ? servings
                  : 1
              ),
            }
          : entry
      ),
    })
  }

  const toggleFavorite = async (
    recipe: Recipe
  ) => {
    const isFavorite =
      data.favorites.includes(recipe.id)

    const favorites = isFavorite
      ? data.favorites.filter(
          (id) => id !== recipe.id
        )
      : [...data.favorites, recipe.id]

    await save({ favorites })
  }

  return (
    <>
      <header>
        <span className="eyebrow">
          PLAN
        </span>

        <h1>
          Săptămâna ta, pe scurt
        </h1>
      </header>

      {data.meal_plan.length === 0 && (
        <EmptyState>
          Nu ai planificat încă mese.
        </EmptyState>
      )}

      <div className="plan">
        {days.map((day) => (
          <section
            className="card"
            key={day.id}
          >
            <h2>{day.name}</h2>

            {meals
              .filter(
                (meal) =>
                  data.meal_preferences[
                    meal.id
                  ]
              )
              .map((meal) => {
                const items =
                  data.meal_plan.filter(
                    (entry) =>
                      entry.day === day.id &&
                      entry.mealType === meal.id
                  )

                return (
                  <div
                    className="meal"
                    key={meal.id}
                  >
                    <small>
                      {meal.name}
                    </small>

                    {items.map((item) => {
                      const recipe =
                        recipes.find(
                          (entry) =>
                            entry.id ===
                            item.recipeId
                        )

                      if (!recipe) {
                        return null
                      }

                      return (
                        <div
                          className="planned-dish"
                          key={item.id}
                        >
                          <button
                            type="button"
                            className="planned-dish-content"
                            onClick={() =>
                              setSelectedRecipe(
                                recipe
                              )
                            }
                          >
                            {recipe.image_url ? (
                              <img
                                src={
                                  recipe.image_url
                                }
                                alt={recipe.name}
                              />
                            ) : (
                              <div className="planned-dish-placeholder">
                                🍽️
                              </div>
                            )}

                            <span className="planned-dish-info">
                              <strong>
                                {recipe.name}
                              </strong>

                              <small>
                                {recipe.category}
                              </small>
                            </span>
                          </button>

                          <label>
                            Porții
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.servings}
                              onChange={(event) =>
                                modify(
                                  item,
                                  Number(
                                    event.target.value
                                  )
                                )
                              }
                            />
                          </label>

                          <button
                            type="button"
                            className="text-button"
                            onClick={() =>
                              void save({
                                meal_plan:
                                  data.meal_plan.filter(
                                    (entry) =>
                                      entry.id !==
                                      item.id
                                  ),
                              })
                            }
                          >
                            Elimină
                          </button>
                        </div>
                      )
                    })}

                    <button
                      type="button"
                      className="add-slot"
                      onClick={() =>
                        setSlot({
                          day: day.id,
                          meal: meal.id,
                        })
                      }
                    >
                      + Adaugă fel de mâncare
                    </button>
                  </div>
                )
              })}
          </section>
        ))}
      </div>

      {slot && (
        <RecipePicker
          recipes={recipes}
          onPick={add}
          onClose={() => setSlot(null)}
        />
      )}

      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          favorite={data.favorites.includes(
            selectedRecipe.id
          )}
          onFavorite={() =>
            void toggleFavorite(selectedRecipe)
          }
          onClose={() =>
            setSelectedRecipe(null)
          }
        />
      )}
    </>
  )
}