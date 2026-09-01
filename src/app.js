'use strict';

const path = require('path');

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const methodOverride = require('method-override');

const locaisDaView = require('./middlewares/locaisDaView');
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

app.use(locaisDaView);
app.use(rotas);

module.exports = app;
