'use strict';

const path = require('path');

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const methodOverride = require('method-override');

const { sessao } = require('./config/sessao');
const { rotaNaoEncontrada, tratadorDeErros } = require('./middlewares/erros');
const locaisDaView = require('./middlewares/locaisDaView');
const mensagensFlash = require('./middlewares/mensagensFlash');
const rotas = require('./routes');

const app = express();

// O Render coloca a aplicacao atras de um proxy. Sem confiar nesse proxy o
// Express nao enxerga o HTTPS original e o cookie de sessao "secure" nao grava.
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.set('layout', 'layout');
app.use(expressLayouts);

app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '..', 'public')));

// A sessao entra antes de tudo que depende de usuario logado ou de mensagem
// flash: os dois vivem dentro dela.
app.use(sessao);
app.use(mensagensFlash);
app.use(locaisDaView);
app.use(rotas);

// Os dois entram depois de todas as rotas, nesta ordem: o 404 so vale para o
// que nenhuma rota atendeu, e o tratador de erros precisa ser o ultimo de todos
// para receber o que qualquer camada acima encaminhar.
app.use(rotaNaoEncontrada);
app.use(tratadorDeErros);

module.exports = app;
