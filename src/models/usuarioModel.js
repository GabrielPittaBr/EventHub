'use strict';

const { pool } = require('../config/banco');

/**
 * Insere um novo usuario.
 * Recebe a senha ja com hash: gerar o hash e responsabilidade do controller,
 * o model nunca recebe a senha em texto puro.
 *
 * @async
 * @param {object} dados Dados do usuario.
 * @param {string} dados.nome Nome completo.
 * @param {string} dados.email E-mail, unico na tabela.
 * @param {string} dados.senhaHash Hash bcrypt da senha.
 * @param {'organizador'|'participante'} dados.papel Papel escolhido no registro.
 * @returns {Promise<number>} Id do usuario criado.
 * @throws {Error} Quando o banco recusa a insercao (e-mail duplicado, por exemplo).
 */
async function criar({ nome, email, senhaHash, papel }) {
  const [resultado] = await pool.execute(
    'INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (?, ?, ?, ?)',
    [nome, email, senhaHash, papel]
  );

  return resultado.insertId;
}

/**
 * Busca um usuario pelo e-mail. E a unica consulta que devolve a `senha_hash`,
 * porque o login precisa dela para conferir a senha informada.
 *
 * @async
 * @param {string} email E-mail informado no formulario.
 * @returns {Promise<object|null>} Usuario encontrado ou null.
 * @throws {Error} Quando a consulta falha.
 */
async function buscarPorEmail(email) {
  const [linhas] = await pool.execute(
    'SELECT id, nome, email, senha_hash, papel, criado_em FROM usuarios WHERE email = ? LIMIT 1',
    [email]
  );

  return linhas[0] || null;
}

/**
 * Busca um usuario pelo id, sem trazer a senha.
 *
 * @async
 * @param {number} id Identificador do usuario.
 * @returns {Promise<object|null>} Usuario encontrado ou null.
 * @throws {Error} Quando a consulta falha.
 */
async function buscarPorId(id) {
  const [linhas] = await pool.execute(
    'SELECT id, nome, email, papel, criado_em FROM usuarios WHERE id = ? LIMIT 1',
    [id]
  );

  return linhas[0] || null;
}

module.exports = { criar, buscarPorEmail, buscarPorId };
