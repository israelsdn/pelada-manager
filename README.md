# Pelada Manager

Frontend + backend em Next.js (App Router) para organizar a pelada semanal
com os amigos, agora com banco de dados **MySQL** próprio (sem depender de
serviço externo).

## Stack

- Next.js 14 (App Router) + TypeScript — frontend e backend (API routes) no mesmo projeto
- MySQL, acessado via `mysql2` (queries SQL diretas, sem ORM)
- NextAuth (Credentials Provider, sessão JWT com validade de **5 minutos**)
- Tailwind CSS
- SWR (polling automático da lista a cada 15s + revalidação ao focar a aba)

## Como rodar

```bash
npm install

# 1. Crie um banco MySQL vazio e rode o schema:
mysql -u seu_usuario -p seu_banco < db/schema.sql

# 2. Configure as variáveis de ambiente
cp .env.local.example .env.local
# preencha DATABASE_URL e NEXTAUTH_SECRET no .env.local

# 3. Crie o primeiro administrador (veja instruções no fim do db/schema.sql)
#    -- sem isso ninguém consegue ativar cadastros, já que login exige ativo=true
mysql -u seu_usuario -p seu_banco -e "
INSERT INTO pessoas (id, nome_completo, apelido, telefone, ativo, administrador)
VALUES (UUID(), 'Seu Nome', 'Seu Apelido', '85999999999', TRUE, TRUE);
"

npm run dev
```

Acesse http://localhost:3000

## Modelagem do banco (MySQL)

Veja o DDL completo em [`db/schema.sql`](./db/schema.sql). Resumo:

- **`pessoas`** — cadastro de jogadores. `ativo` controla se pode logar,
  `administrador` libera abrir lista / editar regras / editar usuários.
  `gols` e `assistencias` alimentam o ranking.
- **`peladas`** — uma linha por semana em que a lista foi aberta
  (`data_inicio`, `dia_evento`, `data_termino`, `responsavel_id`).
- **`inscricoes`** — uma linha por pessoa inscrita em uma pelada.
  `status` é `goleiro`, `jogador` ou `suplente`; `posicao_suplente` só é
  preenchido quando `status = suplente`. Tem `UNIQUE (pelada_id, pessoa_id)`
  e `UNIQUE (pelada_id, device_id)` — é o próprio banco quem garante 1
  inscrição por pessoa e 1 por aparelho em cada lista.
- **`regras`** — linha única (`id` sempre `1`) com o texto das regras da
  pelada, editável só por administradores.

## Estrutura

```
db/
  schema.sql              → DDL completo + bootstrap do primeiro admin

app/
  page.tsx                      → redireciona para /login ou /dashboard
  login/page.tsx                → login por telefone
  cadastro/page.tsx             → cadastro (nome, apelido, telefone)
  regras/page.tsx               → regras (pública, edição só admin)
  ranking/page.tsx + RankingClient.tsx  → ranking de gols/assistências (logado)
  usuarios/page.tsx + UsuariosClient.tsx → gestão de usuários (admin)
  dashboard/
    page.tsx                    → server component, checa sessão
    DashboardClient.tsx         → UI principal (SWR, escalação, inscrição)
  api/
    auth/[...nextauth]/route.ts → NextAuth
    cadastro/route.ts           → cria Pessoa (ativo: false)
    lista/route.ts              → busca a pelada aberta (diaEvento futuro)
    lista/abrir/route.ts        → admin abre nova lista (datas customizáveis)
    lista/inscrever/route.ts    → inscrição (goleiro/jogador/suplente)
    lista/sair/route.ts         → retirar presença (com promoção de suplente)
    regras/route.ts             → GET público, PUT admin-only
    ranking/route.ts            → GET, requer login
    usuarios/route.ts           → GET lista, admin-only
    usuarios/[id]/route.ts      → PATCH edita qualquer campo, admin-only

lib/
  db.ts                → pool de conexão MySQL (mysql2)
  pessoa-service.ts    → CRUD de pessoas + ranking
  pelada-service.ts    → peladas e inscrições (com transações SQL)
  regras-service.ts    → leitura/edição das regras
  date-utils.ts        → cálculo de dataInicio / diaEvento / dataTermino
  phone.ts             → máscara (xx) x xxxx-xxxx e limpeza de dígitos
  device.ts            → cookie de identificação de aparelho (antifraude)
  auth.ts              → configuração do NextAuth

components/
  PhoneInput.tsx        → input com máscara de telefone
  Countdown.tsx         → relógio de contagem regressiva até o fechamento
  JerseySlot.tsx         → slot de escalação (goleiro/jogador)
  AbrirListaForm.tsx     → formulário de abertura de lista (datas editáveis)
  Providers.tsx          → SessionProvider do NextAuth
  Logo.tsx               → logo do time (troque public/logo.svg e app/icon.svg)

middleware.ts          → protege /dashboard, /ranking, /usuarios (exige sessão)
```

## Como colocar a logo do grupo

- `public/logo.svg` → logo usada dentro das páginas
- `app/icon.svg` → ícone da aba do navegador (favicon)

Basta substituir o conteúdo desses arquivos pela sua logo (ou trocar a
extensão referenciada em `components/Logo.tsx` se não for `.svg`).

## Regras de negócio implementadas

- Cadastro: nome completo, apelido e telefone obrigatórios; telefone
  guardado só com dígitos; todo cadastro nasce com `ativo = false`.
- Login: só telefone. Se não existir cadastro → erro. Se existir mas
  `ativo = false` → mensagem informando que aguarda ativação da
  administração. Sessão dura **5 minutos** (JWT do NextAuth).
- Abertura da lista (só administrador):
  - `dataInicio`: sábado mais próximo às 19h
  - `diaEvento`: segunda-feira seguinte às 20h30
  - `dataTermino`: essa mesma segunda às 19h (fim das inscrições)
  - O admin vê essas 3 datas já preenchidas, mas pode ajustar antes de confirmar.
- Inscrição:
  - até 3 goleiros e 12 jogadores nas listas principais
  - a partir do 4º goleiro ou 13º jogador, vai para suplentes
  - bloqueada após `dataTermino`
  - 1 inscrição por pessoa e 1 por aparelho (garantido a nível de banco via
    `UNIQUE`, além da checagem na aplicação)
- Sair da lista: qualquer pessoa pode retirar a própria presença a
  qualquer momento; se saía de uma lista principal, o suplente mais
  antigo da posição correspondente é promovido automaticamente — tudo
  numa única transação SQL.
- Regras: página pública (`/regras`), leitura livre, edição só para
  administradores.
- Ranking: página `/ranking` (requer login) lista todo mundo ordenado por
  gols e depois assistências.
- Usuários: página `/usuarios` (admin-only) lista todos os cadastros e
  permite editar qualquer campo — nome, apelido, telefone, gols,
  assistências, e ativar/desativar ou promover/remover administrador.
- Dashboard atualiza sozinho quando algo muda de verdade, sem sobrecarregar
  o banco (veja seção abaixo) — arquitetura 100% compatível com Vercel/serverless.
- Inscrição também é bloqueada **antes** de `dataInicio` (não só depois de
  `dataTermino`) — ou seja, só é possível se inscrever dentro da janela
  sábado 19h → segunda 19h.

## Atualização "quase em tempo real" sem sobrecarregar o banco

Esse projeto roda na **Vercel** (serverless): cada requisição pode cair numa
instância diferente, sem memória compartilhada entre elas, e conexões
long-lived (WebSocket/SSE) não são uma boa opção nesse ambiente. Por isso a
estratégia é toda **stateless**, baseada em polling, mas otimizada para ser
barata:

- O frontend faz polling de um endpoint **bem leve**
  (`GET /api/lista/versao`) a cada 8 segundos. Essa rota só lê `id` e
  `atualizado_em` da pelada aberta — uma única linha, sem `JOIN`, bem barata
  pro banco mesmo com várias pessoas de dashboard aberto ao mesmo tempo.
- `atualizado_em` é gravado pela própria aplicação (dentro da mesma
  transação SQL) toda vez que alguém se inscreve, sai da lista, ou a lista é
  aberta — então qualquer mudança real muda esse valor.
- O frontend guarda o último valor visto; só quando ele muda de fato é que
  dispara a busca **completa** (`GET /api/lista`, com o `JOIN` de inscrições
  e pessoas) via `mutate()` do SWR.
- Ou seja: a query pesada só roda quando algo realmente mudou; o polling
  frequente é sempre da query barata.

Isso troca "tempo real instantâneo" por "atualiza em até ~8 segundos", que é
mais que suficiente pra esse caso de uso, e funciona de forma confiável em
qualquer ambiente serverless sem precisar de infraestrutura extra
(WebSocket, Redis, etc.).

### Sobre o pool de conexões MySQL na Vercel

Vale um adendo: `lib/db.ts` usa um pool de conexões `mysql2` cacheado em
`globalThis`, o que ajuda a reaproveitar conexões entre invocações numa
mesma instância "quente" da função serverless. Em picos de tráfego, a
Vercel pode escalar para várias instâncias simultâneas, e cada uma abre seu
próprio pool — se o volume de acesso crescer bastante, vale considerar um
banco MySQL "serverless-friendly" com pooling embutido (ex: PlanetScale) ou
um pooler externo (ex: ProxySQL) na frente do banco, para não esgotar o
limite de conexões do MySQL. Para o volume de uma pelada entre amigos, o
pool atual deve ser suficiente.

## Notas sobre fuso horário

Datas são um dos pontos mais fáceis de errar em qualquer stack. Aqui,
padronizamos tudo em UTC:

- O pool do MySQL (`lib/db.ts`) usa `timezone: "Z"`, forçando conversão
  consistente entre `Date` do Node e `DATETIME` do MySQL, independente de
  como o servidor de banco está configurado.
- Comparações de "agora" nunca usam `NOW()` do SQL (que depende do fuso do
  servidor MySQL) — sempre um `new Date()` calculado no Node e passado como
  parâmetro da query.

## Sobre condição de corrida e antifraude

Diferente da integração anterior (Sydle, via HTTP), agora as escritas
sensíveis (inscrever-se, sair da lista) rodam dentro de **transações SQL
com `SELECT ... FOR UPDATE`**, então duas pessoas tentando pegar a última
vaga ao mesmo tempo são serializadas pelo próprio banco — não há mais
janela de corrida como havia antes.

O limite de "1 inscrição por aparelho" continua baseado em cookie
(`pelada_device_id`, 5 anos de validade, independente da sessão de login).
Isso tem os limites naturais de qualquer solução client-side: dá pra
burlar limpando cookies ou usando aba anônima. Resolve o caso comum, não
é uma trava 100% à prova de burla.
