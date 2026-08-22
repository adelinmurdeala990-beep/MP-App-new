import { useMemo, useState } from 'react'
import type {
  Day,
  Recipe,
  UserData,
} from '../types'
import { recipeScore } from '../lib/calculations'
import { EmptyState } from '../components/States'
import { RecipeDetail } from '../components/RecipeDetail'

const labels: Record<string, string> = {
  breakfast: 'Mic dejun',
  lunch: 'Prânz',
  dinner: 'Cină',
  snack: 'Gustare',
}

const days: Day[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export function Dashboard({
  recipes,
  data,
}: {
  recipes: Recipe[]
  data: UserData
}) {
  const [recommendedCount, setRecommendedCount] = useState(4)

  const [suggestedRecipe, setSuggestedRecipe] =
    useState<Recipe | null>(null)

  const [selectedRecipe, setSelectedRecipe] =
    useState<Recipe | null>(null)

  const current =
    days[(new Date().getDay() + 6) % 7]

  const today = data.meal_plan.filter(
    (entry) => entry.day === current
  )

  const shopping = data.shopping_list

  const done = shopping.filter(
    (item) => item.checked
  ).length

  /*
   * Grupăm mesele după tip:
   *
   * Prânz
   *   - rețeta 1
   *   - rețeta 2
   *
   * Cină
   *   - rețeta 1
   *
   * Astfel nu mai repetăm "Prânz" pentru fiecare rețetă.
   */
  const groupedMeals = useMemo(() => {
    const order = [
      'breakfast',
      'lunch',
      'dinner',
      'snack',
    ]

    const groups: Record<
      string,
      typeof today
    > = {}

    for (const entry of today) {
      if (!groups[entry.mealType]) {
        groups[entry.mealType] = []
      }

      groups[entry.mealType].push(entry)
    }

    return order
      .filter(
        (mealType) =>
          groups[mealType]?.length
      )
      .map((mealType) => ({
        mealType,
        entries: groups[mealType],
      }))
  }, [today])

  const recommended = useMemo(() => {
    return [...recipes]
      .sort(
        (a, b) =>
          recipeScore(b, data.pantry) -
          recipeScore(a, data.pantry)
      )
      .slice(0, recommendedCount)
  }, [
    recipes,
    data.pantry,
    recommendedCount,
  ])

  const suggestRecipe = () => {
    if (!recipes.length) {
      setSuggestedRecipe(null)
      return
    }

    const candidates =
      recipes.length > 1 && suggestedRecipe
        ? recipes.filter(
            (recipe) =>
              recipe.id !==
              suggestedRecipe.id
          )
        : recipes

    const randomIndex = Math.floor(
      Math.random() * candidates.length
    )

    setSuggestedRecipe(
      candidates[randomIndex] ?? null
    )
  }

  /*
   * Statistici cămară pentru cardul Cumpărături.
   *
   * PantryItem folosește proprietatea "stock":
   * low | medium | enough
   */
  const pantryItems = data.pantry ?? []

  const pantryTotal = pantryItems.length

  const pantryLow = pantryItems.filter(
    (item) => item.stock === 'low'
  ).length

  const pantryMedium = pantryItems.filter(
    (item) => item.stock === 'medium'
  ).length

  const pantryFull = pantryItems.filter(
    (item) => item.stock === 'enough'
  ).length

  const remaining = Math.max(
    shopping.length - done,
    0
  )

  const shoppingPercent = shopping.length
    ? Math.round(
        (done / shopping.length) * 100
      )
    : 0

  return (
    <>
      <header>
        <span className="eyebrow">
          ACASĂ
        </span>

        <h1>
          Bună! Ce gătim azi?
        </h1>
      </header>

      <section className="dashboard-grid">
        {/* =========================
            MESELE DE AZI
           ========================= */}
        <div className="card">
          <h2>Mesele de azi</h2>

          {groupedMeals.length ? (
            groupedMeals.map((group) => (
              <div
                key={group.mealType}
                className="dashboard-meal-group"
              >
                <strong className="dashboard-meal-type">
                  {labels[group.mealType] ??
                    group.mealType}
                </strong>

                <div className="dashboard-meals">
                  {group.entries.map((entry) => {
                    const recipe =
                      recipes.find(
                        (recipe) =>
                          recipe.id ===
                          entry.recipeId
                      )

                    return (
                      <div
                        key={entry.id}
                        className="dashboard-meal"
                      >
                        {recipe?.image_url ? (
                          <img
                            src={
                              recipe.image_url
                            }
                            alt={recipe.name}
                          />
                        ) : (
                          <div className="dashboard-meal-placeholder">
                            🍽️
                          </div>
                        )}

                        <div>
                          {recipe ? (
                            <button
                              type="button"
                              className="dashboard-meal-link"
                              onClick={() =>
                                setSelectedRecipe(
                                  recipe
                                )
                              }
                            >
                              <strong>
                                {recipe.name}
                              </strong>
                            </button>
                          ) : (
                            <strong>
                              Rețetă indisponibilă
                            </strong>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            <EmptyState>
              Nu ai planificat încă nicio masă.
            </EmptyState>
          )}
        </div>

        {/* =========================
            CUMPĂRĂTURI
           ========================= */}
        <div className="card highlight">
          <h2>Cumpărături</h2>

          <strong>
            {done} din {shopping.length}
          </strong>

          <p>
            produse cumpărate
          </p>

          <div className="progress">
            <i
              style={{
                width: `${shoppingPercent}%`,
              }}
            />
          </div>

          {/* Statistici cumpărături */}
          <div className="shopping-dashboard-stats">
            <div>
              <strong>
                {remaining}
              </strong>

              <span>
                rămase
              </span>
            </div>

            <div>
              <strong>
                {shoppingPercent}%
              </strong>

              <span>
                completat
              </span>
            </div>
          </div>

          {/* Rezumat cămară */}
          <div className="pantry-dashboard">
            <div className="pantry-dashboard-header">
              <span>
                În cămară
              </span>

              <strong>
                {pantryTotal}
              </strong>

              <small>
                produse
              </small>
            </div>

            <div className="pantry-stats">
              <div>
                <strong>
                  {pantryLow}
                </strong>

                <span>
                  scăzute
                </span>
              </div>

              <div>
                <strong>
                  {pantryMedium}
                </strong>

                <span>
                  medii
                </span>
              </div>

              <div>
                <strong>
                  {pantryFull}
                </strong>

                <span>
                  suficiente
                </span>
              </div>
            </div>

            {pantryLow > 0 ? (
              <div className="pantry-warning">
                <span>⚠️</span>

                <div>
                  <strong>
                    {pantryLow} produse
                    aproape terminate
                  </strong>

                  <small>
                    Verifică lista din Cămară.
                  </small>
                </div>
              </div>
            ) : (
              <div className="pantry-good">
                ✓ Cămara este în regulă
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================
          RECOMANDATE
         ========================= */}
      <section className="dashboard-recommendations">
        <div className="recommendations-header">
          <div>
            <h2>
              Recomandate din cămară
            </h2>

            <p>
              Rețete potrivite în funcție de
              ingredientele pe care le ai.
            </p>
          </div>

          <div className="recommendations-controls">
            <label>
              <span>
                Afișează
              </span>

              <select
                value={recommendedCount}
                onChange={(event) =>
                  setRecommendedCount(
                    Number(event.target.value)
                  )
                }
              >
                <option value={3}>
                  3 rețete
                </option>

                <option value={4}>
                  4 rețete
                </option>

                <option value={6}>
                  6 rețete
                </option>

                <option value={8}>
                  8 rețete
                </option>

                <option value={10}>
                  10 rețete
                </option>
              </select>
            </label>

            <button
              type="button"
              onClick={suggestRecipe}
            >
              🎲 Sugerează o rețetă
            </button>
          </div>
        </div>

        {/* Sugestie random */}
        {suggestedRecipe && (
          <div className="recipe-suggestion card">
            <div className="suggestion-label">
              SUGESTIA ZILEI
            </div>

            <button
              type="button"
              className="suggestion-content"
              onClick={() =>
                setSelectedRecipe(
                  suggestedRecipe
                )
              }
            >
              {suggestedRecipe.image_url ? (
                <img
                  src={
                    suggestedRecipe.image_url
                  }
                  alt={suggestedRecipe.name}
                />
              ) : (
                <div className="suggestion-placeholder">
                  🍽️
                </div>
              )}

              <span>
                <strong>
                  {suggestedRecipe.name}
                </strong>

                <small>
                  {suggestedRecipe.category}
                </small>

                <small>
                  {
                    recipeScore(
                      suggestedRecipe,
                      data.pantry
                    )
                  }{' '}
                  ingrediente disponibile
                </small>
              </span>
            </button>
          </div>
        )}

        {/* Recomandări */}
        <div className="recipe-grid">
          {recommended.length ? (
            recommended.map((recipe) => (
              <button
                type="button"
                className="recipe-card dashboard-recipe-card"
                key={recipe.id}
                onClick={() =>
                  setSelectedRecipe(recipe)
                }
              >
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.name}
                  />
                ) : (
                  <div className="dashboard-recipe-placeholder">
                    🍽️
                  </div>
                )}

                <div className="dashboard-recipe-content">
                  <span>
                    {recipe.category}
                  </span>

                  <h3>
                    {recipe.name}
                  </h3>

                  <p>
                    {
                      recipeScore(
                        recipe,
                        data.pantry
                      )
                    }{' '}
                    ingrediente disponibile
                  </p>
                </div>
              </button>
            ))
          ) : (
            <EmptyState>
              Nu există încă rețete.
            </EmptyState>
          )}
        </div>
      </section>

      {/* =========================
          DETALII REȚETĂ
         ========================= */}
      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          favorite={data.favorites.includes(
            selectedRecipe.id
          )}
          onFavorite={() =>
            setSelectedRecipe(
              selectedRecipe
            )
          }
          onClose={() =>
            setSelectedRecipe(null)
          }
        />
      )}
    </>
  )
}