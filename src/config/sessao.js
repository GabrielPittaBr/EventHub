'use strict';

const session = require('express-session');
const criarArmazenamentoMySQL = require('express-mysql-session');

const ambiente = require('./ambiente');
const { pool } = require('./banco');

const UM_MINUTO_EM_MS = 60 * 1000;
const DURACAO_DA_SESSAO_MS = 8 * 60 * UM_MINUTO_EM_MS;
const INTERVALO_DE_LIMPEZA_MS = 15 * UM_MINUTO_EM_MS;

/**
 * Nome do cookie de sessao. Fica exportado porque o logout precisa apagar
 * exatamente este cookie.
 */
const NOME_DO_COOKIE = 'eventhub.sid';

const ArmazenamentoMySQL = criarArmazenamentoMySQL(session);

// Reaproveita o pool da aplicacao; a tabela de sessoes o store cria sozinho.
const armazenamento = new ArmazenamentoMySQL(
  {
    createDatabaseTable: true,
    clearExpired: true,
    checkExpirationInterval: INTERVALO_DE_LIMPEZA_MS,
    expiration: DURACAO_DA_SESSAO_MS,
  },
  pool
);

/**
 * Middleware de sessao gravada no MySQL. Guardar a sessao no banco (e nao em
 * memoria) e o que mantem o usuario logado depois de o processo reiniciar, o
 * que no Render acontece com frequencia.
 * @type {import('express').RequestHandler}
 */
const sessao = session({
  name: NOME_DO_COOKIE,
  secret: ambiente.sessaoSegredo,
  store: armazenamento,
  resave: false,
  saveUninitialized: false,
  // O Render termina o HTTPS antes da aplicacao.
  proxy: ambiente.emProducao,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: ambiente.emProducao,
    maxAge: DURACAO_DA_SESSAO_MS,
  },
});

module.exports = { sessao, armazenamento, NOME_DO_COOKIE };
