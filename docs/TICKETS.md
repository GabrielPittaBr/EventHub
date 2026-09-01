# EventHub — Tickets

Aplicação web monolítica em MVC com Express, EJS renderizado no servidor, autenticação por sessão em cookie httpOnly, MySQL na nuvem (Aiven) e deploy no Render. Gerencia eventos acadêmicos/corporativos e as inscrições dos participantes.

Os tickets estão em `docs/tickets/`, numerados em ordem de dependência. Pegue um ticket por vez, do menor número para o maior, cada um com contexto limpo.

## Ordem e dependências

| # | Ticket | Bloqueado por | Entrega |
|---|---|---|---|
| 01 | [Esqueleto do projeto: Express + EJS + layout base](tickets/01-setup-projeto-express-ejs.md) | — | `npm start` sobe, `/` renderiza com o layout e o CSS do projeto, `/health` responde 200 |
| 02 | [Camada de banco: conexão, schema e seed](tickets/02-camada-banco-schema-seed.md) | 01 | `npm run db:setup` cria as tabelas e popula dados; conexão MySQL com SSL |
| 03 | [Models com prepared statements](tickets/03-models-prepared-statements.md) | 02 | Acesso a dados de usuários, eventos e inscrições, com a contagem de vagas restantes |
| 04 | [Autenticação e sessão](tickets/04-autenticacao-sessao.md) | 03 | Registrar, entrar e sair; sessão persistida no MySQL; `requireAuth` e `requireOrganizador` |
| 05 | [Eventos: lista pública, detalhes e CRUD](tickets/05-eventos-listagem-e-crud.md) | 04 | Home com busca, página de detalhes, painel do organizador e CRUD com regra de propriedade |
| 06 | [Inscrições: inscrever, cancelar e listas](tickets/06-inscricoes.md) | 05 | Inscrição com as três regras de recusa, cancelamento, minhas inscrições e lista de inscritos |
| 07 | [Segurança, tratamento de erros e documentação](tickets/07-seguranca-erros-documentacao.md) | 06 | Páginas 404 e 500, middleware de erro central, auditoria de segurança, JSDoc e README |
| 08 | [Preparação de deploy (Render + Aiven)](tickets/08-preparacao-deploy.md) | 07 | Código pronto para produção e `docs/DEPLOY.md` com o passo a passo real |

## Regras que valem para todos os tickets

- **Escopo fechado:** este repositório é só o EventHub MVC. Nada de API JSON (exceto `/health`), JWT, CORS ou referência a outro projeto.
- **Stack fixa:** Node + Express, EJS com `express-ejs-layouts`, `mysql2/promise`, `bcryptjs`, `express-session` com `express-mysql-session`, `dotenv`, `helmet`, `express-validator`, `method-override`. Sem framework de front-end e sem biblioteca de CSS.
- **SQL:** sempre `execute` com placeholders `?`. Concatenação de string em query é proibida.
- **Configuração:** nada hardcoded. `NODE_ENV`, `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL_CA` e `SESSION_SECRET` vêm de `process.env`.
- **Regras de negócio validadas no servidor**, nunca só escondendo botão na view.
- **Views:** dado vindo do usuário sempre com `<%= %>`, nunca `<%- %>`.
- **Visual:** tema claro, fundo `#f6f7f9`, cards brancos com borda `#e3e6ea` e raio de 10px, texto `#1f2933`, azul `#2563eb`, erro `#dc2626`, sucesso `#16a34a`, fonte `system-ui`, largura máxima de 1100px centralizada, uma coluna no mobile. Proibido roxo e fundo escuro.
- **Commits:** mensagem em português. **Não adicionar Claude como co-autor** — nenhum commit deste repositório deve conter trailer `Co-Authored-By`.

## Decisões assumidas

- O papel (organizador ou participante) é escolhido pelo próprio usuário no formulário de registro.
- Os usuários do seed têm uma senha de exemplo conhecida, documentada no README.
- Sem framework de testes automatizados: cada ticket traz um roteiro de verificação manual.
- A execução do deploy (contas Aiven e Render) fica com o autor; o ticket 08 entrega o código pronto e o passo a passo.
