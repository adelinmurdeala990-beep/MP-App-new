import type {
  Ingredient,
  PantryItem,
  Recipe,
  ShoppingItem,
  MealPlanItem,
} from '../types'

const normalizedUnit = (
  unit: string | null | undefined
) =>
  (unit ?? '')
    .trim()
    .toLocaleLowerCase('ro')

const normalizedName = (
  name: string
) =>
  name
    .trim()
    .toLocaleLowerCase('ro')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')

const keyFor = (item: Ingredient) =>
  `${normalizedName(item.name)}:${normalizedUnit(item.unit)}`

/**
 * Unități pentru care nu are sens să cumpărăm
 * fracții.
 *
 * Exemple:
 * 0.83 ouă -> 1 ou
 * 1.2 bucăți -> 2 bucăți
 * 2.1 chifle -> 3 chifle
 */
const isDiscreteUnit = (
  unit: string | null | undefined
) => {
  const value = normalizedUnit(unit)

  return [
    'buc',
    'buc.',
    'bucata',
    'bucată',
    'bucati',
    'bucăți',
    'bucată.',
    'ou',
    'oua',
    'ouă',
    'chifla',
    'chiflă',
    'chifle',
    'felie',
    'felii',
    'foaie',
    'foi',
    'roșie',
    'rosie',
    'roșii',
    'rosii',
    'lămâie',
    'lamaie',
    'lămâi',
    'lamai',
    'avocado',
  ].includes(value)
}

const compatible = (
  unit: string | null | undefined
) => {
  const value = normalizedUnit(unit)

  if (value === 'kg') {
    return {
      unit: 'g',
      factor: 1000,
    }
  }

  if (value === 'l') {
    return {
      unit: 'ml',
      factor: 1000,
    }
  }

  return {
    unit: value,
    factor: 1,
  }
}

const roundQuantity = (
  quantity: number,
  unit: string | null | undefined
) => {
  if (!Number.isFinite(quantity)) {
    return null
  }

  /*
   * Pentru bucăți / ouă / chifle etc.
   * cumpărăm întotdeauna un număr întreg.
   */
  if (isDiscreteUnit(unit)) {
    return Math.ceil(quantity)
  }

  /*
   * Pentru g, ml, linguri etc. păstrăm
   * maximum 2 zecimale.
   */
  return Number(quantity.toFixed(2))
}

export function recipeScore(
  recipe: Recipe,
  pantry: PantryItem[]
) {
  const names = new Set(
    pantry
      .filter(
        (item) => item.stock === 'enough'
      )
      .map((item) =>
        normalizedName(item.name)
      )
  )

  return recipe.ingredients.filter(
    (ingredient) =>
      names.has(
        normalizedName(ingredient.name)
      )
  ).length
}

export function generateShoppingList(
  plan: MealPlanItem[],
  recipes: Recipe[],
  pantry: PantryItem[],
  existing: ShoppingItem[]
): ShoppingItem[] {
  const totals =
    new Map<string, Ingredient>()

  plan.forEach((entry) => {
    const recipe = recipes.find(
      (item) => item.id === entry.recipeId
    )

    if (!recipe) {
      return
    }

    const recipeServings =
      Number(recipe.servings) > 0
        ? Number(recipe.servings)
        : 1

    const entryServings =
      Number(entry.servings) > 0
        ? Number(entry.servings)
        : recipeServings

    recipe.ingredients.forEach(
      (ingredient) => {
        if (
          !ingredient ||
          !ingredient.name?.trim()
        ) {
          return
        }

        /*
         * Ingredientele fără cantitate rămân
         * în listă fără cantitate.
         */
        if (
          ingredient.quantity === null ||
          ingredient.quantity === undefined ||
          !Number.isFinite(
            Number(ingredient.quantity)
          )
        ) {
          const value: Ingredient = {
            name: ingredient.name.trim(),
            quantity: null,
            unit:
              ingredient.unit?.trim() || null,
          }

          const key = keyFor(value)

          if (!totals.has(key)) {
            totals.set(key, value)
          }

          return
        }

        const converted = compatible(
          ingredient.unit
        )

        const quantity =
          Number(ingredient.quantity) *
          entryServings /
          recipeServings *
          converted.factor

        const value: Ingredient = {
          name: ingredient.name.trim(),
          quantity,
          unit:
            converted.unit || null,
        }

        const key = keyFor(value)
        const previous = totals.get(key)

        if (
          previous &&
          previous.quantity !== null &&
          value.quantity !== null
        ) {
          totals.set(key, {
            ...value,
            quantity:
              previous.quantity +
              value.quantity,
          })
        } else if (!previous) {
          totals.set(key, value)
        }
      }
    )
  })

  /*
   * Produsele care există deja în cămară
   * și sunt suficiente nu intră în listă.
   */
  const enoughNames = new Set(
    pantry
      .filter(
        (item) => item.stock === 'enough'
      )
      .map((item) =>
        normalizedName(item.name)
      )
  )

  for (const [key, item] of totals) {
    if (
      enoughNames.has(
        normalizedName(item.name)
      )
    ) {
      totals.delete(key)
    }
  }

  /*
   * Păstrăm ID-ul și checked pentru produsele
   * deja existente în lista generată.
   */
  const prior = new Map(
    existing
      .filter((item) => !item.manual)
      .map((item) => [
        keyFor(item),
        item,
      ])
  )

  const generated: ShoppingItem[] = [
    ...totals.values(),
  ]
    .filter(
      (item) =>
        item.quantity === null ||
        item.quantity > 0
    )
    .map((item) => {
      const previous =
        prior.get(keyFor(item))

      return {
        ...item,

        quantity:
          item.quantity === null
            ? null
            : roundQuantity(
                item.quantity,
                item.unit
              ),

        id:
          previous?.id ||
          crypto.randomUUID(),

        checked:
          previous?.checked || false,

        manual: false,
      }
    })

  /*
   * Produsele adăugate manual nu trebuie șterse
   * atunci când regenerăm lista.
   */
  return [
    ...generated,
    ...existing.filter(
      (item) => item.manual
    ),
  ]
}