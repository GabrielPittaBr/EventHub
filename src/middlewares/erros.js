'use strict';

const ambiente = require('../config/ambiente');
const { naoEncontrado } = require('../helpers/rota');

/**
 * Ultimo middleware da cadeia de rotas: se a requisicao chegou ate aqui,
 * nenhuma rota respondeu. Renderiza a mesma pagina 404 que os controllers ja
 * usam quando um id nao existe, para que endereco errado e evento removido
 * dessem a mesma tela.
 *
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @returns {void}
 */
function rotaNaoEncontrada(req, res) {
  naoEncontrado(res);
}

/**
 * Tratador central de erros. Precisa dos quatro parametros: e a assinatura
 * pela qual o Express reconhece um middleware de erro, mesmo que `next` nao
 * seja chamado no caminho comum.
 *
 * O stack completo vai para o log do servidor. Na tela, em producao, o usuario
 * ve apenas a pagina amigavel: mensagem interna, nome de tabela e detalhe de
 * conexao ajudariam mais um atacante do que o visitante.
 *
 * @param {Error} erro Erro encaminhado por um controller ou pelo Express.
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Usado apenas quando a resposta
 *   ja comecou a ser enviada e so resta deixar o Express encerrar a conexao.
 * @returns {void}
 */
function tratadorDeErros(erro, req, res, next) {
  console.error(`Erro em ${req.method} ${req.originalUrl}:`, erro);

  // Cabecalho ja enviado: nao da mais para trocar a pagina.
  if (res.headersSent) {
    next(erro);
    return;
  }

  // Quando quem quebrou foi a sessao, locaisDaView nem chegou a rodar e o
  // layout ficaria sem o que o cabecalho le. Sem estes tres, a propria pagina
  // de erro estoura e o Express cospe o stack na tela do visitante.
  res.locals.usuario = res.locals.usuario || null;
  res.locals.caminhoAtual = res.locals.caminhoAtual || req.path;
  res.locals.mensagens = res.locals.mensagens || [];

  res.status(500).render('erros/500', {
    titulo: 'Erro interno',
    detalhe: ambiente.emProducao ? null : erro.stack || String(erro),
  });
}

module.exports = { rotaNaoEncontrada, tratadorDeErros };
