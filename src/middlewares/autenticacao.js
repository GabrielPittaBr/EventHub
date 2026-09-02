'use strict';

/**
 * Devolve o usuario logado, ou null quando nao ha sessao iniciada.
 *
 * @param {import('express').Request} req Requisicao HTTP.
 * @returns {object|null} Usuario guardado na sessao.
 */
function usuarioDaSessao(req) {
  return (req.session && req.session.usuario) || null;
}

/**
 * Manda quem nao esta logado para o login, explicando o motivo. Os dois
 * middlewares abaixo tratam a falta de sessao exatamente assim.
 *
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @returns {void}
 */
function pedirLogin(req, res) {
  req.adicionarMensagem('erro', 'Entre na sua conta para continuar.');
  res.redirect('/auth/login');
}

/**
 * Exige um usuario logado. Sem sessao, manda para o login com uma mensagem
 * explicando o motivo, em vez de devolver uma pagina de erro seca.
 *
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Proximo middleware da cadeia.
 * @returns {void}
 */
function requireAuth(req, res, next) {
  if (usuarioDaSessao(req)) {
    next();
    return;
  }

  pedirLogin(req, res);
}

/**
 * Exige um usuario logado com papel de organizador.
 *
 * Quem nao esta logado vai para o login; quem esta logado mas e participante
 * recebe 403, porque o problema nao e falta de identificacao e sim falta de
 * permissao — mandar para o login so daria a entender que basta entrar de novo.
 *
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Proximo middleware da cadeia.
 * @returns {void}
 */
function requireOrganizador(req, res, next) {
  const usuario = usuarioDaSessao(req);

  if (!usuario) {
    pedirLogin(req, res);
    return;
  }

  if (usuario.papel !== 'organizador') {
    res.status(403).render('erros/403', { titulo: 'Acesso negado' });
    return;
  }

  next();
}

module.exports = { requireAuth, requireOrganizador };
