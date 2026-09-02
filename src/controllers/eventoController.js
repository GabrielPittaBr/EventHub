'use strict';

const { paraCampoDataHora, paraDataHoraDoBanco } = require('../helpers/formato');
const { errosPorCampo } = require('../helpers/validacao');
const eventoModel = require('../models/eventoModel');

/**
 * Le o id da URL aceitando apenas inteiro positivo.
 *
 * Um id como "abc" ou "9 OR 1=1" vira null e o chamador responde 404, em vez de
 * chegar ao banco e virar erro 500.
 *
 * @param {string} valor Trecho da URL.
 * @returns {number|null} Id valido ou null.
 */
function idValido(valor) {
  return /^[1-9]\d*$/.test(valor) ? Number(valor) : null;
}

/**
 * Responde a pagina de nao encontrado.
 *
 * @param {import('express').Response} res Resposta HTTP.
 * @returns {void}
 */
function naoEncontrado(res) {
  res.status(404).render('erros/404', { titulo: 'Pagina nao encontrada' });
}

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
 * Busca o evento apontado pela URL, respondendo 404 quando o id nao presta ou
 * nao existe evento com ele.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @returns {Promise<object|null>} O evento, ou null quando o 404 ja foi enviado.
 * @throws {Error} Quando a consulta ao banco falha.
 */
async function eventoDaUrl(req, res) {
  const id = idValido(req.params.id);

  if (id === null) {
    naoEncontrado(res);
    return null;
  }

  const evento = await eventoModel.buscarPorId(id);

  if (!evento) {
    naoEncontrado(res);
    return null;
  }

  return evento;
}

/**
 * Busca o evento da URL e confere se ele pertence a quem esta pedindo.
 *
 * Esta e a regra de propriedade do ticket: ela roda no servidor em toda acao de
 * edicao e exclusao, entao esconder o botao na tela nunca e a unica barreira —
 * um PUT ou DELETE forjado para um evento alheio para aqui.
 *
 * @async
 * @param {import('express').Request} req Requisicao HTTP.
 * @param {import('express').Response} res Resposta HTTP.
 * @returns {Promise<object|null>} O evento quando o acesso e permitido; null
 *   quando a resposta (404 ou 403) ja foi enviada.
 * @throws {Error} Quando a consulta ao banco falha.
 */
async function eventoDoOrganizador(req, res) {
  const evento = await eventoDaUrl(req, res);

  if (!evento) {
    return null;
  }

  if (evento.organizador_id !== req.session.usuario.id) {
    res.status(403).render('erros/403', { titulo: 'Acesso negado' });
    return null;
  }

  return evento;
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

    res.render('eventos/detalhes', { titulo: evento.titulo, evento });
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
      // Vem sempre da sessao. Aceitar um organizador_id do formulario deixaria
      // qualquer um publicar evento em nome de outra pessoa.
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
