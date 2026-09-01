# 04 — Autenticação e sessão

**O que construir:** o fluxo completo de conta. Um visitante se registra escolhendo o papel (organizador ou participante), faz login e passa a ver o próprio nome no header com a navegação adequada ao papel; ao sair, a sessão é encerrada. A sessão fica guardada no MySQL, então continua válida mesmo depois de o processo reiniciar (o Render reinicia com frequência).

**Bloqueado por:** 03 — Models.

**Status:** ready-for-agent

## Critérios de aceitação

- [ ] `express-session` configurado com store `express-mysql-session` apontando para o mesmo banco, para a sessão sobreviver ao reinício do processo.
- [ ] Cookie de sessão com `httpOnly: true`, `sameSite: 'lax'`, `secure: true` quando `NODE_ENV=production`, e tempo de expiração definido.
- [ ] `SESSION_SECRET` vem de `process.env`, sem segredo hardcoded como fallback em produção.
- [ ] `GET /auth/registrar` mostra o formulário com nome, e-mail, senha, confirmação de senha e escolha do papel (organizador ou participante). `POST /auth/registrar` cria a conta e já deixa o usuário logado.
- [ ] `GET /auth/login` e `POST /auth/login` autenticam por e-mail e senha; credencial inválida devolve mensagem genérica (sem revelar se o e-mail existe).
- [ ] `POST /auth/logout` encerra a sessão e volta para a home.
- [ ] Senha gravada com `bcryptjs` de custo 10. Senha em texto puro nunca aparece no banco, em log ou em uma view.
- [ ] Validação com `express-validator` em ambos os formulários: campos obrigatórios, e-mail válido e normalizado, senha com tamanho mínimo, confirmação conferindo, papel dentro do ENUM. Erros exibidos **por campo**, com os valores digitados repopulados (menos as senhas).
- [ ] E-mail já cadastrado vira erro de campo no formulário, não erro 500.
- [ ] O usuário logado fica disponível para todas as views, e a navegação do layout muda conforme o estado: visitante vê Entrar e Registrar; organizador vê Painel; participante vê Minhas inscrições; ambos veem Sair.
- [ ] Mensagens flash implementadas sobre a própria sessão (sem biblioteca extra), exibidas na área reservada do layout e limpas depois de exibidas.
- [ ] Middlewares `requireAuth` e `requireOrganizador` criados em `src/middlewares`, prontos para os próximos tickets: sem sessão, redireciona para o login com mensagem; com papel errado, responde 403.
- [ ] Telas de login e registro estilizadas com o design system, dentro de card branco e responsivas.
- [ ] Controllers com `try/catch`, encaminhando o erro adiante em vez de engolir.

## Verificação manual

1. Registrar um organizador — cai logado, com o nome no header e o link do Painel visível.
2. Sair, e registrar um participante — a navegação mostra Minhas inscrições em vez de Painel.
3. Tentar registrar de novo com o mesmo e-mail — erro exibido no campo de e-mail, sem página de erro.
4. Enviar o formulário com senha curta e confirmação diferente — cada erro aparece embaixo do seu campo, e os demais valores continuam preenchidos.
5. Login com senha errada — mensagem genérica de credencial inválida.
6. Logado, reiniciar o servidor e recarregar a página — continua logado (a sessão está no banco).
7. Conferir o cookie no DevTools — marcado como HttpOnly.
8. Conferir na tabela `usuarios` que a senha está em hash.

## Commit

Mensagem em português, curta e descritiva. **Não adicionar Claude como co-autor** — sem trailer `Co-Authored-By`.
