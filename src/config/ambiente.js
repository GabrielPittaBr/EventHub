'use strict';

// quiet: true evita o banner do dotenv poluir o log de inicializacao no Render.
require('dotenv').config({ quiet: true });

const PORTA_PADRAO = 3000;

/**
 * Configuracoes de execucao lidas do ambiente.
 * Nenhum valor sensivel fica no codigo: tudo vem de process.env.
 */
const ambiente = {
  nodeEnv: process.env.NODE_ENV || 'development',
  porta: Number(process.env.PORT) || PORTA_PADRAO,
};

ambiente.emProducao = ambiente.nodeEnv === 'production';

module.exports = ambiente;
