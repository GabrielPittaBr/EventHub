'use strict';

const ambiente = require('../config/ambiente');
const banco = require('../config/banco');

/**
 * Responde ao healthcheck do Render. So devolve 200 se o banco tambem
 * responder: um processo no ar com o banco fora nao esta saudavel.
 * Este e o unico ponto da aplicacao que devolve JSON: todo o restante e HTML
 * renderizado no servidor.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Responde 200 quando o banco responde, 503 quando nao.
 * @throws {Error} Quando nao e possivel montar a resposta.
 */
async function verificar(req, res, next) {
  const resposta = {
    status: 'ok',
    ambiente: ambiente.nodeEnv,
    banco: 'ok',
    horario: new Date().toISOString(),
  };

  try {
    await banco.verificarConexao();
  } catch (erro) {
    // O detalhe do erro fica no log do servidor; a resposta publica nao expoe
    // host, usuario nem qualquer parte da configuracao do banco.
    console.error('Healthcheck: o banco nao respondeu.', erro);
    resposta.status = 'erro';
    resposta.banco = 'indisponivel';
    res.status(503).json(resposta);
    return;
  }

  try {
    res.status(200).json(resposta);
  } catch (erro) {
    next(erro);
  }
}

module.exports = { verificar };
