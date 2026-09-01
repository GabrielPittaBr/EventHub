# 05 — Eventos: lista pública, detalhes e CRUD do organizador

**O que construir:** o núcleo do sistema. Qualquer visitante abre a home, vê os eventos futuros, busca por título e abre a página de detalhes com vagas restantes. O organizador logado tem um painel com os próprios eventos e cria, edita e exclui eventos por formulários validados — e só consegue mexer nos eventos que ele mesmo criou, mesmo forjando a requisição.

**Bloqueado por:** 04 — Autenticação e sessão.

**Status:** ready-for-agent

## Critérios de aceitação

### Telas públicas

- [ ] `GET /` lista apenas eventos com `data_inicio` no futuro, ordenados pela data de início, em cards com título, local, data e vagas.
- [ ] A home tem busca por título via query string; o termo pesquisado continua no campo depois da busca, e uma busca sem resultado mostra um estado vazio amigável (não uma página em branco).
- [ ] `GET /eventos/:id` mostra título, descrição, local, datas formatadas, nome do organizador, vagas totais e **vagas restantes calculadas por `COUNT` das inscrições confirmadas**.
- [ ] Id inexistente ou inválido leva à página de não encontrado, não a um erro 500.

### Painel e CRUD do organizador

- [ ] `GET /painel` (exige login e papel organizador) lista os eventos do organizador logado, com acesso a editar, excluir e ver inscritos.
- [ ] `GET /eventos/novo` e `POST /eventos` criam evento vinculado ao organizador da sessão — o `organizador_id` **nunca** vem do formulário.
- [ ] `GET /eventos/:id/editar` e a atualização via `PUT` (com `method-override`) alteram o evento.
- [ ] Exclusão via `DELETE` (com `method-override`), com confirmação antes de apagar.
- [ ] Validação no servidor com `express-validator`: título obrigatório com tamanho mínimo, descrição, local, `data_inicio` e `data_fim` válidas, `data_fim` posterior a `data_inicio`, e `vagas` inteiro maior que zero. Erros exibidos **por campo**, com os valores digitados repopulados.
- [ ] Regra de propriedade verificada no servidor em editar, atualizar e excluir, comparando o `organizador_id` do evento com o usuário da sessão. Esconder o botão na view não conta.
- [ ] Participante logado que tenta abrir `/painel`, `/eventos/novo` ou editar um evento recebe 403 — o mesmo vale para um organizador que tenta editar evento de outro.
- [ ] Todos os controllers com `try/catch`, encaminhando o erro para o middleware central.
- [ ] Todas as telas estilizadas com o design system e responsivas em uma coluna no mobile.
- [ ] Nas views, dado vindo do usuário é sempre escapado com `<%= %>`.

## Verificação manual

1. Deslogado, abrir a home — os eventos futuros do seed aparecem e o evento encerrado não.
2. Buscar por parte de um título — a lista filtra e o termo continua no campo. Buscar por algo inexistente — estado vazio.
3. Abrir um evento — a página mostra as vagas restantes corretas.
4. Logar como organizador, criar um evento — aparece na home e no painel.
5. Enviar o formulário com `data_fim` antes de `data_inicio` e `vagas = 0` — os dois erros aparecem nos campos certos, sem perder o que já foi digitado.
6. Editar e depois excluir o próprio evento — some da home e do painel.
7. Logar com o segundo organizador (ou criar outro) e tentar abrir a edição de um evento alheio pela URL — 403.
8. Enviar um `PUT` forjado para um evento alheio por `curl` ou pelo DevTools — 403, e o evento continua intacto.
9. Logado como participante, tentar abrir `/painel` — 403.

## Commit

Mensagem em português, curta e descritiva. **Não adicionar Claude como co-autor** — sem trailer `Co-Authored-By`.
