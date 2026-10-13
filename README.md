# Quiz Distribuição

Quiz ao vivo (React + Supabase + Netlify) para a área de Distribuição da Bayer.

## Publicar (Netlify + Supabase)

### 1) Criar projeto no Supabase

1. Acesse https://supabase.com → **New project**
2. Anote em **Settings → API**:
   - Project URL
   - anon public key
3. Em **SQL Editor**, execute nesta ordem:
   1. Conteúdo de `supabase/schema.sql`
   2. Conteúdo de `supabase/seed.sql`
4. Em **Authentication → Users**, crie um usuário (e-mail/senha) do **apresentador**
5. Em **SQL Editor**, rode (troque o e-mail):

```sql
insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where email = 'SEU_EMAIL_ADMIN@empresa.com'
on conflict (id) do update set role = 'admin';
```

6. Em **Database → Replication**, ative Realtime nas tabelas:
   `quiz_sessions`, `participants`, `answers`, `session_questions`, `score_snapshots`

### 2) Subir o front no Netlify

**Opção recomendada — GitHub → Netlify**

1. https://app.netlify.com → **Add new site** → **Import from Git**
2. Repositório: `Gustavo-Eloi/quiz-distribuicao`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Em **Site settings → Environment variables**, adicione:
   - `VITE_SUPABASE_URL` = URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` = chave anon
6. **Deploy**

**Netlify Drop** (só funciona se você gerar o `dist` local com o `.env` já preenchido):

```bash
# .env local
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

npm install
npm run build
# Arraste a pasta dist em https://app.netlify.com/drop
```

### 3) No dia do evento

1. Abra o link Netlify
2. **Controlar o jogo** → login do apresentador
3. Criar sessão com as perguntas → lobby → QR Code
4. Celulares: mesmo link → **Entrar no jogo**

## Desenvolvimento local

```bash
cp .env.example .env
# preencha as chaves
npm install
npm run dev
```

## Observação

O app Streamlit (`app.py`) permanece no repo, mas a publicação oficial do evento é **Netlify + Supabase**.
