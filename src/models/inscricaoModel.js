'use strict';

const { pool } = require('../config/banco');

/** Codigo devolvido pelo MySQL quando a chave unica e violada. */
const CHAVE_DUPLICADA = 'ER_DUP_ENTRY';

/**
 * Desfechos possiveis de uma tentativa de inscricao. O model decide entre eles
 * porque a decisao depende do que o banco enxerga dentro da transacao; a
 * mensagem mostrada para cada desfecho e escolhida pelo controller.
 *
 * @type {Object<string, string>}
 */
const RESULTADO = {
  CONFIRMADA: 'confirmada',
  JA_INSCRITO: 'ja_inscrito',
  LOTADO: 'lotado',
  EVENTO_INEXISTENTE: 'evento_inexistente',
};

/**
 * Busca a inscricao de um usuario em um evento, confirmada ou cancelada.
 * O controller usa o `status` para decidir o que oferecer na tela.
 *
 * @async
 * @param {number} eventoId Id do evento.
 * @param {number} usuarioId Id do participante.
 * @param {import('mysql2/promise').Pool|import('mysql2/promise').PoolConnection} [executor]
 *   Quem executa a consulta. O padrao e o pool; `confirmar` passa a conexao da
 *   transacao para que a leitura enxergue (e trave) o mesmo estado da gravacao.
 * @returns {Promise<object|null>} Inscricao encontrada ou null.
 * @throws {Error} Quando a consulta falha.
 */
async function buscarDeUsuarioEmEvento(eventoId, usuarioId, executor = pool) {
  const [linhas] = await executor.execute(
    `SELECT id, evento_id, usuario_id, status, criado_em
       FROM inscricoes
      WHERE evento_id = ? AND usuario_id = ?
      LIMIT 1`,
    [eventoId, usuarioId]
  );

  return linhas[0] || null;
}

/**
 * Busca uma inscricao pelo proprio id, com o titulo do evento a que pertence.
 * E por aqui que o cancelamento descobre de quem e a inscricao antes de mexer
 * nela.
 *
 * @async
 * @param {number} id Id da inscricao.
 * @returns {Promise<object|null>} Inscricao encontrada ou null.
 * @throws {Error} Quando a consulta falha.
 */
async function buscarPorId(id) {
  const [linhas] = await pool.execute(
    `SELECT i.id, i.evento_id, i.usuario_id, i.status, i.criado_em, e.titulo
       FROM inscricoes i
       INNER JOIN eventos e ON e.id = i.evento_id
      WHERE i.id = ?`,
    [id]
  );

  return linhas[0] || null;
}

/**
 * Conta as inscricoes confirmadas de um evento. E desta contagem que saem as
 * vagas restantes: nenhum contador e guardado na tabela de eventos.
 *
 * @async
 * @param {number} eventoId Id do evento.
 * @param {import('mysql2/promise').Pool|import('mysql2/promise').PoolConnection} [executor]
 *   Quem executa a consulta; o padrao e o pool.
 * @returns {Promise<number>} Total de inscricoes confirmadas.
 * @throws {Error} Quando a consulta falha.
 */
async function contarConfirmadas(eventoId, executor = pool) {
  const [linhas] = await executor.execute(
    `SELECT COUNT(*) AS total
       FROM inscricoes
      WHERE evento_id = ? AND status = 'confirmada'`,
    [eventoId]
  );

  return Number(linhas[0].total);
}

/**
 * Inscreve um usuario em um evento, criando a inscricao ou reativando a que
 * ele mesmo cancelou.
 *
 * Conferir as vagas e gravar sao um passo so: os dois acontecem na mesma
 * transacao, aberta com um `SELECT ... FOR UPDATE` na linha do evento. Duas
 * inscricoes simultaneas no mesmo evento passam a esperar uma pela outra, e a
 * contagem lida aqui continua valendo na hora do INSERT — sem isso, dois
 * cliques no mesmo instante caberiam os dois na ultima vaga.
 *
 * O schema tem UNIQUE (evento_id, usuario_id), entao a reinscricao reaproveita
 * a linha existente em vez de criar outra.
 *
 * @async
 * @param {number} eventoId Id do evento.
 * @param {number} usuarioId Id do participante.
 * @returns {Promise<string>} Um dos valores de {@link RESULTADO}.
 * @throws {Error} Quando o banco falha por um motivo que nao seja a chave unica.
 */
async function confirmar(eventoId, usuarioId) {
  const conexao = await pool.getConnection();

  try {
    await conexao.beginTransaction();

    const [eventos] = await conexao.execute(
      'SELECT vagas FROM eventos WHERE id = ? FOR UPDATE',
      [eventoId]
    );

    if (eventos.length === 0) {
      await conexao.rollback();
      return RESULTADO.EVENTO_INEXISTENTE;
    }

    const inscricao = await buscarDeUsuarioEmEvento(eventoId, usuarioId, conexao);

    if (inscricao && inscricao.status === 'confirmada') {
      await conexao.rollback();
      return RESULTADO.JA_INSCRITO;
    }

    const confirmadas = await contarConfirmadas(eventoId, conexao);

    if (confirmadas >= Number(eventos[0].vagas)) {
      await conexao.rollback();
      return RESULTADO.LOTADO;
    }

    await conexao.execute(
      `INSERT INTO inscricoes (evento_id, usuario_id, status)
       VALUES (?, ?, 'confirmada')
       ON DUPLICATE KEY UPDATE status = 'confirmada'`,
      [eventoId, usuarioId]
    );

    await conexao.commit();

    return RESULTADO.CONFIRMADA;
  } catch (erro) {
    await conexao.rollback();

    // Quem perde a corrida na chave unica ja esta inscrito: nao e erro 500.
    if (erro.code === CHAVE_DUPLICADA) {
      return RESULTADO.JA_INSCRITO;
    }

    throw erro;
  } finally {
    conexao.release();
  }
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
  RESULTADO,
  confirmar,
  buscarDeUsuarioEmEvento,
  buscarPorId,
  contarConfirmadas,
  listarDeUsuario,
  listarInscritosDeEvento,
  cancelar,
};
