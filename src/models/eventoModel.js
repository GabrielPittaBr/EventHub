'use strict';

const { pool } = require('../config/banco');

/**
 * Escapa os curingas do LIKE para que o texto digitado pelo usuario seja
 * tratado como texto literal. Sem isso, uma busca por "%" viraria "qualquer
 * coisa" e devolveria a base inteira.
 *
 * @param {string} termo Texto digitado na busca.
 * @returns {string} Termo com `\`, `%` e `_` neutralizados.
 */
function escaparCuringas(termo) {
  return termo.replace(/[\\%_]/g, (caractere) => `\\${caractere}`);
}

/**
 * Lista os eventos que ainda vao acontecer, opcionalmente filtrando pelo titulo.
 *
 * As vagas restantes saem de um COUNT das inscricoes confirmadas: a tabela de
 * eventos nunca guarda contador, para nao existir numero desatualizado.
 *
 * O filtro opcional vive dentro do proprio SQL (`? IS NULL OR ...`) em vez de
 * ser concatenado na string, para que exista uma unica consulta e nenhum valor
 * entre no SQL fora dos placeholders.
 *
 * @async
 * @param {string} [termoDeBusca] Trecho do titulo a procurar. Vazio ou ausente lista tudo.
 * @returns {Promise<object[]>} Eventos futuros, do mais proximo ao mais distante.
 * @throws {Error} Quando a consulta falha.
 */
async function listarFuturos(termoDeBusca) {
  const termo = typeof termoDeBusca === 'string' ? termoDeBusca.trim() : '';
  const termoOuNulo = termo === '' ? null : termo;
  const padrao = termo === '' ? '%' : `%${escaparCuringas(termo)}%`;

  const [linhas] = await pool.execute(
    `SELECT e.id, e.titulo, e.descricao, e.\`local\`, e.data_inicio, e.data_fim,
            e.vagas, e.organizador_id, e.criado_em,
            u.nome AS organizador_nome,
            COUNT(i.id) AS inscricoes_confirmadas,
            CAST(e.vagas AS SIGNED) - COUNT(i.id) AS vagas_restantes
       FROM eventos e
       INNER JOIN usuarios u ON u.id = e.organizador_id
       LEFT JOIN inscricoes i ON i.evento_id = e.id AND i.status = 'confirmada'
      WHERE e.data_inicio > NOW()
        AND (? IS NULL OR e.titulo LIKE ? ESCAPE '\\\\')
      GROUP BY e.id, u.nome
      ORDER BY e.data_inicio ASC`,
    [termoOuNulo, padrao]
  );

  return linhas;
}

/**
 * Busca um evento pelo id, ja com o nome do organizador e as vagas restantes.
 *
 * @async
 * @param {number} id Identificador do evento.
 * @returns {Promise<object|null>} Evento encontrado ou null.
 * @throws {Error} Quando a consulta falha.
 */
async function buscarPorId(id) {
  const [linhas] = await pool.execute(
    `SELECT e.id, e.titulo, e.descricao, e.\`local\`, e.data_inicio, e.data_fim,
            e.vagas, e.organizador_id, e.criado_em,
            u.nome AS organizador_nome,
            COUNT(i.id) AS inscricoes_confirmadas,
            CAST(e.vagas AS SIGNED) - COUNT(i.id) AS vagas_restantes
       FROM eventos e
       INNER JOIN usuarios u ON u.id = e.organizador_id
       LEFT JOIN inscricoes i ON i.evento_id = e.id AND i.status = 'confirmada'
      WHERE e.id = ?
      GROUP BY e.id, u.nome`,
    [id]
  );

  return linhas[0] || null;
}

/**
 * Lista todos os eventos de um organizador, futuros e passados, para o painel.
 *
 * @async
 * @param {number} organizadorId Id do usuario organizador.
 * @returns {Promise<object[]>} Eventos do organizador, do mais recente ao mais antigo.
 * @throws {Error} Quando a consulta falha.
 */
async function listarPorOrganizador(organizadorId) {
  const [linhas] = await pool.execute(
    `SELECT e.id, e.titulo, e.descricao, e.\`local\`, e.data_inicio, e.data_fim,
            e.vagas, e.organizador_id, e.criado_em,
            u.nome AS organizador_nome,
            COUNT(i.id) AS inscricoes_confirmadas,
            CAST(e.vagas AS SIGNED) - COUNT(i.id) AS vagas_restantes
       FROM eventos e
       INNER JOIN usuarios u ON u.id = e.organizador_id
       LEFT JOIN inscricoes i ON i.evento_id = e.id AND i.status = 'confirmada'
      WHERE e.organizador_id = ?
      GROUP BY e.id, u.nome
      ORDER BY e.data_inicio DESC`,
    [organizadorId]
  );

  return linhas;
}

/**
 * Cria um evento.
 *
 * @async
 * @param {object} dados Dados do evento.
 * @param {string} dados.titulo Titulo do evento.
 * @param {string} dados.descricao Descricao livre.
 * @param {string} dados.local Onde acontece.
 * @param {string} dados.dataInicio Inicio, no formato aceito pelo MySQL.
 * @param {string} dados.dataFim Termino, no formato aceito pelo MySQL.
 * @param {number} dados.vagas Total de vagas oferecidas.
 * @param {number} dados.organizadorId Id do usuario dono do evento.
 * @returns {Promise<number>} Id do evento criado.
 * @throws {Error} Quando o banco recusa a insercao.
 */
async function criar({ titulo, descricao, local, dataInicio, dataFim, vagas, organizadorId }) {
  const [resultado] = await pool.execute(
    `INSERT INTO eventos
       (titulo, descricao, \`local\`, data_inicio, data_fim, vagas, organizador_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [titulo, descricao, local, dataInicio, dataFim, vagas, organizadorId]
  );

  return resultado.insertId;
}

/**
 * Atualiza um evento. Quem pode editar e decidido no controller: aqui so o id
 * manda.
 *
 * @async
 * @param {number} id Id do evento.
 * @param {object} dados Dados do evento.
 * @param {string} dados.titulo Titulo do evento.
 * @param {string} dados.descricao Descricao livre.
 * @param {string} dados.local Onde acontece.
 * @param {string} dados.dataInicio Inicio, no formato aceito pelo MySQL.
 * @param {string} dados.dataFim Termino, no formato aceito pelo MySQL.
 * @param {number} dados.vagas Total de vagas oferecidas.
 * @returns {Promise<number>} Quantidade de linhas afetadas.
 * @throws {Error} Quando o banco recusa a atualizacao.
 */
async function atualizar(id, { titulo, descricao, local, dataInicio, dataFim, vagas }) {
  const [resultado] = await pool.execute(
    `UPDATE eventos
        SET titulo = ?, descricao = ?, \`local\` = ?, data_inicio = ?, data_fim = ?, vagas = ?
      WHERE id = ?`,
    [titulo, descricao, local, dataInicio, dataFim, vagas, id]
  );

  return resultado.affectedRows;
}

/**
 * Exclui um evento. As inscricoes ligadas a ele saem junto, pela regra
 * ON DELETE CASCADE definida no schema.
 *
 * @async
 * @param {number} id Id do evento.
 * @returns {Promise<number>} Quantidade de linhas afetadas.
 * @throws {Error} Quando o banco recusa a exclusao.
 */
async function excluir(id) {
  const [resultado] = await pool.execute('DELETE FROM eventos WHERE id = ?', [id]);

  return resultado.affectedRows;
}

module.exports = {
  listarFuturos,
  buscarPorId,
  listarPorOrganizador,
  criar,
  atualizar,
  excluir,
};
