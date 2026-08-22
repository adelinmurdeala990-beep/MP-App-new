import { FormEvent, useMemo, useState } from 'react'
import type { ShoppingItem, UserData } from '../types'
import { EmptyState } from '../components/States'

export function ShoppingList({
  data,
  save,
}: {
  data: UserData
  save: (patch: Partial<UserData>) => Promise<boolean>
}) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [feedback, setFeedback] = useState('')

  const [listName, setListName] = useState('')
  const [activeList, setActiveList] = useState<string | null>(null)
  const [customItem, setCustomItem] = useState('')

  /*
   * Statistici lista principală
   */
  const totalItems = data.shopping_list.length

  const checkedItems = data.shopping_list.filter(
    (item) => item.checked
  ).length

  const remainingItems = totalItems - checkedItems

  const progress =
    totalItems > 0
      ? Math.round((checkedItems / totalItems) * 100)
      : 0

  /*
   * Lista personală selectată
   */
  const current = useMemo(
    () =>
      data.custom_lists.find(
        (list) => list.id === activeList
      ) ?? null,
    [data.custom_lists, activeList]
  )

  /*
   * Actualizează un produs din lista principală.
   */
  const updateFood = async (
    id: string,
    patch: Partial<ShoppingItem>
  ) => {
    await save({
      shopping_list: data.shopping_list.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
            }
          : item
      ),
    })
  }

  /*
   * Adaugă manual un produs.
   */
  const addFood = async (event: FormEvent) => {
    event.preventDefault()

    const trimmedName = name.trim()
    const trimmedUnit = unit.trim()

    if (!trimmedName) {
      return
    }

    const parsedQuantity = Number(quantity)

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      return
    }

    const item: ShoppingItem = {
      id: crypto.randomUUID(),
      name: trimmedName,
      quantity: parsedQuantity,
      unit: trimmedUnit,
      checked: false,
      manual: true,
    }

    const success = await save({
      shopping_list: [
        ...data.shopping_list,
        item,
      ],
    })

    if (success) {
      setName('')
      setQuantity('')
      setUnit('')

      setFeedback('Produsul a fost adăugat.')

      window.setTimeout(() => {
        setFeedback('')
      }, 2500)
    }
  }

  /*
   * Regenerează lista pe baza planului curent.
   */
  const regenerate = async () => {
    const success = await save({
      meal_plan: data.meal_plan,
    })

    if (success) {
      setFeedback(
        'Lista de cumpărături a fost actualizată.'
      )

      window.setTimeout(() => {
        setFeedback('')
      }, 3000)
    } else {
      setFeedback(
        'Nu am putut actualiza lista de cumpărături.'
      )

      window.setTimeout(() => {
        setFeedback('')
      }, 3000)
    }
  }

  /*
   * Golește complet lista principală.
   */
  const clearShoppingList = async () => {
    if (data.shopping_list.length === 0) {
      return
    }

    const confirmed = window.confirm(
      'Sigur vrei să golești lista de cumpărături? Toate produsele din lista actuală vor fi șterse.'
    )

    if (!confirmed) {
      return
    }

    const success = await save({
      shopping_list: [],
    })

    if (success) {
      setFeedback(
        'Lista de cumpărături a fost golită.'
      )

      window.setTimeout(() => {
        setFeedback('')
      }, 3000)
    }
  }

  /*
   * Creează o listă personală.
   */
  const createList = async (event: FormEvent) => {
    event.preventDefault()

    const trimmedName = listName.trim()

    if (!trimmedName) {
      return
    }

    const newList = {
      id: crypto.randomUUID(),
      name: trimmedName,
      items: [],
    }

    const success = await save({
      custom_lists: [
        ...data.custom_lists,
        newList,
      ],
    })

    if (success) {
      setListName('')
      setActiveList(newList.id)
    }
  }

  /*
   * Adaugă produs într-o listă personală.
   */
  const addCustom = async (event: FormEvent) => {
    event.preventDefault()

    if (!current) {
      return
    }

    const trimmedItem = customItem.trim()

    if (!trimmedItem) {
      return
    }

    const item: ShoppingItem = {
      id: crypto.randomUUID(),
      name: trimmedItem,
      quantity: null,
      unit: '',
      checked: false,
      manual: true,
    }

    const updatedLists = data.custom_lists.map(
      (list) =>
        list.id === current.id
          ? {
              ...list,
              items: [
                ...list.items,
                item,
              ],
            }
          : list
    )

    const success = await save({
      custom_lists: updatedLists,
    })

    if (success) {
      setCustomItem('')
    }
  }

  /*
   * Actualizează produsele din lista personală.
   */
  const updateCustom = async (
    items: ShoppingItem[]
  ) => {
    if (!current) {
      return
    }

    await save({
      custom_lists: data.custom_lists.map(
        (list) =>
          list.id === current.id
            ? {
                ...list,
                items,
              }
            : list
      ),
    })
  }

  /*
   * Textul principal al progresului.
   *
   * Separăm cazul 0/0 de celelalte cazuri,
   * pentru a nu afișa "0 produse de cumpărat"
   * atunci când lista este pur și simplu goală.
   */
  const progressTitle =
    totalItems === 0
      ? 'Lista de cumpărături este goală'
      : remainingItems === 0
        ? 'Toate produsele sunt cumpărate!'
        : `${remainingItems} ${
            remainingItems === 1
              ? 'produs'
              : 'produse'
          } de cumpărat`

  return (
    <>
      <header>
        <span className="eyebrow">
          CUMPĂRĂTURI
        </span>

        <h1>Lista ta</h1>
      </header>

      {/*
       * PROGRES
       */}
      <section className="card shopping-progress">
        <div className="shopping-progress-header">
          <div>
            <strong>
              {progressTitle}
            </strong>

            <small>
              {totalItems === 0
                ? 'Nu există produse în lista actuală.'
                : `${checkedItems} din ${totalItems} ${
                    totalItems === 1
                      ? 'produs cumpărat'
                      : 'produse cumpărate'
                  }`}
            </small>
          </div>

          <strong>
            {progress}%
          </strong>
        </div>

        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progres cumpărături"
        >
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </section>

      {/*
       * ACTIUNI
       */}
      <div className="actions">
        <button
          type="button"
          onClick={() =>
            void regenerate()
          }
        >
          ↻ Actualizează lista cumpărături
        </button>

        <button
          type="button"
          className="danger"
          onClick={() =>
            void clearShoppingList()
          }
          disabled={data.shopping_list.length === 0}
        >
          Golește lista
        </button>

        {data.meal_plan.length === 0 && (
          <span>
            Nu ai planificat încă nicio masă.
          </span>
        )}
      </div>

      {/*
       * FEEDBACK
       */}
      {feedback && (
        <p
          className="update-feedback"
          role="status"
        >
          {feedback}
        </p>
      )}

      {/*
       * ADAUGARE MANUALĂ
       */}
      <form
        className="inline-form card"
        onSubmit={addFood}
      >
        <input
          placeholder="Produs alimentar manual"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          required
        />

        <input
          type="number"
          min="0.01"
          step="any"
          placeholder="Cantitate"
          value={quantity}
          onChange={(event) =>
            setQuantity(event.target.value)
          }
          required
        />

        <input
          value={unit}
          onChange={(event) =>
            setUnit(event.target.value)
          }
          placeholder="Unitate"
          required
        />

        <button type="submit">
          Adaugă
        </button>
      </form>

      {/*
       * LISTA PRINCIPALĂ
       */}
      <section className="card list">
        {data.shopping_list.length ? (
          data.shopping_list.map((item) => (
            <div
              key={item.id}
              className={
                item.checked
                  ? 'checked'
                  : ''
              }
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(event) =>
                  void updateFood(
                    item.id,
                    {
                      checked:
                        event.target.checked,
                    }
                  )
                }
              />

              <strong>
                {item.name}
              </strong>

              <input
                type="number"
                min="0"
                step="any"
                value={
                  item.quantity ?? ''
                }
                onChange={(event) =>
                  void updateFood(
                    item.id,
                    {
                      quantity:
                        event.target.value === ''
                          ? null
                          : Number(
                              event.target.value
                            ),
                    }
                  )
                }
              />

              <input
                value={
                  item.unit ?? ''
                }
                onChange={(event) =>
                  void updateFood(
                    item.id,
                    {
                      unit:
                        event.target.value,
                    }
                  )
                }
              />

              <button
                type="button"
                className="danger"
                onClick={() =>
                  void save({
                    shopping_list:
                      data.shopping_list.filter(
                        (entry) =>
                          entry.id !== item.id
                      ),
                  })
                }
              >
                Șterge
              </button>
            </div>
          ))
        ) : (
          <EmptyState>
            Lista de cumpărături este goală.
          </EmptyState>
        )}
      </section>

      {/*
       * LISTE PERSONALE
       */}
      <section className="custom-lists">
        <h2>
          Liste personale
        </h2>

        <p>
          De exemplu: produse de curățenie,
          bricolaj sau animale.
        </p>

        <form
          className="inline-form"
          onSubmit={createList}
        >
          <input
            placeholder="Numele listei noi"
            value={listName}
            onChange={(event) =>
              setListName(
                event.target.value
              )
            }
          />

          <button type="submit">
            Creează listă
          </button>
        </form>

        {data.custom_lists.length > 0 && (
          <select
            value={activeList ?? ''}
            onChange={(event) =>
              setActiveList(
                event.target.value || null
              )
            }
          >
            <option value="">
              Alege o listă
            </option>

            {data.custom_lists.map(
              (list) => (
                <option
                  value={list.id}
                  key={list.id}
                >
                  {list.name}
                </option>
              )
            )}
          </select>
        )}

        {current && (
          <section className="card personal-list">
            <h3>
              {current.name}
            </h3>

            <form
              className="inline-form"
              onSubmit={addCustom}
            >
              <input
                placeholder="Adaugă produs"
                value={customItem}
                onChange={(event) =>
                  setCustomItem(
                    event.target.value
                  )
                }
              />

              <button type="submit">
                Adaugă
              </button>
            </form>

            {current.items.length ? (
              current.items.map(
                (item) => (
                  <div
                    className={
                      item.checked
                        ? 'checked'
                        : ''
                    }
                    key={item.id}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(event) =>
                        void updateCustom(
                          current.items.map(
                            (entry) =>
                              entry.id ===
                              item.id
                                ? {
                                    ...entry,
                                    checked:
                                      event
                                        .target
                                        .checked,
                                  }
                                : entry
                          )
                        )
                      }
                    />

                    <strong>
                      {item.name}
                    </strong>

                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        void updateCustom(
                          current.items.filter(
                            (entry) =>
                              entry.id !==
                              item.id
                          )
                        )
                      }
                    >
                      Șterge
                    </button>
                  </div>
                )
              )
            ) : (
              <EmptyState>
                Lista este goală.
              </EmptyState>
            )}
          </section>
        )}
      </section>
    </>
  )
}