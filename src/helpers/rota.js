'use strict';

const eventoModel = require('../models/eventoModel');

/**
 * Pedacos que os controllers de evento e de inscricao usam do mesmo jeito: ler
 * um id da URL, responder 404 e 403 e carregar o evento apontado pela rota ja
 * conferindo quem pode ve-lo.
 */

/**
 * Le um id de rota aceitando apenas inteiro positivo.
 *
 * Um id como "abc" ou "9 OR 1=1" vira null e o chamador responde 404, em vez de
 * chegar ao banco e virar erro 500.
 *
 * @param {string} valor Trecho da URL.
 * @returns {number|null} Id valido ou null.
 */
function idValido(valor) {
  return /^[1-9]\d*$/.test(valor) ? Number(valor) : null;
}

/**
 * Responde a pagina de nao encontrado.
 *
 * @param {import('express').Response} res Resposta HTTP.
 * @returns {void}
 */
function naoEncontrado(res) {
  res.status(404).render('erros/404', { titulo: 'Pagina nao encontrada' });
}

/**
 * Responde a pagina de acesso negado.
 *
 * @param {import('express').Response} res Resposta HTTP.
 * @returns {void}
 */
function acessoNegado(res) {
  res.status(403).render('erros/403', { titulo: 'Acesso negado' });
}

/**
 * Busca o evento apontado pela URL, respondendo 404 quando o id nao presta ou
 * nao existe evento com ele.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @returns {Promise<object|null>} O evento, ou null quando o 404 ja foi enviado.
 * @throws {Error} Quando a consulta ao banco falha.
 */
async function eventoDaUrl(req, res) {
  const id = idValido(req.params.id);

  if (id === null) {
    naoEncontrado(res);
    return null;
  }

  const evento = await eventoModel.buscarPorId(id);

  if (!evento) {
    naoEncontrado(res);
    return null;
  }

  return evento;
}

/**
 * Busca o evento da URL e confere se ele pertence a quem esta pedindo.
 *
 * Esta e a regra de propriedade dos tickets: ela roda no servidor em toda acao
 * restrita ao dono — editar, excluir, ver a lista de inscritos —, entao
 * esconder o botao na tela nunca e a unica barreira: um PUT, DELETE ou GET
 * forjado para um evento alheio para aqui.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @returns {Promise<object|null>} O evento quando o acesso e permitido; null
 *   quando a resposta (404 ou 403) ja foi enviada.
 * @throws {Error} Quando a consulta ao banco falha.
 */
async function eventoDoOrganizador(req, res) {
  const evento = await eventoDaUrl(req, res);

  if (!evento) {
    return null;
  }

  if (evento.organizador_id !== req.session.usuario.id) {
    acessoNegado(res);
    return null;
  }

  return evento;
}

module.exports = { idValido, naoEncontrado, acessoNegado, eventoDaUrl, eventoDoOrganizador };
