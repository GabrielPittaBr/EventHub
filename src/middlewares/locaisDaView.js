'use strict';

/**
 * Disponibiliza para todas as views os dados que o layout base espera.
 * O usuario logado e as mensagens flash so passam a ser preenchidos de verdade
 * quando a sessao entrar; ate la o layout renderiza no estado de visitante.
 *
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Proximo middleware da cadeia.
 * @returns {void}
 */
function locaisDaView(req, res, next) {
  res.locals.usuario = (req.session && req.session.usuario) || null;
  res.locals.mensagens = [];
  res.locals.caminhoAtual = req.path;
  next();
}

module.exports = locaisDaView;
