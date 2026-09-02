'use strict';

const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

const { NOME_DO_COOKIE } = require('../config/sessao');
const usuarioModel = require('../models/usuarioModel');

const CUSTO_DO_HASH = 10;

/**
 * Mensagem unica para e-mail inexistente e para senha errada. Dizer qual dos
 * dois falhou entregaria a quem tenta adivinhar a informacao de que aquele
 * e-mail tem conta no sistema.
 */
const CREDENCIAL_INVALIDA = 'E-mail ou senha invalidos.';

/**
 * Hash descartavel, com o mesmo custo dos hashes reais, comparado quando o
 * e-mail nao existe. Sem isso o login responderia visivelmente mais rapido
 * para e-mail inexistente do que para senha errada, e o tempo de resposta
 * revelaria o que a mensagem generica esconde.
 */
const HASH_DE_COMPARACAO = bcrypt.hashSync('senha-inexistente', CUSTO_DO_HASH);

/**
 * Converte os erros do express-validator em um objeto indexado pelo nome do
 * campo, que e o formato que a view usa para mostrar cada erro embaixo do seu
 * proprio campo.
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

/**
 * Troca o identificador da sessao e grava o usuario logado.
 *
 * A troca do identificador impede a fixacao de sessao: um identificador obtido
 * antes do login deixa de valer no momento em que o usuario se autentica.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {object} usuario Usuario que passa a ocupar a sessao.
 * @returns {Promise<void>} Resolve com a sessao ja gravada no banco.
 * @throws {Error} Quando a sessao nao pode ser regenerada ou gravada.
 */
function iniciarSessao(req, usuario) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((erroAoRegenerar) => {
      if (erroAoRegenerar) {
        reject(erroAoRegenerar);
        return;
      }

      req.session.usuario = usuario;

      // Grava antes de redirecionar: sem isso a proxima pagina pode chegar ao
      // banco antes da sessao ter sido escrita nele.
      req.session.save((erroAoSalvar) => {
        if (erroAoSalvar) {
          reject(erroAoSalvar);
          return;
        }

        resolve();
      });
    });
  });
}

/**
 * Monta o que a view do registro precisa para ser reexibida com erros.
 *
 * @param {object} corpo Corpo da requisicao.
 * @param {Object<string, string>} erros Erros por campo.
 * @returns {object} Dados da view. As senhas nunca voltam preenchidas.
 */
function dadosDoRegistro(corpo, erros) {
  return {
    titulo: 'Criar conta',
    erros,
    valores: {
      nome: corpo.nome || '',
      email: corpo.email || '',
      papel: corpo.papel || '',
    },
  };
}

/**
 * Monta o que a view de login precisa para ser reexibida com erros.
 *
 * @param {object} corpo Corpo da requisicao.
 * @param {Object<string, string>} erros Erros por campo.
 * @returns {object} Dados da view. A senha nunca volta preenchida.
 */
function dadosDoLogin(corpo, erros) {
  return {
    titulo: 'Entrar',
    erros,
    valores: { email: corpo.email || '' },
  };
}

/**
 * Exibe o formulario de criacao de conta.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Renderiza a view de registro.
 * @throws {Error} Quando a renderizacao falha.
 */
async function exibirRegistro(req, res, next) {
  try {
    res.render('auth/registrar', dadosDoRegistro({}, {}));
  } catch (erro) {
    next(erro);
  }
}

/**
 * Cria a conta e ja deixa o usuario logado.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Redireciona para a home ou reexibe o formulario.
 * @throws {Error} Quando o banco ou a sessao falham.
 */
async function registrar(req, res, next) {
  try {
    const erros = errosPorCampo(req);

    if (Object.keys(erros).length > 0) {
      res.status(422).render('auth/registrar', dadosDoRegistro(req.body, erros));
      return;
    }

    const { nome, email, senha, papel } = req.body;

    // E-mail repetido e erro de preenchimento, entao volta como erro do campo.
    // O UNIQUE do banco continua sendo a garantia final, tratada no catch.
    if (await usuarioModel.buscarPorEmail(email)) {
      erros.email = 'Este e-mail ja esta cadastrado.';
      res.status(422).render('auth/registrar', dadosDoRegistro(req.body, erros));
      return;
    }

    const senhaHash = await bcrypt.hash(senha, CUSTO_DO_HASH);
    const id = await usuarioModel.criar({ nome, email, senhaHash, papel });

    await iniciarSessao(req, { id, nome, email, papel });

    req.adicionarMensagem('sucesso', `Conta criada. Bem-vindo(a), ${nome}!`);
    res.redirect('/');
  } catch (erro) {
    // Duas contas criadas ao mesmo tempo com o mesmo e-mail: o UNIQUE recusa a
    // segunda. Continua sendo erro de formulario, nao erro 500.
    if (erro.code === 'ER_DUP_ENTRY') {
      res.status(422).render(
        'auth/registrar',
        dadosDoRegistro(req.body, { email: 'Este e-mail ja esta cadastrado.' })
      );
      return;
    }

    next(erro);
  }
}

/**
 * Exibe o formulario de login.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Renderiza a view de login.
 * @throws {Error} Quando a renderizacao falha.
 */
async function exibirLogin(req, res, next) {
  try {
    res.render('auth/login', dadosDoLogin({}, {}));
  } catch (erro) {
    next(erro);
  }
}

/**
 * Autentica por e-mail e senha.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Redireciona para a home ou reexibe o formulario.
 * @throws {Error} Quando o banco ou a sessao falham.
 */
async function entrar(req, res, next) {
  try {
    const erros = errosPorCampo(req);

    if (Object.keys(erros).length > 0) {
      res.status(422).render('auth/login', dadosDoLogin(req.body, erros));
      return;
    }

    const { email, senha } = req.body;
    const usuario = await usuarioModel.buscarPorEmail(email);
    const senhaConfere = await bcrypt.compare(
      senha,
      usuario ? usuario.senha_hash : HASH_DE_COMPARACAO
    );

    if (!usuario || !senhaConfere) {
      res.adicionarMensagemAgora('erro', CREDENCIAL_INVALIDA);
      res.status(401).render('auth/login', dadosDoLogin(req.body, {}));
      return;
    }

    await iniciarSessao(req, {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
    });

    req.adicionarMensagem('sucesso', `Bem-vindo(a) de volta, ${usuario.nome}!`);
    res.redirect('/');
  } catch (erro) {
    next(erro);
  }
}

/**
 * Encerra a sessao e volta para a home.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Redireciona para a home.
 * @throws {Error} Quando a sessao nao pode ser destruida.
 */
async function sair(req, res, next) {
  try {
    req.session.destroy((erro) => {
      if (erro) {
        next(erro);
        return;
      }

      // A sessao ja morreu no banco; o cookie orfao sai junto.
      res.clearCookie(NOME_DO_COOKIE);
      res.redirect('/');
    });
  } catch (erro) {
    next(erro);
  }
}

module.exports = { exibirRegistro, registrar, exibirLogin, entrar, sair };
