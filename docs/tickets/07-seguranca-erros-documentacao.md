# 07 — Segurança, tratamento de erros e documentação

**O que construir:** o acabamento que faz a aplicação ser entregável. URL inexistente cai numa página 404 amigável; qualquer exceção não tratada cai numa página 500 amigável, com o stack apenas no log do servidor e nunca na tela em produção. Junto vai a auditoria de segurança do que já foi construído, o JSDoc dos controllers e o README completo.

**Bloqueado por:** 06 — Inscrições.

**Status:** ready-for-agent

## Critérios de aceitação

### Erros

- [ ] Middleware de 404 registrado depois de todas as rotas, renderizando uma página com o layout do site e link de volta para a home.
- [ ] Middleware de erro central (assinatura de quatro parâmetros) registrado por último: loga o stack completo no servidor e renderiza uma página 500 amigável.
- [ ] Em produção a tela nunca mostra stack, mensagem interna nem detalhe de banco; em desenvolvimento pode mostrar o detalhe para depuração.
- [ ] As respostas 403 dos tickets anteriores usam uma página de erro com o layout do site, não texto cru.

### Auditoria de segurança

- [ ] Todo controller está dentro de `try/catch` e encaminha o erro para o middleware central.
- [ ] Nenhuma view usa `<%- %>` para dado vindo do usuário — varrer todas as views e confirmar.
- [ ] Nenhuma query montada por concatenação ou template string com valor interpolado — varrer todos os models e confirmar que só existe `execute` com `?`.
- [ ] Nenhum segredo, host, usuário ou senha hardcoded: tudo vem de `process.env`. `.env` não está versionado e nunca esteve no histórico do Git.
- [ ] `helmet` ativo e o CSS/JS próprio continua carregando (ajustar a política se algo for bloqueado).
- [ ] Cookie de sessão confirmado com `httpOnly`, `sameSite: 'lax'` e `secure` em produção, com `trust proxy` ligado.
- [ ] Todo input passa por validação e sanitização do `express-validator`.

### Documentação

- [ ] JSDoc completo em **todos** os métodos dos controllers, com `@async`, `@param`, `@returns` e `@throws`, descrevendo o que o método faz e o que renderiza ou para onde redireciona.
- [ ] `README.md` com: descrição do projeto, stack, pré-requisitos, `npm install`, como rodar local, como popular o banco com `npm run db:setup`, credenciais dos usuários de exemplo do seed, tabela-dicionário de **todas** as variáveis de ambiente (nome, para que serve, exemplo, obrigatória ou não) e espaço para o link do deploy.
- [ ] `.env.example` conferido e igual ao conjunto de variáveis realmente usado pelo código.

## Verificação manual

1. Acessar uma URL inexistente — página 404 com o layout do site.
2. Provocar um erro de propósito em um controller (ex.: derrubar o banco) — a tela mostra a página 500 amigável e o terminal mostra o stack completo.
3. Rodar com `NODE_ENV=production` e repetir — nenhum detalhe técnico aparece na tela.
4. Buscar por `<%-` nas views — nenhuma ocorrência com dado de usuário.
5. Buscar por `SELECT`, `INSERT`, `UPDATE` e `DELETE` no código — todas com `?`, nenhuma com valor interpolado.
6. Buscar por senha, host e usuário do banco no código — nenhuma ocorrência fora de `process.env`.
7. Ler o README seguindo o passo a passo do zero, como se fosse outra pessoa, e conferir que a aplicação sobe.

## Commit

Mensagem em português, curta e descritiva. **Não adicionar Claude como co-autor** — sem trailer `Co-Authored-By`.
