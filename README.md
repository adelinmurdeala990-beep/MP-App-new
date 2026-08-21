# Planifică mese

Aplicație React pentru planificarea meselor, cămară și lista de cumpărături. Folosește Supabase Auth și PostgreSQL; datele unui cont se sincronizează între dispozitive.

## Pornire locală

1. Rulează `npm install`.
2. Copiază `.env.example` în `.env.local`.
3. Adaugă `VITE_SUPABASE_URL` și `VITE_SUPABASE_ANON_KEY` din proiectul tău Supabase.
4. În Supabase SQL Editor, rulează conținutul fișierului `supabase/migrations/20260821000000_initial_schema.sql`. Acesta creează schema, RLS și cele două rețete inițiale.
5. Rulează `npm run dev`.

## Verificare

```bash
npm run typecheck
npm run build
```

## Vercel

Importă repository-ul în Vercel, apoi adaugă aceleași variabile de mediu: `VITE_SUPABASE_URL` și `VITE_SUPABASE_ANON_KEY`. Build command este `npm run build`, iar directorul rezultat este `dist`.

În Supabase Auth, configurează URL-urile de redirect pentru adresa locală și cea de producție Vercel. Pentru un flux de înregistrare imediat, poți dezactiva confirmarea prin email din setările Auth; altfel utilizatorul va confirma emailul înainte de prima autentificare.
