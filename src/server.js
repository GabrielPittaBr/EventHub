'use strict';

const ambiente = require('./config/ambiente');

// Configuracao incompleta derruba o processo aqui, com o nome da variavel que
// falta. Sem isso a falha so apareceria depois, como erro generico de conexao.
// O require do app entra no mesmo try porque e ele que monta o pool: um
// certificado ilegivel em DB_SSL_CA tambem precisa virar mensagem, nao stack trace.
let app;

try {
  ambiente.validar();
  app = require('./app');
} catch (erro) {
  console.error(`Falha na inicializacao: ${erro.message}`);
  process.exit(1);
}

app.listen(ambiente.porta, () => {
  console.log(
    `EventHub no ar em http://localhost:${ambiente.porta} (ambiente: ${ambiente.nodeEnv})`
  );
});
