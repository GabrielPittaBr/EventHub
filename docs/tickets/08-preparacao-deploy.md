# 08 — Preparação de deploy (Render + Aiven MySQL)

**O que construir:** deixar o repositório pronto para publicar e escrever o passo a passo real do deploy. Ao final, alguém que nunca viu o projeto consegue seguir o `docs/DEPLOY.md`, criar o banco na Aiven, publicar o Web Service no Render e validar o fluxo completo em produção.

**Bloqueado por:** 07 — Segurança, erros e documentação.

**Status:** ready-for-agent

## Critérios de aceitação

### Preparação do código

- [ ] `package.json` com `engines.node` na versão que o Render usa e script `start` rodando a aplicação direto pelo Node, sem nodemon nem dependência de `devDependencies`.
- [ ] A porta vem de `process.env.PORT` sem valor fixo em produção, e `trust proxy` está ligado para o cookie `secure` funcionar atrás do proxy do Render.
- [ ] `/health` responde rápido, sem exigir sessão, e serve como healthcheck do Render.
- [ ] A store de sessão em MySQL cria a própria tabela na primeira execução em produção (ou o `schema.sql` já a contempla), para o deploy não quebrar no primeiro acesso.
- [ ] A conexão SSL funciona com o certificado da Aiven vindo pela variável de ambiente, sem arquivo `.pem` versionado.

### docs/DEPLOY.md

- [ ] Passo a passo real, na ordem, com o que preencher em cada tela:
  1. criar o serviço MySQL na Aiven e anotar host, porta, usuário e senha;
  2. criar o database `eventhub_db`;
  3. baixar o certificado CA e transformá-lo no valor de `DB_SSL_CA`;
  4. aplicar `schema.sql` e `seed.sql` no banco da nuvem;
  5. criar o Web Service no Render apontando para este repositório, com build e start commands;
  6. cadastrar todas as variáveis de ambiente no Render (tabela com nome e de onde tirar o valor, incluindo gerar um `SESSION_SECRET` forte);
  7. acompanhar o log do primeiro deploy e validar.
- [ ] Seção de solução de problemas com os erros mais prováveis: falha de SSL no MySQL, `ECONNREFUSED`, sessão que não persiste, cookie que não é gravado por falta de `trust proxy`, e healthcheck falhando.
- [ ] Checklist de validação em produção: registrar organizador, criar evento, registrar participante, inscrever, cancelar, conferir que continua logado depois de um redeploy, e conferir 404 e 500 amigáveis.
- [ ] Nenhuma credencial real dentro do `DEPLOY.md` — só placeholders.
- [ ] `README.md` com o campo do link do deploy pronto para receber a URL de produção.

## Verificação manual

1. Simular o ambiente de produção localmente com `NODE_ENV=production` apontando para o banco da nuvem — a aplicação sobe, o cookie sai como `secure` e a sessão persiste.
2. Conferir que `npm ci --omit=dev` seguido de `npm start` funciona (é o que o Render faz).
3. Pedir para alguém ler o `docs/DEPLOY.md` e apontar qualquer passo ambíguo.
4. Depois do deploy publicado, rodar o checklist de validação em produção e preencher o link no README.

## Fora de escopo

A execução do deploy em si (criar as contas Aiven e Render e apertar os botões) fica com o autor do projeto — este ticket entrega o código pronto e o passo a passo.

## Commit

Mensagem em português, curta e descritiva. **Não adicionar Claude como co-autor** — sem trailer `Co-Authored-By`.
