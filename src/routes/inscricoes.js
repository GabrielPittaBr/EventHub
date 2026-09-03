'use strict';

const express = require('express');

const inscricaoController = require('../controllers/inscricaoController');
const { requireAuth, requireOrganizador } = require('../middlewares/autenticacao');

const rotasDeInscricoes = express.Router();

rotasDeInscricoes.post('/eventos/:id/inscricoes', requireAuth, inscricaoController.inscrever);
rotasDeInscricoes.delete('/inscricoes/:id', requireAuth, inscricaoController.cancelar);

rotasDeInscricoes.get('/minhas-inscricoes', requireAuth, inscricaoController.exibirMinhas);

// A posse do evento quem confere e o controller.
rotasDeInscricoes.get(
  '/eventos/:id/inscritos',
  requireOrganizador,
  inscricaoController.exibirInscritos
);

module.exports = rotasDeInscricoes;
