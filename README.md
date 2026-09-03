# EventHub

Aplicação web para cadastro de eventos acadêmicos/corporativos e controle de inscrições, feita para a disciplina de Criação de Sites na ETE Monteiro Lobato.

Organizadores criam e administram eventos e veem a lista de inscritos; participantes se inscrevem, cancelam e acompanham as próprias inscrições. Toda a interface é renderizada no servidor.

**Deploy:** (https://eventhub-pwqh.onrender.com/)

## Stack

- Node.js + Express 5, arquitetura MVC
- EJS + express-ejs-layouts para as views
- MySQL 8 via `mysql2` (sempre com prepared statements)
- `express-session` com sessões gravadas no MySQL (`express-mysql-session`)
- `bcryptjs` para as senhas, `express-validator` para a entrada, `helmet` para os cabeçalhos

## Pré-requisitos

- Node.js 20 ou superior
- Um MySQL 8 acessível — o serviço local instalado na sua máquina ou um banco na nuvem (Aiven)

## Como rodar localmente

```bash
git clone <url-do-repositorio>
cd EventHub
npm install
cp .env.example .env    # no Windows: copy .env.example .env
```

Preencha o `.env` (veja a tabela abaixo) e prepare o banco:

```bash
npm run db:setup    # cria o database, as tabelas e os dados de exemplo
npm start           # http://localhost:3000
npm run dev         # o mesmo, reiniciando a cada alteração
```

`npm run db:setup` pode ser executado quantas vezes for preciso: o schema usa `CREATE TABLE IF NOT EXISTS` e o seed reaplica as mesmas linhas em vez de duplicá-las.

## Usuários de exemplo

Criados por `db/seed.sql`, todos com a senha **`Senha@123`**:

| E-mail | Papel |
| --- | --- |
| `ana.organizadora@eventhub.dev` | organizador |
| `bruno.participante@eventhub.dev` | participante |
| `carla.participante@eventhub.dev` | participante |

## Variáveis de ambiente

Nenhuma credencial fica no código: tudo vem do ambiente. O `.env` não é versionado — use o `.env.example` como modelo.

| Variável | Para que serve | Exemplo | Obrigatória |
| --- | --- | --- | --- |
| `NODE_ENV` | Modo de execução. Em `production` o cookie de sessão exige HTTPS e a tela de erro não mostra detalhe técnico. | `development` | Não (padrão: `development`) |
| `PORT` | Porta HTTP. No Render a plataforma define esta variável sozinha. | `3000` | Não (padrão: `3000`) |
| `DB_HOST` | Host do MySQL. | `127.0.0.1` | Sim |
| `DB_PORT` | Porta do MySQL. | `3306` | Sim |
| `DB_USER` | Usuário do banco. | `root` | Sim |
| `DB_PASSWORD` | Senha do banco. | `sua-senha` | Sim |
| `DB_NAME` | Nome do database; criado pelo `npm run db:setup` se não existir. | `eventhub_db` | Sim |
| `DB_SSL_CA` | Certificado CA para conexão cifrada: o caminho de um arquivo `.pem` ou o conteúdo do certificado colado. Vazio conecta sem TLS. | `./aiven-ca.pem` | Só na nuvem (a Aiven exige) — deixe vazio no MySQL local |
| `SESSION_SECRET` | Segredo que assina o cookie de sessão. Use um valor longo e aleatório, diferente do de produção. | `openssl rand -base64 48` | Sim |

## Estrutura

```
db/       schema.sql e seed.sql
docs/     tickets do projeto e DEPLOY.md
public/   CSS e arquivos estáticos
scripts/  db-setup.js
src/      config, controllers, helpers, middlewares, models, routes
views/    templates EJS
```

## Deploy

O passo a passo completo (Aiven + Render) está em [`docs/DEPLOY.md`](docs/DEPLOY.md).
