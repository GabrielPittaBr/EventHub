'use strict';

const { pool } = require('../config/banco');

/**
 * Registra a inscricao de um usuario em um evento.
 *
 * O schema tem UNIQUE (evento_id, usuario_id), entao quem cancelou e se
 * inscreve de novo reaproveita a mesma linha em vez de criar outra. O
 * `LAST_INSERT_ID(id)` faz o banco devolver o id da linha tanto na insercao
 * quanto na reativacao. Se a inscricao e permitida (evento lotado, prazo,
 * papel do usuario) e decisao do controller.
 *
 * @async
 * @param {number} eventoId Id do evento.
 * @param {number} usuarioId Id do participante.
 * @returns {Promise<number>} Id da inscricao criada ou reativada.
 * @throws {Error} Quando o banco recusa a operacao.
 */
async function criar(eventoId, usuarioId) {
  const [resultado] = await pool.execute(
    `INSERT INTO inscricoes (evento_id, usuario_id, status)
     VALUES (?, ?, 'confirmada')
     ON DUPLICATE KEY UPDATE status = 'confirmada', id = LAST_INSERT_ID(id)`,
    [eventoId, usuarioId]
  );

  return resultado.insertId;
}

/**
 * Busca a inscricao de um usuario em um evento, confirmada ou cancelada.
 * O controller usa o `status` para decidir o que oferecer na tela.
 *
 * @async
 * @param {number} eventoId Id do evento.
 * @param {number} usuarioId Id do participante.
 * @returns {Promise<object|null>} Inscricao encontrada ou null.
 * @throws {Error} Quando a consulta falha.
 */
async function buscarDeUsuarioEmEvento(eventoId, usuarioId) {
  const [linhas] = await pool.execute(
    `SELECT id, evento_id, usuario_id, status, criado_em
       FROM inscricoes
      WHERE evento_id = ? AND usuario_id = ?
      LIMIT 1`,
    [eventoId, usuarioId]
  );

  return linhas[0] || null;
}

/**
 * Conta as inscricoes confirmadas de um evento. E desta contagem que saem as
 * vagas restantes: nenhum contador e guardado na tabela de eventos.
 *
 * @async
 * @param {number} eventoId Id do evento.
 * @returns {Promise<number>} Total de inscricoes confirmadas.
 * @throws {Error} Quando a consulta falha.
 */
async function contarConfirmadas(eventoId) {
  const [linhas] = await pool.execute(
    `SELECT COUNT(*) AS total
       FROM inscricoes
      WHERE evento_id = ? AND status = 'confirmada'`,
    [eventoId]
  );

  return Number(linhas[0].total);
}

/**
 * Lista as inscricoes de um usuario com os dados do evento, para a tela
 * "minhas inscricoes". Traz tambem as canceladas, com o status ao lado.
 *
 * @async
 * @param {number} usuarioId Id do participante.
 * @returns {Promise<object[]>} Inscricoes do usuario, da mais recente para a mais antiga.
 * @throws {Error} Quando a consulta falha.
 */
async function listarDeUsuario(usuarioId) {
  const [linhas] = await pool.execute(
    `SELECT i.id, i.evento_id, i.usuario_id, i.status, i.criado_em,
            e.titulo, e.\`local\`, e.data_inicio, e.data_fim, e.vagas
       FROM inscricoes i
       INNER JOIN eventos e ON e.id = i.evento_id
      WHERE i.usuario_id = ?
      ORDER BY e.data_inicio DESC`,
    [usuarioId]
  );

  return linhas;
}

/**
 * Lista os participantes confirmados de um evento, para o organizador.
 * Quem cancelou deixa de ser inscrito, entao fica de fora.
 *
 * @async
 * @param {number} eventoId Id do evento.
 * @returns {Promise<object[]>} Inscritos confirmados, em ordem alfabetica.
 * @throws {Error} Quando a consulta falha.
 */
async function listarInscritosDeEvento(eventoId) {
  const [linhas] = await pool.execute(
    `SELECT i.id, i.evento_id, i.usuario_id, i.status, i.criado_em,
            u.nome, u.email
       FROM inscricoes i
       INNER JOIN usuarios u ON u.id = i.usuario_id
      WHERE i.evento_id = ? AND i.status = 'confirmada'
      ORDER BY u.nome ASC`,
    [eventoId]
  );

  return linhas;
}

/**
 * Cancela a inscricao de um usuario em um evento. A linha nao e apagada: o
 * status vira 'cancelada' e a vaga volta a contar como livre.
 *
 * @async
 * @param {number} eventoId Id do evento.
 * @param {number} usuarioId Id do participante.
 * @returns {Promise<number>} Quantidade de linhas afetadas.
 * @throws {Error} Quando o banco recusa a atualizacao.
 */
async function cancelar(eventoId, usuarioId) {
  const [resultado] = await pool.execute(
    `UPDATE inscricoes
        SET status = 'cancelada'
      WHERE evento_id = ? AND usuario_id = ?`,
    [eventoId, usuarioId]
  );

  return resultado.affectedRows;
}

module.exports = {
  criar,
  buscarDeUsuarioEmEvento,
  contarConfirmadas,
  listarDeUsuario,
  listarInscritosDeEvento,
  cancelar,
};
