# Deploy do EventHub — Aiven (MySQL) + Render (aplicação)

Passo a passo completo, na ordem. Ao final o EventHub está publicado em uma URL pública, com o banco na nuvem e a sessão sobrevivendo a reinícios.

Nenhum valor real aparece aqui: onde houver `<algo-assim>`, troque pelo valor do seu painel.

Tempo estimado: 30 a 40 minutos na primeira vez.

---

## 1. Criar o serviço MySQL na Aiven

1. Entre em [aiven.io](https://aiven.io) e crie a conta (o plano gratuito não pede cartão).
2. **Create service** → **MySQL**.
3. Escolha o plano **Free** e a região mais próxima (`aws-sa-east-1`, São Paulo, se estiver disponível).
4. Dê um nome ao serviço, por exemplo `eventhub-mysql`, e crie.
5. Espere o status sair de *Rebuilding* e virar **Running** — leva alguns minutos.
6. Na aba **Overview**, seção *Connection information*, anote:

   | Campo na tela da Aiven | Vai virar a variável |
   | --- | --- |
   | Host | `DB_HOST` |
   | Port | `DB_PORT` |
   | User | `DB_USER` (normalmente `avnadmin`) |
   | Password (botão *Show*) | `DB_PASSWORD` |

## 2. Criar o database `eventhub_db`

Na aba **Databases** do serviço, **Create database** com o nome `eventhub_db`.

O banco padrão `defaultdb` continua existindo; o EventHub não o usa.

> `npm run db:setup` também cria o database sozinho se ele não existir. Criar pela tela é mais rápido de conferir.

## 3. Baixar o certificado CA

A Aiven só aceita conexão cifrada, e a aplicação precisa do certificado que valida o servidor.

1. Ainda em *Connection information*, clique em **CA certificate** e baixe o arquivo (`ca.pem`).
2. Guarde-o **fora do repositório** — `*.pem` está no `.gitignore` de propósito.
3. Esse arquivo tem dois usos:
   - **Local:** `DB_SSL_CA` recebe o caminho do arquivo, ex.: `DB_SSL_CA=C:/certificados/ca.pem`.
   - **Render:** `DB_SSL_CA` recebe o **conteúdo** do arquivo, colado inteiro, do `-----BEGIN CERTIFICATE-----` ao `-----END CERTIFICATE-----`.

## 4. Aplicar `schema.sql` e `seed.sql` no banco da nuvem

Da sua máquina, com o `.env` local apontando temporariamente para a Aiven:

```env
DB_HOST=<host-da-aiven>
DB_PORT=<porta-da-aiven>
DB_USER=<usuario-da-aiven>
DB_PASSWORD=<senha-da-aiven>
DB_NAME=eventhub_db
DB_SSL_CA=<caminho/para/ca.pem>
```

```bash
npm run db:setup
```

A saída termina em `Banco pronto.`. Rodar de novo não duplica nada.

Confira na aba **Query editor** da Aiven (ou em qualquer cliente MySQL):

```sql
SHOW TABLES;                      -- usuarios, eventos, inscricoes
SELECT COUNT(*) FROM eventos;     -- 4
```

Depois, se quiser voltar a desenvolver contra o MySQL local, é só restaurar os valores locais no `.env` (com `DB_SSL_CA` vazio).

## 5. Criar o Web Service no Render

1. Entre em [render.com](https://render.com) e conecte a conta do GitHub.
2. **New +** → **Web Service** → escolha este repositório.
3. Preencha:

   | Campo | Valor |
   | --- | --- |
   | Name | `eventhub` |
   | Language / Runtime | `Node` |
   | Branch | `main` |
   | Build Command | `npm ci --omit=dev` |
   | Start Command | `npm start` |
   | Health Check Path | `/health` |
   | Instance Type | `Free` |

4. A versão do Node vem de `engines.node` no `package.json`. Para fixar uma versão exata, cadastre também a variável `NODE_VERSION` (ex.: `22`).
5. **Não** clique em *Deploy* ainda: cadastre as variáveis de ambiente primeiro (próximo passo). Sem elas a aplicação sobe e morre na hora, dizendo qual variável falta.

## 6. Cadastrar as variáveis de ambiente no Render

Em **Environment** → **Add Environment Variable**:

| Variável | De onde vem o valor |
| --- | --- |
| `NODE_ENV` | `production` — é o que liga o cookie `secure` e esconde o detalhe do erro na tela |
| `PORT` | **não cadastre**: o Render define esta variável sozinho |
| `DB_HOST` | *Host*, do passo 1 |
| `DB_PORT` | *Port*, do passo 1 |
| `DB_USER` | *User*, do passo 1 |
| `DB_PASSWORD` | *Password*, do passo 1 |
| `DB_NAME` | `eventhub_db` |
| `DB_SSL_CA` | o **conteúdo** do `ca.pem` do passo 3, colado inteiro |
| `SESSION_SECRET` | gere um valor novo, só para produção (abaixo) |

Gerando o `SESSION_SECRET` (não reaproveite o do seu `.env` local):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

## 7. Acompanhar o primeiro deploy

Abra a aba **Logs** e siga:

1. `npm ci --omit=dev` instala as dependências.
2. A aplicação sobe e imprime `EventHub no ar em http://localhost:<porta>` (é a porta interna do Render — a URL pública é a `onrender.com`).
3. O Render chama `/health`; quando responde 200 o serviço vira **Live**.

Abra `https://<seu-servico>.onrender.com/health` — deve retornar `"status":"ok"` e `"banco":"ok"`.

> No plano gratuito o serviço hiberna depois de um tempo sem acesso. O primeiro acesso seguinte demora ~30 segundos para acordar. Isso é do plano, não é erro.

---

## Solução de problemas

| Sintoma no log | Causa provável | O que fazer |
| --- | --- | --- |
| `Falha na inicializacao: Variaveis de ambiente obrigatorias ausentes: X` | Faltou cadastrar a variável no Render | Cadastre `X` e faça *Manual Deploy* |
| `self-signed certificate in certificate chain` / `unable to verify the first certificate` | `DB_SSL_CA` vazio, truncado ou com o certificado errado | Cole o `ca.pem` **inteiro**, incluindo as linhas `BEGIN`/`END`, sem espaços antes do `-----BEGIN` |
| `Nao foi possivel ler o certificado CA em DB_SSL_CA` | No Render foi colado um *caminho de arquivo* em vez do conteúdo | Cole o conteúdo do certificado |
| `ECONNREFUSED` ou `ETIMEDOUT` | Host ou porta errados, ou o serviço da Aiven ainda não está *Running* | Confira `DB_HOST` e `DB_PORT` (a Aiven **não** usa 3306) e espere o serviço subir |
| `ER_ACCESS_DENIED_ERROR` | Usuário ou senha errados | Copie de novo em *Connection information*; a senha costuma vir com caracteres que se perdem em cópia parcial |
| `ER_BAD_DB_ERROR: Unknown database 'eventhub_db'` | O passo 2 não foi feito | Crie o database, ou rode `npm run db:setup` apontando para a Aiven |
| Login funciona mas o usuário volta deslogado a cada clique | Cookie `secure` não está sendo gravado | Confirme `NODE_ENV=production` (a aplicação já liga `trust proxy`) e que você acessa por **https** |
| A sessão some a cada redeploy | A sessão estaria em memória | Não é o caso aqui: ela fica na tabela `sessions` do MySQL. Se sumir, veja se `DB_*` aponta mesmo para a Aiven |
| Deploy fica em *Deploying* e depois falha | Healthcheck não passou | Abra `/health`: se vier `"banco":"indisponivel"`, o problema é o banco, não a aplicação |
| `EADDRINUSE` ou o Render não detecta a porta | Alguém cadastrou `PORT` na mão | Remova a variável `PORT`: quem define é o Render |

---

## Checklist de validação em produção

Com o serviço **Live**, na URL pública:

- [ ] `/health` responde 200 com `"banco":"ok"`
- [ ] A home lista os eventos do seed
- [ ] Registrar uma conta de **organizador** funciona
- [ ] O organizador cria um evento e ele aparece na home
- [ ] Registrar uma conta de **participante** (outro navegador ou janela anônima) funciona
- [ ] O participante se inscreve no evento e a contagem de vagas cai
- [ ] O participante cancela a inscrição e a vaga volta
- [ ] `/minhas-inscricoes` mostra as inscrições do participante
- [ ] `/eventos/<id>/inscritos` mostra a lista para o organizador dono e responde 403 para os outros
- [ ] Fazer um *Manual Deploy* e conferir que o usuário **continua logado** depois que o serviço volta
- [ ] Abrir uma URL inexistente (`/pagina-que-nao-existe`) — página 404 com o layout do site
- [ ] Nenhuma tela de erro mostra stack, nome de tabela ou dado de conexão

Passou tudo? Preencha o campo **Deploy** no `README.md` com a URL de produção.
