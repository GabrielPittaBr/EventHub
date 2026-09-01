'use strict';

const express = require('express');

const homeController = require('../controllers/homeController');
const saudeController = require('../controllers/saudeController');

const rotas = express.Router();

rotas.get('/', homeController.exibirHome);
rotas.get('/health', saudeController.verificar);

module.exports = rotas;
