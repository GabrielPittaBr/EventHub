# 06 — Inscrições: inscrever, cancelar e listas

**O que construir:** o fluxo do participante. Na página de um evento futuro com vaga, ele se inscreve com um clique e passa a ver a inscrição em Minhas inscrições; pode cancelar, o que libera a vaga de volta. O sistema recusa inscrição duplicada, evento lotado e evento com data de início já passada. O organizador dono do evento consegue ver a lista de inscritos.

**Bloqueado por:** 05 — Eventos.

**Status:** ready-for-agent

## Critérios de aceitação

### Inscrição

- [ ] Na página de detalhes, o participante logado vê o botão de inscrição; visitante deslogado vê um convite para entrar.
- [ ] Inscrever cria a inscrição com status `confirmada` para o usuário da sessão — o `usuario_id` **nunca** vem do formulário.
- [ ] Inscrição recusada, cada caso com sua mensagem flash específica:
  - já existe inscrição confirmada do mesmo usuário no mesmo evento;
  - o evento está lotado (confirmadas maiores ou iguais às vagas);
  - a `data_inicio` do evento já passou.
- [ ] Quem já cancelou pode se inscrever de novo: a inscrição existente volta a `confirmada`, respeitando a chave única (`evento_id`, `usuario_id`) em vez de tentar inserir uma linha duplicada.
- [ ] A checagem de lotação e a gravação acontecem dentro de uma transação, e o erro de chave única é tratado como "já inscrito" — dois cliques rápidos não estouram as vagas nem geram página de erro.

### Cancelamento e listas

- [ ] O participante cancela a própria inscrição (status vira `cancelada`) e a vaga volta a ficar disponível na contagem do evento.
- [ ] Tentar cancelar a inscrição de outra pessoa responde 403, verificado no servidor.
- [ ] `GET /minhas-inscricoes` (exige login) lista as inscrições do usuário logado com evento, data, status e link para o evento; estado vazio amigável quando não houver nenhuma.
- [ ] `GET /eventos/:id/inscritos` mostra nome, e-mail, status e data de inscrição — **apenas** para o organizador dono do evento; qualquer outro usuário recebe 403.
- [ ] Todos os controllers com `try/catch`, encaminhando o erro adiante; telas estilizadas com o design system e responsivas; dado do usuário sempre escapado com `<%= %>`.

## Verificação manual

1. Logado como participante, inscrever-se em um evento futuro — mensagem de sucesso e as vagas restantes caem em 1.
2. Tentar se inscrever de novo no mesmo evento — mensagem de já inscrito, sem criar segunda linha na tabela.
3. Criar um evento com 1 vaga, ocupá-la com um participante e tentar inscrever o segundo — mensagem de evento lotado.
4. Tentar se inscrever no evento já encerrado do seed (pela URL, já que ele não aparece na home) — recusado por data.
5. Cancelar a inscrição — status muda para cancelada e as vagas restantes voltam a subir.
6. Inscrever-se de novo no mesmo evento depois de cancelar — funciona.
7. Abrir `/minhas-inscricoes` — mostra as inscrições com o status correto.
8. Como organizador dono, abrir a lista de inscritos — os participantes aparecem. Como outro usuário, abrir a mesma URL — 403.
9. Forjar um cancelamento da inscrição de outro usuário por `curl` — 403, e a inscrição continua confirmada.

## Commit

Mensagem em português, curta e descritiva. **Não adicionar Claude como co-autor** — sem trailer `Co-Authored-By`.
