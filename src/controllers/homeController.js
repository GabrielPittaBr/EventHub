'use strict';

const eventoModel = require('../models/eventoModel');

/**
 * Renderiza a pagina inicial com os eventos futuros, filtrados pelo termo de
 * busca quando ele vem na query string.
 *
 * O termo volta para a view para continuar no campo depois da busca, e a
 * propria view cuida do estado vazio quando nada e encontrado.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Renderiza a view da home.
 * @throws {Error} Quando a consulta ao banco falha.
 */
async function exibirHome(req, res, next) {
  try {
    const busca = typeof req.query.busca === 'string' ? req.query.busca.trim() : '';
    const eventos = await eventoModel.listarFuturos(busca);

    res.render('home', {
      titulo: 'Eventos',
      eventos,
      busca,
    });
  } catch (erro) {
    next(erro);
  }
}

module.exports = { exibirHome };
