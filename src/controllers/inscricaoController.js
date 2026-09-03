'use strict';

const { dataJaPassou } = require('../helpers/formato');
const {
  acessoNegado,
  eventoDaUrl,
  eventoDoOrganizador,
  idValido,
  naoEncontrado,
} = require('../helpers/rota');
const inscricaoModel = require('../models/inscricaoModel');

/**
 * Mensagem de cada desfecho possivel de uma tentativa de inscricao. Cada recusa
 * tem o seu proprio texto: quem foi barrado precisa saber se o evento lotou, se
 * ja passou ou se ele mesmo ja estava inscrito.
 * @type {Object<string, {tipo: string, texto: string}>}
 */
const AVISO_DA_INSCRICAO = {
  [inscricaoModel.RESULTADO.CONFIRMADA]: {
    tipo: 'sucesso',
    texto: 'Inscricao confirmada.',
  },
  [inscricaoModel.RESULTADO.JA_INSCRITO]: {
    tipo: 'info',
    texto: 'Voce ja esta inscrito neste evento.',
  },
  [inscricaoModel.RESULTADO.LOTADO]: {
    tipo: 'erro',
    texto: 'Este evento ja preencheu todas as vagas.',
  },
};

/** Recusa por prazo, decidida antes de abrir a transacao. */
const AVISO_DE_PRAZO = 'Este evento ja comecou: as inscricoes estao encerradas.';

/**
 * Inscreve o usuario da sessao no evento da URL.
 *
 * O `usuario_id` sai da sessao, nunca do formulario: aceita-lo do corpo da
 * requisicao deixaria qualquer um inscrever outra pessoa.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Redireciona para a pagina do evento.
 * @throws {Error} Quando o banco falha.
 */
async function inscrever(req, res, next) {
  try {
    const evento = await eventoDaUrl(req, res);

    if (!evento) {
      return;
    }

    if (dataJaPassou(evento.data_inicio)) {
      req.adicionarMensagem('erro', AVISO_DE_PRAZO);
      res.redirect(`/eventos/${evento.id}`);
      return;
    }

    const resultado = await inscricaoModel.confirmar(evento.id, req.session.usuario.id);

    if (resultado === inscricaoModel.RESULTADO.EVENTO_INEXISTENTE) {
      naoEncontrado(res);
      return;
    }

    const aviso = AVISO_DA_INSCRICAO[resultado];

    req.adicionarMensagem(aviso.tipo, aviso.texto);
    res.redirect(`/eventos/${evento.id}`);
  } catch (erro) {
    next(erro);
  }
}

/**
 * Cancela uma inscricao, liberando a vaga.
 *
 * A dona da inscricao e conferida no servidor: um DELETE forjado com o id da
 * inscricao de outra pessoa para aqui com 403, mesmo que o botao nunca tenha
 * sido mostrado.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Redireciona para a pagina do evento.
 * @throws {Error} Quando o banco falha.
 */
async function cancelar(req, res, next) {
  try {
    const id = idValido(req.params.id);
    const inscricao = id === null ? null : await inscricaoModel.buscarPorId(id);

    if (!inscricao) {
      naoEncontrado(res);
      return;
    }

    if (inscricao.usuario_id !== req.session.usuario.id) {
      acessoNegado(res);
      return;
    }

    if (inscricao.status === 'cancelada') {
      req.adicionarMensagem('info', 'Esta inscricao ja estava cancelada.');
    } else {
      await inscricaoModel.cancelar(inscricao.evento_id, inscricao.usuario_id);
      req.adicionarMensagem(
        'sucesso',
        'Inscricao cancelada. A vaga voltou a ficar disponivel.'
      );
    }

    res.redirect(`/eventos/${inscricao.evento_id}`);
  } catch (erro) {
    next(erro);
  }
}

/**
 * Lista as inscricoes do usuario logado.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Renderiza a lista.
 * @throws {Error} Quando a consulta ao banco falha.
 */
async function exibirMinhas(req, res, next) {
  try {
    const inscricoes = await inscricaoModel.listarDeUsuario(req.session.usuario.id);

    res.render('inscricoes/minhas', { titulo: 'Minhas inscricoes', inscricoes });
  } catch (erro) {
    next(erro);
  }
}

/**
 * Lista os inscritos de um evento, apenas para o organizador dono dele.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Renderiza a lista de inscritos.
 * @throws {Error} Quando a consulta ao banco falha.
 */
async function exibirInscritos(req, res, next) {
  try {
    const evento = await eventoDoOrganizador(req, res);

    if (!evento) {
      return;
    }

    const inscritos = await inscricaoModel.listarInscritosDeEvento(evento.id);

    res.render('eventos/inscritos', {
      titulo: `Inscritos em ${evento.titulo}`,
      evento,
      inscritos,
    });
  } catch (erro) {
    next(erro);
  }
}

module.exports = { inscrever, cancelar, exibirMinhas, exibirInscritos };
