'use strict';

const ambiente = require('../config/ambiente');

/**
 * Responde ao healthcheck do Render informando que o processo esta no ar.
 * Este e o unico ponto da aplicacao que devolve JSON: todo o restante e HTML
 * renderizado no servidor.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Responde 200 com o estado da aplicacao.
 * @throws {Error} Quando nao e possivel montar a resposta.
 */
async function verificar(req, res, next) {
  try {
    res.status(200).json({
      status: 'ok',
      ambiente: ambiente.nodeEnv,
      horario: new Date().toISOString(),
    });
  } catch (erro) {
    next(erro);
  }
}

module.exports = { verificar };
