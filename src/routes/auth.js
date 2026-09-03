'use strict';

const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/authController');

const TAMANHO_MINIMO_DA_SENHA = 8;
const PAPEIS = ['organizador', 'participante'];

const rotasDeAuth = express.Router();

/**
 * Validacoes do formulario de criacao de conta. Ficam junto da rota que as
 * usa, antes do controller, para que o controller so receba dados ja checados.
 * @type {import('express').RequestHandler[]}
 */
const validarRegistro = [
  body('nome')
    .trim()
    .notEmpty()
    .withMessage('Informe o seu nome.')
    .bail()
    .isLength({ min: 3, max: 120 })
    .withMessage('O nome deve ter entre 3 e 120 caracteres.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Informe o seu e-mail.')
    .bail()
    .isEmail()
    .withMessage('Informe um e-mail válido.')
    .bail()
    .isLength({ max: 180 })
    .withMessage('O e-mail deve ter no máximo 180 caracteres.')
    .normalizeEmail(),
  body('senha')
    .notEmpty()
    .withMessage('Informe uma senha.')
    .bail()
    .isLength({ min: TAMANHO_MINIMO_DA_SENHA })
    .withMessage(`A senha deve ter pelo menos ${TAMANHO_MINIMO_DA_SENHA} caracteres.`),
  body('confirmacaoSenha')
    .notEmpty()
    .withMessage('Confirme a senha.')
    .bail()
    .custom((valor, { req }) => valor === req.body.senha)
    .withMessage('A confirmação não confere com a senha.'),
  body('papel')
    .isIn(PAPEIS)
    .withMessage('Escolha entre organizador e participante.'),
];

/**
 * Validacoes do login. Mais frouxas de proposito: quem erra a credencial recebe
 * a mesma mensagem generica, entao nao faz sentido cobrar tamanho de senha aqui.
 * @type {import('express').RequestHandler[]}
 */
const validarLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Informe o seu e-mail.')
    .bail()
    .isEmail()
    .withMessage('Informe um e-mail válido.')
    .normalizeEmail(),
  body('senha').notEmpty().withMessage('Informe a sua senha.'),
];

rotasDeAuth.get('/registrar', authController.exibirRegistro);
rotasDeAuth.post('/registrar', validarRegistro, authController.registrar);

rotasDeAuth.get('/login', authController.exibirLogin);
rotasDeAuth.post('/login', validarLogin, authController.entrar);

rotasDeAuth.post('/logout', authController.sair);

module.exports = rotasDeAuth;
