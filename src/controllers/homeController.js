'use strict';

/**
 * Eventos de exemplo usados apenas enquanto a camada de banco nao existe.
 * Serao substituidos pela consulta ao banco quando a listagem real entrar.
 */
const EVENTOS_PROVISORIOS = [
  {
    id: 1,
    titulo: 'Semana de Tecnologia',
    local: 'Auditorio Central',
    dataInicio: '12/09/2026 19:00',
    vagas: 80,
    vagasRestantes: 34,
  },
  {
    id: 2,
    titulo: 'Oficina de Banco de Dados',
    local: 'Laboratorio 3',
    dataInicio: '20/09/2026 14:00',
    vagas: 25,
    vagasRestantes: 6,
  },
  {
    id: 3,
    titulo: 'Palestra: Carreira em TI',
    local: 'Sala 12',
    dataInicio: '02/10/2026 09:00',
    vagas: 40,
    vagasRestantes: 40,
  },
];

/**
 * Renderiza a pagina inicial com a lista publica de eventos.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Renderiza a view da home.
 * @throws {Error} Quando a renderizacao da view falha.
 */
async function exibirHome(req, res, next) {
  try {
    res.render('home', {
      titulo: 'Eventos',
      eventos: EVENTOS_PROVISORIOS,
    });
  } catch (erro) {
    next(erro);
  }
}

module.exports = { exibirHome };
