import {
  useMemo,
  useState,
} from 'react'

import type {
  Recipe,
  UserData,
} from '../types'

import { RecipeDetail } from '../components/RecipeDetail'
import { RecipeForm } from '../components/RecipeForm'
import { EmptyState } from '../components/States'

const splitCategories = (
  category: string
): string[] =>
  category
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

export function Recipes({
  recipes,
  data,
  save,
  reload,
}: {
  recipes: Recipe[]
  data: UserData
  save: (
    patch: Partial<UserData>
  ) => Promise<boolean>
  reload: () => Promise<void>
}) {
  const [query, setQuery] =
    useState('')

  const [category, setCategory] =
    useState('')

  const [ingredients, setIngredients] =
    useState('')

  const [selected, setSelected] =
    useState<Recipe | null>(null)

  const [adding, setAdding] =
    useState(false)

  const terms =
    ingredients
      .split(',')
      .map((value) =>
        value
          .trim()
          .toLocaleLowerCase('ro')
      )
      .filter(Boolean)

  const categories = useMemo(() => {
    const values = new Set<string>()

    recipes.forEach((recipe) => {
      splitCategories(
        recipe.category
      ).forEach((value) =>
        values.add(value)
      )
    })

    return Array.from(values).sort(
      (a, b) =>
        a.localeCompare(b, 'ro')
    )
  }, [recipes])

  const shown = useMemo(() => {
    const normalizedQuery =
      query
        .trim()
        .toLocaleLowerCase('ro')

    return recipes
      .filter((recipe) => {
        const recipeCategories =
          splitCategories(
            recipe.category
          )

        const matchesCategory =
          !category ||
          (category ===
          '__favorites__'
            ? data.favorites.includes(
                recipe.id
              )
            : recipeCategories.includes(
                category
              ))

        if (!matchesCategory) {
          return false
        }

        if (normalizedQuery) {
          const searchableText = [
            recipe.name,
            recipe.description,
            ...recipe.ingredients.map(
              (ingredient) =>
                ingredient.name
            ),
          ]
            .join(' ')
            .toLocaleLowerCase('ro')

          if (
            !searchableText.includes(
              normalizedQuery
            )
          ) {
            return false
          }
        }

        if (terms.length) {
          const ingredientNames =
            recipe.ingredients.map(
              (ingredient) =>
                ingredient.name.toLocaleLowerCase(
                  'ro'
                )
            )

          const hasRequestedIngredient =
            terms.every((term) =>
              ingredientNames.some(
                (name) =>
                  name.includes(term)
              )
            )

          if (!hasRequestedIngredient) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        if (!terms.length) {
          return a.name.localeCompare(
            b.name,
            'ro'
          )
        }

        const score = (
          recipe: Recipe
        ) =>
          terms.reduce(
            (total, term) =>
              total +
              recipe.ingredients.filter(
                (ingredient) =>
                  ingredient.name
                    .toLocaleLowerCase(
                      'ro'
                    )
                    .includes(term)
              ).length,
            0
          )

        return score(b) - score(a)
      })
  }, [
    recipes,
    query,
    category,
    ingredients,
    data.favorites,
    terms,
  ])

  const toggle = async (
    id: string
  ) => {
    const favorites =
      data.favorites.includes(id)
        ? data.favorites.filter(
            (entry) => entry !== id
          )
        : [
            ...data.favorites,
            id,
          ]

    await save({ favorites })
  }

  return (
    <>
      <header className="recipes-header">
        <div>
          <span className="eyebrow">
            REȚETE
          </span>

          <h1>
            Găsește ceva bun
          </h1>
        </div>

        <button
          onClick={() =>
            setAdding(true)
          }
        >
          + Adaugă rețetă
        </button>
      </header>

      <div className="filters">
        <input
          placeholder="Caută după nume sau ingredient..."
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value
            )
          }
        />

        <input
          placeholder="Ingrediente: ouă, roșii"
          value={ingredients}
          onChange={(event) =>
            setIngredients(
              event.target.value
            )
          }
        />

        <select
          value={category}
          onChange={(event) =>
            setCategory(
              event.target.value
            )
          }
        >
          <option value="">
            Toate categoriile
          </option>

          <option value="__favorites__">
            ★ Favorite
          </option>

          {categories.map(
            (value) => (
              <option
                key={value}
                value={value}
              >
                {value}
              </option>
            )
          )}
        </select>
      </div>

      <div className="recipe-grid">
        {shown.length ? (
          shown.map((recipe) => (
            <button
              className="recipe-card left"
              onClick={() =>
                setSelected(recipe)
              }
              key={recipe.id}
            >
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt={recipe.name}
                  className="recipe-card-image"
                />
              ) : null}

              <div className="recipe-card-content">
                <span>
                  {splitCategories(
                    recipe.category
                  ).join(' · ')}
                </span>

                <h3>
                  {recipe.name}{' '}
                  {data.favorites.includes(
                    recipe.id
                  ) && '★'}
                </h3>

                <p>
                  {recipe.description}
                </p>

                <small>
                  {recipe.calories} kcal ·{' '}
                  {recipe.servings}{' '}
                  porții
                </small>
              </div>
            </button>
          ))
        ) : (
          <EmptyState>
            Nu există rețete care să
            corespundă filtrelor.
          </EmptyState>
        )}
      </div>

      {selected && (
        <RecipeDetail
          recipe={selected}
          favorite={data.favorites.includes(
            selected.id
          )}
          onFavorite={() =>
            void toggle(selected.id)
          }
          onClose={() =>
            setSelected(null)
          }
        />
      )}

      {adding && (
        <RecipeForm
          onClose={() =>
            setAdding(false)
          }
          onSaved={reload}
        />
      )}
    </>
  )
}