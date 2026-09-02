'use strict';

/**
 * Disponibiliza para todas as views os dados que o layout base espera.
 * As mensagens flash sao responsabilidade do middleware mensagensFlash, que
 * roda antes deste e ja preencheu res.locals.mensagens.
 *
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Proximo middleware da cadeia.
 * @returns {void}
 */
function locaisDaView(req, res, next) {
  res.locals.usuario = (req.session && req.session.usuario) || null;
  res.locals.caminhoAtual = req.path;
  next();
}

module.exports = locaisDaView;
