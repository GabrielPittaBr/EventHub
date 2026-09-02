'use strict';

const { validationResult } = require('express-validator');

/**
 * Converte os erros do express-validator em um objeto indexado pelo nome do
 * campo, que e o formato que as views usam para mostrar cada erro embaixo do
 * seu proprio campo.
 *
 * Quando o mesmo campo acumula mais de um erro, so o primeiro fica: mostrar a
 * pilha inteira embaixo de um campo confunde mais do que ajuda.
 *
 * @param {import('express').Request} req Requisicao HTTP ja validada.
 * @returns {Object<string, string>} Erros por campo; vazio quando nao ha erro.
 */
function errosPorCampo(req) {
  const erros = {};

  for (const erro of validationResult(req).array()) {
    if (!erros[erro.path]) {
      erros[erro.path] = erro.msg;
    }
  }

  return erros;
}

module.exports = { errosPorCampo };
