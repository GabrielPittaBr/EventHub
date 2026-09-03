'use strict';

const { dataJaPassou, paraCampoDataHora, paraDataHoraDoBanco } = require('../helpers/formato');
const { eventoDaUrl, eventoDoOrganizador } = require('../helpers/rota');
const { errosPorCampo } = require('../helpers/validacao');
const eventoModel = require('../models/eventoModel');
const inscricaoModel = require('../models/inscricaoModel');

/**
 * Monta o que o formulario de evento precisa para ser exibido ou reexibido.
 *
 * @param {object} opcoes Opcoes de montagem.
 * @param {object} opcoes.valores Valores dos campos, ja no formato do formulario.
 * @param {Object<string, string>} opcoes.erros Erros por campo.
 * @param {boolean} opcoes.editando Se e edicao (true) ou criacao (false).
 * @param {number} [opcoes.id] Id do evento, obrigatorio na edicao.
 * @returns {object} Dados da view.
 */
function dadosDoFormulario({ valores, erros, editando, id }) {
  return {
    titulo: editando ? 'Editar evento' : 'Novo evento',
    editando,
    id,
    erros,
    valores,
  };
}

/**
 * Extrai do corpo da requisicao os valores do formulario, para repopular os
 * campos quando a validacao recusa o envio.
 *
 * @param {object} corpo Corpo da requisicao.
 * @returns {object} Valores no formato dos campos do formulario.
 */
function valoresDoCorpo(corpo) {
  return {
    titulo: corpo.titulo || '',
    descricao: corpo.descricao || '',
    local: corpo.local || '',
    dataInicio: corpo.dataInicio || '',
    dataFim: corpo.dataFim || '',
    vagas: corpo.vagas || '',
  };
}

/**
 * Exibe a pagina publica de um evento.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Renderiza os detalhes ou a pagina de nao encontrado.
 * @throws {Error} Quando a consulta ao banco falha.
 */
async function exibirDetalhes(req, res, next) {
  try {
    const evento = await eventoDaUrl(req, res);

    if (!evento) {
      return;
    }

    const usuario = req.session.usuario;
    const inscricao = usuario
      ? await inscricaoModel.buscarDeUsuarioEmEvento(evento.id, usuario.id)
      : null;

    res.render('eventos/detalhes', {
      titulo: evento.titulo,
      evento,
      inscricao,
      inscricoesEncerradas: dataJaPassou(evento.data_inicio),
    });
  } catch (erro) {
    next(erro);
  }
}

/**
 * Lista os eventos do organizador logado.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Renderiza o painel.
 * @throws {Error} Quando a consulta ao banco falha.
 */
async function exibirPainel(req, res, next) {
  try {
    const eventos = await eventoModel.listarPorOrganizador(req.session.usuario.id);

    res.render('eventos/painel', { titulo: 'Painel do organizador', eventos });
  } catch (erro) {
    next(erro);
  }
}

/**
 * Exibe o formulario de criacao de evento.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Renderiza o formulario vazio.
 * @throws {Error} Quando a renderizacao falha.
 */
async function exibirNovo(req, res, next) {
  try {
    res.render(
      'eventos/formulario',
      dadosDoFormulario({ valores: valoresDoCorpo({}), erros: {}, editando: false })
    );
  } catch (erro) {
    next(erro);
  }
}

/**
 * Cria o evento em nome do organizador da sessao.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Redireciona para o painel ou reexibe o formulario.
 * @throws {Error} Quando o banco falha.
 */
async function criar(req, res, next) {
  try {
    const erros = errosPorCampo(req);

    if (Object.keys(erros).length > 0) {
      res.status(422).render(
        'eventos/formulario',
        dadosDoFormulario({ valores: valoresDoCorpo(req.body), erros, editando: false })
      );
      return;
    }

    const { titulo, descricao, local, dataInicio, dataFim, vagas } = req.body;

    const id = await eventoModel.criar({
      titulo,
      descricao,
      local,
      dataInicio: paraDataHoraDoBanco(dataInicio),
      dataFim: paraDataHoraDoBanco(dataFim),
      vagas: Number(vagas),
      // Sempre da sessao: pelo formulario, qualquer um publicaria em nome de outro.
      organizadorId: req.session.usuario.id,
    });

    req.adicionarMensagem('sucesso', 'Evento criado.');
    res.redirect(`/eventos/${id}`);
  } catch (erro) {
    next(erro);
  }
}

/**
 * Exibe o formulario de edicao, apenas para o dono do evento.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Renderiza o formulario preenchido.
 * @throws {Error} Quando o banco falha.
 */
async function exibirEdicao(req, res, next) {
  try {
    const evento = await eventoDoOrganizador(req, res);

    if (!evento) {
      return;
    }

    res.render(
      'eventos/formulario',
      dadosDoFormulario({
        id: evento.id,
        editando: true,
        erros: {},
        valores: {
          titulo: evento.titulo,
          descricao: evento.descricao || '',
          local: evento.local,
          dataInicio: paraCampoDataHora(evento.data_inicio),
          dataFim: paraCampoDataHora(evento.data_fim),
          vagas: String(evento.vagas),
        },
      })
    );
  } catch (erro) {
    next(erro);
  }
}

/**
 * Atualiza o evento, apenas para o dono.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Redireciona para o evento ou reexibe o formulario.
 * @throws {Error} Quando o banco falha.
 */
async function atualizar(req, res, next) {
  try {
    const evento = await eventoDoOrganizador(req, res);

    if (!evento) {
      return;
    }

    const erros = errosPorCampo(req);

    if (Object.keys(erros).length > 0) {
      res.status(422).render(
        'eventos/formulario',
        dadosDoFormulario({
          id: evento.id,
          editando: true,
          erros,
          valores: valoresDoCorpo(req.body),
        })
      );
      return;
    }

    const { titulo, descricao, local, dataInicio, dataFim, vagas } = req.body;

    await eventoModel.atualizar(evento.id, {
      titulo,
      descricao,
      local,
      dataInicio: paraDataHoraDoBanco(dataInicio),
      dataFim: paraDataHoraDoBanco(dataFim),
      vagas: Number(vagas),
    });

    req.adicionarMensagem('sucesso', 'Evento atualizado.');
    res.redirect(`/eventos/${evento.id}`);
  } catch (erro) {
    next(erro);
  }
}

/**
 * Exclui o evento, apenas para o dono.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @param {import('express').NextFunction} next Encaminha o erro ao tratador central.
 * @returns {Promise<void>} Redireciona para o painel.
 * @throws {Error} Quando o banco falha.
 */
async function excluir(req, res, next) {
  try {
    const evento = await eventoDoOrganizador(req, res);

    if (!evento) {
      return;
    }

    await eventoModel.excluir(evento.id);

    req.adicionarMensagem('sucesso', 'Evento excluido.');
    res.redirect('/painel');
  } catch (erro) {
    next(erro);
  }
}

module.exports = {
  exibirDetalhes,
  exibirPainel,
  exibirNovo,
  criar,
  exibirEdicao,
  atualizar,
  excluir,
};
