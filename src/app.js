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

// Sem confiar no proxy do Render o cookie "secure" nunca grava.
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.set('layout', 'layout');
app.use(expressLayouts);

app.use(helmet());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(sessao);
app.use(mensagensFlash);
app.use(locaisDaView);
app.use(rotas);

// Depois de todas as rotas, e o tratador de erros por ultimo de todos.
app.use(rotaNaoEncontrada);
app.use(tratadorDeErros);

module.exports = app;
