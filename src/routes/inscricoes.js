'use strict';

const express = require('express');

const inscricaoController = require('../controllers/inscricaoController');
const { requireAuth, requireOrganizador } = require('../middlewares/autenticacao');

const rotasDeInscricoes = express.Router();

// A inscricao nasce debaixo do evento porque e dele que ela depende; o
// cancelamento fica na propria inscricao, que e o que o participante possui.
rotasDeInscricoes.post('/eventos/:id/inscricoes', requireAuth, inscricaoController.inscrever);
rotasDeInscricoes.delete('/inscricoes/:id', requireAuth, inscricaoController.cancelar);

rotasDeInscricoes.get('/minhas-inscricoes', requireAuth, inscricaoController.exibirMinhas);

// Lista de quem se inscreveu: alem de organizador, precisa ser o dono do
// evento — quem confere isso e o controller.
rotasDeInscricoes.get(
  '/eventos/:id/inscritos',
  requireOrganizador,
  inscricaoController.exibirInscritos
);

module.exports = rotasDeInscricoes;
