'use strict';

const app = require('./app');
const ambiente = require('./config/ambiente');

app.listen(ambiente.porta, () => {
  console.log(
    `EventHub no ar em http://localhost:${ambiente.porta} (ambiente: ${ambiente.nodeEnv})`
  );
});
