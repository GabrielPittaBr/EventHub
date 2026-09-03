'use strict';

const express = require('express');
const { body } = require('express-validator');

const eventoController = require('../controllers/eventoController');
const { requireOrganizador } = require('../middlewares/autenticacao');

const TAMANHO_MINIMO_DO_TITULO = 5;

const rotasDeEventos = express.Router();

/**
 * Validacoes do formulario de evento, usadas tanto na criacao quanto na edicao.
 * @type {import('express').RequestHandler[]}
 */
const validarEvento = [
  body('titulo')
    .trim()
    .notEmpty()
    .withMessage('Informe o título do evento.')
    .bail()
    .isLength({ min: TAMANHO_MINIMO_DO_TITULO, max: 160 })
    .withMessage(`O título deve ter entre ${TAMANHO_MINIMO_DO_TITULO} e 160 caracteres.`),
  body('descricao')
    .trim()
    .notEmpty()
    .withMessage('Descreva o evento.')
    .bail()
    .isLength({ max: 5000 })
    .withMessage('A descrição deve ter no máximo 5000 caracteres.'),
  body('local')
    .trim()
    .notEmpty()
    .withMessage('Informe o local do evento.')
    .bail()
    .isLength({ max: 160 })
    .withMessage('O local deve ter no máximo 160 caracteres.'),
  body('dataInicio')
    .notEmpty()
    .withMessage('Informe a data de início.')
    .bail()
    .isISO8601()
    .withMessage('Informe uma data de início válida.'),
  body('dataFim')
    .notEmpty()
    .withMessage('Informe a data de término.')
    .bail()
    .isISO8601()
    .withMessage('Informe uma data de término válida.')
    .bail()
    // O formato 'YYYY-MM-DDTHH:MM' ordena como texto igual a data que representa.
    .custom((valor, { req }) => valor > req.body.dataInicio)
    .withMessage('O término deve ser depois do início.'),
  body('vagas')
    .notEmpty()
    .withMessage('Informe a quantidade de vagas.')
    .bail()
    .isInt({ min: 1 })
    .withMessage('As vagas devem ser um número inteiro maior que zero.'),
];

// Antes de '/eventos/:id': na ordem inversa, 'novo' viraria um id.
rotasDeEventos.get('/eventos/novo', requireOrganizador, eventoController.exibirNovo);
rotasDeEventos.post('/eventos', requireOrganizador, validarEvento, eventoController.criar);

rotasDeEventos.get('/eventos/:id', eventoController.exibirDetalhes);
rotasDeEventos.get('/eventos/:id/editar', requireOrganizador, eventoController.exibirEdicao);
rotasDeEventos.put('/eventos/:id', requireOrganizador, validarEvento, eventoController.atualizar);
rotasDeEventos.delete('/eventos/:id', requireOrganizador, eventoController.excluir);

rotasDeEventos.get('/painel', requireOrganizador, eventoController.exibirPainel);

module.exports = rotasDeEventos;
