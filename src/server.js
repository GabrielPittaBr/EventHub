'use strict';

const ambiente = require('./config/ambiente');

/**
 * Sobe o servidor depois de garantir que a configuracao esta completa e que o
 * armazenamento de sessoes esta pronto.
 *
 * @async
 * @returns {Promise<void>} Resolve quando o servidor esta ouvindo.
 * @throws {Error} Quando falta configuracao ou a sessao nao pode ser preparada.
 */
async function iniciar() {
  ambiente.validar();

  // Requires aqui dentro: e o carregamento deles que monta o pool, e a falha
  // precisa virar mensagem no catch de baixo.
  const app = require('./app');
  const { armazenamento } = require('./config/sessao');

  // Sem esperar, um login logo apos o boot grava em tabela inexistente.
  await armazenamento.onReady();

  app.listen(ambiente.porta, () => {
    console.log(
      `EventHub no ar em http://localhost:${ambiente.porta} (ambiente: ${ambiente.nodeEnv})`
    );
  });
}

iniciar().catch((erro) => {
  console.error(`Falha na inicializacao: ${erro.message}`);
  process.exit(1);
});
