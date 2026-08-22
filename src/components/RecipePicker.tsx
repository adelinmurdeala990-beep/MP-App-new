import { useMemo, useState } from 'react'
import type { Recipe } from '../types'

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ro')
    .trim()

export function RecipePicker({
  recipes,
  onPick,
  onClose,
}: {
  recipes: Recipe[]
  onPick: (recipe: Recipe) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Toate')

  const categories = useMemo(() => {
    const values = new Set<string>()

    recipes.forEach((recipe) => {
      recipe.category
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => values.add(value))
    })

    return [
      'Toate',
      ...Array.from(values).sort((a, b) =>
        a.localeCompare(b, 'ro')
      ),
    ]
  }, [recipes])

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = normalizeSearchText(search)

    return recipes.filter((recipe) => {
      const matchesCategory =
        category === 'Toate' ||
        recipe.category
          .split(',')
          .map((value) => value.trim())
          .includes(category)

      if (!matchesCategory) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const nameMatch = normalizeSearchText(
        recipe.name
      ).includes(normalizedSearch)

      const ingredientMatch = recipe.ingredients.some(
        (ingredient) =>
          normalizeSearchText(
            ingredient.name
          ).includes(normalizedSearch)
      )

      return nameMatch || ingredientMatch
    })
  }, [recipes, search, category])

  return (
    <div className="overlay">
      <div className="modal recipe-picker-modal">
        <div className="modal-head">
          <h2>Alege o rețetă</h2>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="picker-filters">
          <input
            type="search"
            placeholder="Caută rețetă sau ingredient..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
          >
            {categories.map((item) => (
              <option
                value={item}
                key={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="picker-results">
          {filteredRecipes.length ? (
            filteredRecipes.map((recipe) => (
              <button
                type="button"
                className="picker"
                key={recipe.id}
                onClick={() => onPick(recipe)}
              >
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.name}
                  />
                ) : (
                  <div className="picker-placeholder">
                    🍽️
                  </div>
                )}

                <span className="picker-content">
                  <strong>
                    {recipe.name}
                  </strong>

                  <small>
                    {recipe.category}
                  </small>

                  <small>
                    {recipe.servings} porții
                  </small>
                </span>
              </button>
            ))
          ) : (
            <p className="picker-empty">
              Nu am găsit nicio rețetă.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}