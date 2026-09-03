'use strict';

const fs = require('fs/promises');
const path = require('path');

const mysql = require('mysql2/promise');

const PASTA_SQL = path.join(__dirname, '..', 'db');
const ARQUIVOS = ['schema.sql', 'seed.sql'];

/**
 * Aplica um arquivo `.sql` na conexao aberta.
 *
 * @async
 * @param {import('mysql2/promise').Connection} conexao Conexao ja aberta com o banco.
 * @param {string} arquivo Nome do arquivo dentro da pasta `db/`.
 * @returns {Promise<void>} Resolve quando o arquivo terminou de ser aplicado.
 * @throws {Error} Quando o arquivo nao pode ser lido ou o SQL falha.
 */
async function aplicarArquivo(conexao, arquivo) {
  const sql = await fs.readFile(path.join(PASTA_SQL, arquivo), 'utf8');
  await conexao.query(sql);
  console.log(`  ${arquivo} aplicado.`);
}

/**
 * Cria as tabelas e popula os dados de exemplo do EventHub.
 * Pode ser executado quantas vezes for preciso: o schema usa
 * `CREATE TABLE IF NOT EXISTS` e o seed reaplica as mesmas linhas.
 *
 * @async
 * @returns {Promise<void>} Resolve quando schema e seed foram aplicados.
 * @throws {Error} Quando falta configuracao ou o banco recusa a operacao.
 */
async function executar() {
  // Aqui dentro para a falta de variavel cair no catch, como mensagem.
  const { opcoesDeConexao } = require('../src/config/banco');

  console.log(`Preparando o banco ${opcoesDeConexao.database} em ${opcoesDeConexao.host}...`);

  // multipleStatements so aqui, para aplicar o .sql inteiro; o pool da
  // aplicacao nao usa esta opcao. Conecta sem banco: ele pode nao existir ainda.
  const { database, ...semBanco } = opcoesDeConexao;
  const conexao = await mysql.createConnection({
    ...semBanco,
    multipleStatements: true,
  });

  // DB_NAME e configuracao, nao entrada de usuario: identificador nao aceita ?.
  await conexao.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conexao.changeUser({ database });

  try {
    for (const arquivo of ARQUIVOS) {
      await aplicarArquivo(conexao, arquivo);
    }
  } finally {
    await conexao.end();
  }

  console.log('Banco pronto. Senha de exemplo dos usuarios do seed: Senha@123');
}

executar()
  .then(() => process.exit(0))
  .catch((erro) => {
    console.error(`Falha ao preparar o banco: ${erro.message}`);
    process.exit(1);
  });
