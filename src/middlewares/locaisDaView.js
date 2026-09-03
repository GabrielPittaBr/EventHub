'use strict';

const { formatarDataHora, partesDaData } = require('../helpers/formato');

/**
 * Disponibiliza para todas as views os dados que o layout base espera.
 * As mensagens flash sao responsabilidade do middleware mensagensFlash, que
 * roda antes deste e ja preencheu res.locals.mensagens.
 *
 * A formatacao de data entra aqui porque varias telas mostram as datas do
 * mesmo jeito; deixar cada view formatar por conta abriria espaco para
 * formatos diferentes pelo sistema.
 *
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Proximo middleware da cadeia.
 * @returns {void}
 */
function locaisDaView(req, res, next) {
  res.locals.usuario = (req.session && req.session.usuario) || null;
  res.locals.caminhoAtual = req.path;
  res.locals.formatarDataHora = formatarDataHora;
  res.locals.partesDaData = partesDaData;
  next();
}

module.exports = locaisDaView;
