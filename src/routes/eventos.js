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
    .withMessage('Informe o titulo do evento.')
    .bail()
    .isLength({ min: TAMANHO_MINIMO_DO_TITULO, max: 160 })
    .withMessage(`O titulo deve ter entre ${TAMANHO_MINIMO_DO_TITULO} e 160 caracteres.`),
  body('descricao')
    .trim()
    .notEmpty()
    .withMessage('Descreva o evento.')
    .bail()
    .isLength({ max: 5000 })
    .withMessage('A descricao deve ter no maximo 5000 caracteres.'),
  body('local')
    .trim()
    .notEmpty()
    .withMessage('Informe o local do evento.')
    .bail()
    .isLength({ max: 160 })
    .withMessage('O local deve ter no maximo 160 caracteres.'),
  body('dataInicio')
    .notEmpty()
    .withMessage('Informe a data de inicio.')
    .bail()
    .isISO8601()
    .withMessage('Informe uma data de inicio valida.'),
  body('dataFim')
    .notEmpty()
    .withMessage('Informe a data de termino.')
    .bail()
    .isISO8601()
    .withMessage('Informe uma data de termino valida.')
    .bail()
    // Comparar como texto funciona porque o campo datetime-local sempre chega
    // no formato 'YYYY-MM-DDTHH:MM', que ordena igual a data que representa.
    .custom((valor, { req }) => valor > req.body.dataInicio)
    .withMessage('O termino deve ser depois do inicio.'),
  body('vagas')
    .notEmpty()
    .withMessage('Informe a quantidade de vagas.')
    .bail()
    .isInt({ min: 1 })
    .withMessage('As vagas devem ser um numero inteiro maior que zero.'),
];

// Vem antes de '/eventos/:id' de proposito: na ordem inversa, 'novo' seria
// lido como um id.
rotasDeEventos.get('/eventos/novo', requireOrganizador, eventoController.exibirNovo);
rotasDeEventos.post('/eventos', requireOrganizador, validarEvento, eventoController.criar);

rotasDeEventos.get('/eventos/:id', eventoController.exibirDetalhes);
rotasDeEventos.get('/eventos/:id/editar', requireOrganizador, eventoController.exibirEdicao);
rotasDeEventos.put('/eventos/:id', requireOrganizador, validarEvento, eventoController.atualizar);
rotasDeEventos.delete('/eventos/:id', requireOrganizador, eventoController.excluir);

rotasDeEventos.get('/painel', requireOrganizador, eventoController.exibirPainel);

module.exports = rotasDeEventos;
