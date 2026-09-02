'use strict';

const express = require('express');

const rotasDeAuth = require('./auth');
const rotasDeEventos = require('./eventos');
const rotasDeInscricoes = require('./inscricoes');
const homeController = require('../controllers/homeController');
const saudeController = require('../controllers/saudeController');

const rotas = express.Router();

rotas.use('/auth', rotasDeAuth);
rotas.use(rotasDeEventos);
rotas.use(rotasDeInscricoes);

rotas.get('/', homeController.exibirHome);
rotas.get('/health', saudeController.verificar);

module.exports = rotas;
