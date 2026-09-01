# 02 — Camada de banco: conexão MySQL, schema e seed

**O que construir:** com as credenciais no `.env`, rodar `npm run db:setup` cria as três tabelas do `eventhub_db` e popula dados de exemplo. A aplicação passa a abrir conexão com o MySQL na nuvem usando SSL/TLS, e `/health` só responde 200 se o banco realmente responder.

**Bloqueado por:** 01 — Esqueleto do projeto.

**Status:** ready-for-agent

## Critérios de aceitação

- [ ] Módulo de conexão em `src/config` exporta um pool `mysql2/promise` montado a partir de `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`.
- [ ] SSL/TLS habilitado a partir de `DB_SSL_CA` (a Aiven exige). Aceitar tanto o caminho de um arquivo `.pem` local quanto o conteúdo do certificado colado direto na variável, porque no Render colar o PEM é mais prático do que subir arquivo.
- [ ] Se faltar uma variável obrigatória, a aplicação falha na inicialização com mensagem clara dizendo qual variável está ausente — nunca com um erro genérico de conexão.
- [ ] `db/schema.sql` cria as três tabelas e é seguro rodar mais de uma vez:
  - `usuarios`: `id` PK AI, `nome`, `email` UNIQUE, `senha_hash`, `papel` ENUM('organizador','participante'), `criado_em`.
  - `eventos`: `id` PK AI, `titulo`, `descricao` TEXT, `local`, `data_inicio` DATETIME, `data_fim` DATETIME, `vagas` INT, `organizador_id` FK para `usuarios.id`, `criado_em`.
  - `inscricoes`: `id` PK AI, `evento_id` FK, `usuario_id` FK, `status` ENUM('confirmada','cancelada'), `criado_em`, UNIQUE (`evento_id`, `usuario_id`).
- [ ] `db/seed.sql` popula pelo menos: 1 organizador, 2 participantes, 3 eventos futuros com quantidades de vagas diferentes e 1 evento já encerrado (para testar a regra de data no ticket 06). As senhas entram como hash bcrypt de custo 10 — **nunca em texto puro**.
- [ ] A senha de exemplo dos usuários do seed fica registrada para uso em testes (vai para o README no ticket 07).
- [ ] `npm run db:setup` aplica `schema.sql` e depois `seed.sql`, e pode ser executado novamente sem quebrar nem duplicar dados.
- [ ] `GET /health` passa a executar uma consulta trivial no banco e responde com status de erro se a conexão falhar.
- [ ] Nenhuma credencial no código e nenhuma query montada por concatenação de strings.

## Verificação manual

1. Preencher o `.env` local a partir do `.env.example`.
2. `npm run db:setup` — cria as tabelas e insere os dados; rodar de novo não quebra.
3. Conferir no cliente MySQL: `SHOW TABLES` e um `SELECT` em cada tabela, com `senha_hash` começando em `$2`.
4. `npm start` e `curl /health` — responde 200.
5. Trocar `DB_PASSWORD` por um valor errado e reiniciar — `/health` acusa falha e o log do servidor mostra o erro.

## Commit

Mensagem em português, curta e descritiva. **Não adicionar Claude como co-autor** — sem trailer `Co-Authored-By`.
