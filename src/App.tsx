import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { useAppData } from './hooks/useAppData'
import { Navigation, type Page } from './components/Navigation'
import { ErrorState, LoadingState } from './components/States'
import { Auth } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'
import { Recipes } from './pages/Recipes'
import { Pantry } from './pages/Pantry'
import { MealPlan } from './pages/MealPlan'
import { ShoppingList } from './pages/ShoppingList'
import { Settings } from './pages/Settings'

export default function App() {
  const { session, loading: authLoading } = useAuth(); const [page, setPage] = useState<Page>('home'); const app = useAppData(session?.user.id)
  if (authLoading) return <LoadingState/>; if (!session) return <Auth/>; if (app.loading) return <LoadingState/>; if (app.error || !app.data) return <main className="app"><ErrorState message={app.error || undefined} retry={app.reload}/></main>
  const props = { recipes:app.recipes, data:app.data, save:app.save }
  const content = page === 'home' ? <Dashboard recipes={app.recipes} data={app.data}/> : page === 'recipes' ? <Recipes {...props} reload={app.reload}/> : page === 'pantry' ? <Pantry {...props}/> : page === 'plan' ? <MealPlan {...props}/> : page === 'shopping' ? <ShoppingList {...props}/> : <Settings data={app.data} save={app.save}/>
  return <div className="shell"><aside><div className="brand">planifică<span>mese</span></div><Navigation page={page} setPage={setPage}/></aside><main className="app">{content}</main><Navigation page={page} setPage={setPage}/></div>
}
