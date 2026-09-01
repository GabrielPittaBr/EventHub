# 01 — Esqueleto do projeto: Express + EJS + layout base

**O que construir:** rodando `npm start`, o servidor sobe e o navegador abre a home do EventHub já com o layout definitivo — cabeçalho com o nome do sistema, navegação, área reservada para mensagens flash e rodapé — usando o CSS base do projeto. A home ainda mostra conteúdo estático (o banco só entra no ticket 02). O endpoint `/health` responde 200 para o healthcheck do Render.

**Bloqueado por:** nada — pode começar imediatamente.

**Status:** ready-for-agent

## Critérios de aceitação

- [ ] `package.json` criado com `name`, `version`, `engines.node` compatível com o Render, e os scripts `start` (produção, sem nodemon) e `dev`.
- [ ] Dependências instaladas: `express`, `ejs`, `express-ejs-layouts`, `mysql2`, `bcryptjs`, `express-session`, `express-mysql-session`, `dotenv`, `helmet`, `express-validator`, `method-override`. Nenhuma biblioteca de CSS ou framework de front-end.
- [ ] Estrutura de pastas criada: `src/routes`, `src/controllers`, `src/models`, `src/middlewares`, `src/config`, `views/`, `public/`.
- [ ] Aplicação usa EJS com `express-ejs-layouts` e um layout base em `views/` contendo header, navegação, área de mensagens flash e bloco de conteúdo.
- [ ] Middlewares globais ligados: `helmet`, `express.urlencoded({ extended: false })`, `method-override` lendo `_method`, e arquivos estáticos servidos de `public/`.
- [ ] Porta lida de `process.env.PORT` com fallback local, e `trust proxy` configurado para o proxy do Render.
- [ ] `GET /health` responde 200 indicando que a aplicação está no ar. **Este é o único ponto da aplicação que devolve JSON** — todo o resto é HTML renderizado no servidor.
- [ ] `GET /` renderiza uma página EJS usando o layout base (conteúdo estático por enquanto).
- [ ] `public/css` traz o design system do projeto: fundo `#f6f7f9`, cards brancos com borda `#e3e6ea` e raio de 10px, texto `#1f2933`, acento azul `#2563eb`, erro `#dc2626`, sucesso `#16a34a`, fonte `system-ui`, container centralizado com largura máxima de 1100px e espaçamento generoso. Proibido roxo e fundo escuro.
- [ ] `.env.example` criado com todas as chaves previstas e **sem valores reais**: `NODE_ENV`, `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL_CA`, `SESSION_SECRET`.
- [ ] `.gitignore` ignora `.env` e `node_modules`. Nenhum valor de configuração hardcoded no código.

## Verificação manual

1. `npm install` e `npm start` — o servidor sobe sem erro e informa a porta.
2. Abrir `http://localhost:3000/` — a página aparece com header, navegação e o CSS aplicado.
3. Reduzir a janela até a largura de celular — o layout vira uma coluna, sem rolagem horizontal.
4. `curl http://localhost:3000/health` — responde 200.
5. `git status` — `.env` e `node_modules` não aparecem como arquivos não rastreados.

## Fora de escopo

Banco de dados, autenticação e qualquer resposta JSON além de `/health`. Nada de JWT, CORS ou referência a outros repositórios.

## Commit

Mensagem em português, curta e descritiva. **Não adicionar Claude como co-autor** — o commit não deve conter nenhum trailer `Co-Authored-By`.
