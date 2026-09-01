# 03 — Models com prepared statements

**O que construir:** a camada de acesso a dados completa, cobrindo tudo que as telas vão precisar: usuários, eventos (com busca por título e listagem por organizador) e inscrições (incluindo a contagem que gera as vagas restantes). Toda consulta usa prepared statement com placeholders `?`.

**Bloqueado por:** 02 — Camada de banco.

**Status:** ready-for-agent

## Critérios de aceitação

- [ ] Model de usuário em `src/models`: criar usuário, buscar por e-mail e buscar por id.
- [ ] Model de evento: listar eventos futuros com filtro opcional por título, buscar evento por id trazendo o nome do organizador, listar eventos de um organizador, criar, atualizar e excluir.
- [ ] Model de inscrição: criar inscrição, buscar a inscrição de um usuário em um evento, contar inscrições **confirmadas** de um evento, listar inscrições de um usuário, listar inscritos de um evento e cancelar inscrição.
- [ ] As vagas restantes de um evento são derivadas de `COUNT` das inscrições com status `confirmada` — nunca de um contador guardado na tabela de eventos.
- [ ] **Toda** consulta usa `execute` com placeholders `?`. Inclusive a busca por título: o `LIKE` recebe `?` e os `%` são montados no JavaScript. Nenhuma interpolação de valor dentro da string SQL.
- [ ] Os models apenas acessam dados; as decisões de negócio (quem pode o quê, se o evento está lotado) ficam nos controllers.
- [ ] Nenhum model importa Express nem conhece `req`/`res`.

## Verificação manual

Com o banco populado pelo seed, chamar as funções a partir de um script pontual em Node (arquivo temporário fora do repositório ou `node -e`) e conferir:

1. Listar eventos futuros retorna apenas eventos com `data_inicio` no futuro — o evento encerrado do seed **não** aparece.
2. Buscar por um trecho do título de um evento do seed retorna aquele evento; buscar por um `%` literal não devolve a base inteira.
3. Buscar evento por id traz o nome do organizador junto.
4. A contagem de inscrições confirmadas de um evento bate com o que está na tabela `inscricoes`.
5. Uma busca por texto nos models não encontra nenhuma query montada com concatenação ou com template string interpolando valor.

## Commit

Mensagem em português, curta e descritiva. **Não adicionar Claude como co-autor** — sem trailer `Co-Authored-By`.
