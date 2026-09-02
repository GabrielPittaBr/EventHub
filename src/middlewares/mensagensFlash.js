'use strict';

/**
 * Mensagens flash construidas sobre a propria sessao, sem biblioteca extra.
 *
 * Sao dois caminhos: quem vai redirecionar chama `req.adicionarMensagem(...)`
 * e a mensagem fica guardada na sessao para aparecer na proxima pagina; quem
 * renderiza direto chama `res.adicionarMensagemAgora(...)`, porque a sessao ja
 * foi lida quando este middleware rodou e uma mensagem guardada nela agora so
 * apareceria na pagina seguinte.
 *
 * As mensagens saem da sessao assim que sao lidas, entao cada uma e exibida
 * uma vez so.
 *
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Proximo middleware da cadeia.
 * @returns {void}
 */
function mensagensFlash(req, res, next) {
  /**
   * Guarda uma mensagem para ser exibida na proxima pagina.
   *
   * @param {'sucesso'|'erro'|'info'} tipo Tipo do alerta, usado na classe CSS.
   * @param {string} texto Texto exibido ao usuario.
   * @returns {void}
   */
  req.adicionarMensagem = function adicionarMensagem(tipo, texto) {
    if (!req.session) {
      return;
    }

    if (!Array.isArray(req.session.mensagens)) {
      req.session.mensagens = [];
    }

    req.session.mensagens.push({ tipo, texto });
  };

  res.locals.mensagens = (req.session && req.session.mensagens) || [];

  if (req.session && req.session.mensagens) {
    delete req.session.mensagens;
  }

  /**
   * Exibe uma mensagem ja nesta resposta, para quem renderiza sem redirecionar.
   *
   * @param {'sucesso'|'erro'|'info'} tipo Tipo do alerta, usado na classe CSS.
   * @param {string} texto Texto exibido ao usuario.
   * @returns {void}
   */
  res.adicionarMensagemAgora = function adicionarMensagemAgora(tipo, texto) {
    res.locals.mensagens.push({ tipo, texto });
  };

  next();
}

module.exports = mensagensFlash;
