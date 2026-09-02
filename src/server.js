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
  // Configuracao incompleta derruba o processo com o nome da variavel que
  // falta. Sem isso a falha so apareceria depois, como erro generico de conexao.
  ambiente.validar();

  // Os dois requires ficam aqui dentro porque e o carregamento deles que monta
  // o pool: um certificado ilegivel em DB_SSL_CA tambem precisa virar mensagem,
  // nao stack trace.
  const app = require('./app');
  const { armazenamento } = require('./config/sessao');

  // O store cria a tabela de sessoes de forma assincrona. Sem esperar por ela,
  // um login que chegue logo apos o boot tentaria gravar em uma tabela que
  // ainda nao existe e viraria erro 500.
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
