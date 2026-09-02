'use strict';

const fs = require('fs');
const path = require('path');

const mysql = require('mysql2/promise');

const ambiente = require('./ambiente');

const LIMITE_DE_CONEXOES = 10;
const INICIO_DO_CERTIFICADO = '-----BEGIN';

// Sem as credenciais nao ha pool possivel: falha aqui, com o nome da variavel.
// A checagem se repete porque este modulo tem duas portas de entrada: o
// servidor (que ja valida em server.js, para morrer antes de subir o Express) e
// o script `npm run db:setup`, que nunca passa por server.js. Validar aqui
// garante a mesma mensagem clara nos dois caminhos.
ambiente.validar();

/**
 * Resolve o certificado CA aceitando as duas formas que o valor pode ter:
 * o caminho de um arquivo `.pem` (pratico no ambiente local) ou o conteudo do
 * certificado colado direto na variavel (pratico no Render, que nao recebe
 * upload de arquivo). Quando colado em uma linha so, as quebras chegam como a
 * sequencia literal `\n` e precisam ser restauradas.
 *
 * @param {string} valor Conteudo da variavel `DB_SSL_CA`.
 * @returns {string} Certificado CA em formato PEM.
 * @throws {Error} Quando o valor aponta para um arquivo que nao pode ser lido.
 */
function resolverCertificado(valor) {
  const conteudo = valor.trim().replace(/\\n/g, '\n');

  if (conteudo.startsWith(INICIO_DO_CERTIFICADO)) {
    return conteudo;
  }

  const caminho = path.isAbsolute(conteudo)
    ? conteudo
    : path.join(__dirname, '..', '..', conteudo);

  try {
    return fs.readFileSync(caminho, 'utf8');
  } catch (erro) {
    throw new Error(
      `Nao foi possivel ler o certificado CA em DB_SSL_CA ("${conteudo}"): ${erro.message}. ` +
        'Informe o caminho de um arquivo .pem existente ou cole o conteudo do certificado na variavel.'
    );
  }
}

/**
 * Opcoes de conexao montadas a partir do ambiente. Ficam separadas do pool
 * para que o script de setup possa reaproveita-las.
 * @type {import('mysql2/promise').PoolOptions}
 */
const opcoesDeConexao = {
  host: ambiente.banco.host,
  port: ambiente.banco.porta,
  user: ambiente.banco.usuario,
  password: ambiente.banco.senha,
  database: ambiente.banco.nome,
  // A Aiven so aceita conexao cifrada: o CA valida o certificado do servidor.
  ssl: { ca: resolverCertificado(ambiente.banco.sslCa) },
};

const pool = mysql.createPool({
  ...opcoesDeConexao,
  waitForConnections: true,
  connectionLimit: LIMITE_DE_CONEXOES,
  queueLimit: 0,
});

/**
 * Executa uma consulta trivial para confirmar que o banco responde.
 * Usado pelo healthcheck, que nao deve dizer "ok" so porque o processo subiu.
 *
 * @async
 * @returns {Promise<void>} Resolve quando o banco responde.
 * @throws {Error} Quando a conexao ou a consulta falha.
 */
async function verificarConexao() {
  await pool.execute('SELECT 1');
}

module.exports = { pool, opcoesDeConexao, verificarConexao };
