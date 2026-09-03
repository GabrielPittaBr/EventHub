'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

/**
 * Carrega os middlewares de erro com o NODE_ENV pedido. O cache precisa ser
 * limpo porque `ambiente.emProducao` e resolvido uma vez, no require.
 *
 * @param {string} nodeEnv Valor de NODE_ENV para esta carga.
 * @returns {object} O modulo de middlewares de erro recem-carregado.
 */
function carregar(nodeEnv) {
  process.env.NODE_ENV = nodeEnv;

  for (const chave of Object.keys(require.cache)) {
    delete require.cache[chave];
  }

  return require('../src/middlewares/erros');
}

/**
 * Resposta de mentira que grava o status e o render em vez de enviar HTTP.
 *
 * @returns {object} Objeto com a interface que os middlewares usam.
 */
function respostaFalsa() {
  return {
    headersSent: false,
    statusEnviado: null,
    viewRenderizada: null,
    dadosDaView: null,
    status(codigo) {
      this.statusEnviado = codigo;
      return this;
    },
    render(view, dados) {
      this.viewRenderizada = view;
      this.dadosDaView = dados;
    },
  };
}

const requisicao = { method: 'GET', originalUrl: '/qualquer' };

test('rota desconhecida responde 404 com a pagina do site', () => {
  const { rotaNaoEncontrada } = carregar('development');
  const res = respostaFalsa();

  rotaNaoEncontrada(requisicao, res);

  assert.equal(res.statusEnviado, 404);
  assert.equal(res.viewRenderizada, 'erros/404');
});

test('em desenvolvimento a pagina 500 mostra o stack', () => {
  const { tratadorDeErros } = carregar('development');
  const res = respostaFalsa();

  tratadorDeErros(new Error('banco caiu'), requisicao, res, () => {});

  assert.equal(res.statusEnviado, 500);
  assert.equal(res.viewRenderizada, 'erros/500');
  assert.match(res.dadosDaView.detalhe, /banco caiu/);
});

test('em producao a pagina 500 nao vaza nada do erro', () => {
  const { tratadorDeErros } = carregar('production');
  const res = respostaFalsa();

  tratadorDeErros(new Error('senha do banco invalida'), requisicao, res, () => {});

  assert.equal(res.statusEnviado, 500);
  assert.equal(res.dadosDaView.detalhe, null);
});

test('erro depois do inicio da resposta vai para o Express, sem render duplo', () => {
  const { tratadorDeErros } = carregar('development');
  const res = respostaFalsa();
  res.headersSent = true;
  let encaminhado = null;

  tratadorDeErros(new Error('quebrou no meio do render'), requisicao, res, (erro) => {
    encaminhado = erro;
  });

  assert.equal(res.viewRenderizada, null);
  assert.match(encaminhado.message, /quebrou no meio do render/);
});
