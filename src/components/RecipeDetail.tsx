import type { Recipe } from '../types'

type RecipeStepData =
  | string
  | {
      text?: string
      step_number?: number
    }

export function RecipeDetail({
  recipe,
  favorite,
  onFavorite,
  onClose,
}: {
  recipe: Recipe
  favorite: boolean
  onFavorite: () => void
  onClose: () => void
}) {
  const steps = recipe.steps as unknown as RecipeStepData[]

  return (
    <div className="overlay">
      <article className="modal detail">

        <div className="modal-head">
          <h2>{recipe.name}</h2>

          <button
            className="icon-button"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="recipe-detail-image"
          />
        )}

        <p>{recipe.description}</p>

        <div className="nutrition">
          <span>{recipe.calories} kcal</span>
          <span>{recipe.protein}g proteine</span>
          <span>{recipe.carbs}g carbo</span>
          <span>{recipe.fat}g grăsimi</span>
        </div>

        <button
          type="button"
          onClick={onFavorite}
        >
          {favorite
            ? '★ Elimină din favorite'
            : '☆ Adaugă la favorite'}
        </button>

        <h3>
          Ingrediente · {recipe.servings} porții
        </h3>

        <ul>
          {recipe.ingredients.map((item, index) => (
            <li key={index}>
              {item.quantity !== null &&
                `${item.quantity} `}

              {item.unit &&
                `${item.unit} `}

              {item.name}
            </li>
          ))}
        </ul>

        <h3>Preparare</h3>

        <ol>
          {steps.map((step, index) => {
            if (typeof step === 'string') {
              return (
                <li key={index}>
                  {step}
                </li>
              )
            }

            return (
              <li
                key={
                  step.step_number ?? index
                }
              >
                {step.text ?? ''}
              </li>
            )
          })}
        </ol>

      </article>
    </div>
  )
}