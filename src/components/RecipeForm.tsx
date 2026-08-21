import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Ingredient, Recipe } from '../types'

type Props = { onClose: () => void; onSaved: () => Promise<void> }
const parseIngredients = (value: string): Ingredient[] | null => {
  const rows = value.split('\n').map((row) => row.trim()).filter(Boolean)
  const parsed = rows.map((row) => { const [name, quantity, unit] = row.split('|').map((part) => part.trim()); return { name, quantity: Number(quantity), unit } })
  return parsed.length && parsed.every((item) => item.name && Number.isFinite(item.quantity) && item.quantity > 0 && item.unit) ? parsed : null
}

export function RecipeForm({ onClose, onSaved }: Props) {
  const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [category, setCategory] = useState(''); const [servings, setServings] = useState('2'); const [calories, setCalories] = useState('0'); const [protein, setProtein] = useState('0'); const [carbs, setCarbs] = useState('0'); const [fat, setFat] = useState('0'); const [ingredients, setIngredients] = useState(''); const [steps, setSteps] = useState(''); const [image, setImage] = useState<File | null>(null); const [error, setError] = useState<string | null>(null); const [saving, setSaving] = useState(false)
  const submit = async (event: FormEvent) => { event.preventDefault(); const parsed = parseIngredients(ingredients); const preparedSteps = steps.split('\n').map((step) => step.trim()).filter(Boolean); if (!name.trim() || !category.trim() || !parsed || !preparedSteps.length || Number(servings) < 1) { setError('Completează numele, categoria, porțiile, ingredientele și pașii în formatul indicat.'); return } setSaving(true); setError(null)
    let imageUrl: string | null = null
    if (image) { const extension = image.name.split('.').pop() || 'jpg'; const path = `${crypto.randomUUID()}.${extension}`; const { error: uploadError } = await supabase.storage.from('recipe-images').upload(path, image, { contentType: image.type, upsert: false }); if (uploadError) { setError(`Imaginea nu s-a putut încărca: ${uploadError.message}`); setSaving(false); return }; imageUrl = supabase.storage.from('recipe-images').getPublicUrl(path).data.publicUrl }
    const payload: Omit<Recipe, 'id'> = { name: name.trim(), description: description.trim(), category: category.trim(), image_url: imageUrl, servings: Number(servings), calories: Number(calories) || 0, protein: Number(protein) || 0, carbs: Number(carbs) || 0, fat: Number(fat) || 0, ingredients: parsed, steps: preparedSteps }
    const { error: insertError } = await supabase.from('recipes').insert(payload)
    if (insertError) { setError(`Rețeta nu s-a putut salva: ${insertError.message}`); setSaving(false); return }
    await onSaved(); onClose()
  }
  return (
  <div className="overlay">
    <form className="modal recipe-form" onSubmit={submit}>
      <div className="modal-head">
        <h2>Adaugă rețetă</h2>

        <button
          type="button"
          className="icon-button"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <label>
        Nume
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>

      <label>
        Descriere
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Scurtă descriere"
        />
      </label>

      <div className="form-grid">
        <label>
          Categorie
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="De exemplu: Prânz"
            required
          />
        </label>

        <label>
          Porții
          <input
            type="number"
            min="1"
            value={servings}
            onChange={(event) => setServings(event.target.value)}
            required
          />
        </label>
      </div>

      <label>
        Fotografie (opțional)
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) =>
            setImage(event.target.files?.[0] || null)
          }
        />
      </label>

      <label>
        Ingrediente
        <textarea
          value={ingredients}
          onChange={(event) => setIngredients(event.target.value)}
          placeholder={`Un ingredient pe rând:
Piept de pui | 400 | g
Orez | 160 | g`}
          required
        />
      </label>

      <label>
        Pași de preparare
        <textarea
          value={steps}
          onChange={(event) => setSteps(event.target.value)}
          placeholder={`Un pas pe rând:
Fierbe orezul.
Gătește puiul.`}
          required
        />
      </label>

      <details>
        <summary>Informații nutriționale (opțional)</summary>

        <div className="form-grid">
          <label>
            Calorii
            <input
              type="number"
              min="0"
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
            />
          </label>

          <label>
            Proteine (g)
            <input
              type="number"
              min="0"
              value={protein}
              onChange={(event) => setProtein(event.target.value)}
            />
          </label>

          <label>
            Carbohidrați (g)
            <input
              type="number"
              min="0"
              value={carbs}
              onChange={(event) => setCarbs(event.target.value)}
            />
          </label>

          <label>
            Grăsimi (g)
            <input
              type="number"
              min="0"
              value={fat}
              onChange={(event) => setFat(event.target.value)}
            />
          </label>
        </div>
      </details>

      {error && (
        <p className="form-message">
          {error}
        </p>
      )}

      <button disabled={saving}>
        {saving ? "Se salvează…" : "Salvează rețeta"}
      </button>
    </form>
  </div>
)
}
