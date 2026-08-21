import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthValue = { session: Session | null; loading: boolean; signIn: (email: string, password: string) => Promise<string | null>; signUp: (email: string, password: string) => Promise<string | null>; signOut: () => Promise<void> }
const AuthContext = createContext<AuthValue | undefined>(undefined)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null); const [loading, setLoading] = useState(true)
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) }); const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next)); return () => data.subscription.unsubscribe() }, [])
  const auth = async (type: 'in' | 'up', email: string, password: string) => { const { error } = type === 'in' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password }); return error?.message || null }
  return <AuthContext.Provider value={{ session, loading, signIn: (e,p) => auth('in',e,p), signUp: (e,p) => auth('up',e,p), signOut: async () => { await supabase.auth.signOut() } }}>{children}</AuthContext.Provider>
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth trebuie folosit în AuthProvider'); return value }
