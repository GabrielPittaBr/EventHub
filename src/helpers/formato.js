'use strict';

/**
 * Formatacao de datas para as telas.
 *
 * O MySQL devolve DATETIME como Date lido no fuso da maquina, e o campo
 * datetime-local do formulario tambem trabalha em hora local. Por isso tudo
 * aqui usa os metodos locais do Date: converter para UTC no meio do caminho
 * deslocaria o horario que o organizador digitou.
 */

/**
 * Completa com zero a esquerda os pedacos de data.
 *
 * @param {number} numero Valor de dia, mes, hora ou minuto.
 * @returns {string} Numero com dois digitos.
 */
function doisDigitos(numero) {
  return String(numero).padStart(2, '0');
}

/**
 * Converte para Date o que vem do banco ou do formulario.
 *
 * @param {Date|string} valor Data a converter.
 * @returns {Date|null} Data valida ou null.
 */
function paraData(valor) {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor;
  }

  if (typeof valor !== 'string' || valor.trim() === '') {
    return null;
  }

  // Sem o T, o Date leria o valor como UTC em vez de hora local.
  const data = new Date(valor.replace(' ', 'T'));
  return Number.isNaN(data.getTime()) ? null : data;
}

/**
 * Quebra a data nos pedacos ja com dois digitos, que e do que os dois formatos
 * abaixo precisam — eles mudam so na ordem e nos separadores.
 *
 * @param {Date|string} valor Data a converter.
 * @returns {{ano: string, mes: string, dia: string, hora: string, minuto: string}|null}
 *   Pedacos da data, ou null quando o valor nao e uma data valida.
 */
function pedacosDaData(valor) {
  const data = paraData(valor);

  if (!data) {
    return null;
  }

  return {
    ano: String(data.getFullYear()),
    mes: doisDigitos(data.getMonth() + 1),
    dia: doisDigitos(data.getDate()),
    hora: doisDigitos(data.getHours()),
    minuto: doisDigitos(data.getMinutes()),
  };
}

/**
 * Diz se uma data ja ficou para tras. E esta a regra que fecha as inscricoes:
 * evento que ja comecou nao aceita mais ninguem.
 *
 * @param {Date|string} valor Data vinda do banco.
 * @returns {boolean} true quando a data e valida e ja passou.
 */
function dataJaPassou(valor) {
  const data = paraData(valor);

  return data !== null && data.getTime() <= Date.now();
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Devolve a data em pedacos separados, que e o que a coluna de data da lista
 * de eventos monta: dia grande, mes abreviado e ano miudo.
 *
 * @param {Date|string} valor Data vinda do banco.
 * @returns {{dia: string, mes: string, ano: string, hora: string}|null}
 *   Pedacos prontos para a tela, ou null quando a data nao e valida.
 */
function partesDaData(valor) {
  const pedacos = pedacosDaData(valor);

  if (!pedacos) {
    return null;
  }

  return {
    dia: pedacos.dia,
    mes: MESES[Number(pedacos.mes) - 1],
    ano: pedacos.ano,
    hora: `${pedacos.hora}:${pedacos.minuto}`,
  };
}

/**
 * Formata uma data para leitura na tela, no padrao brasileiro.
 *
 * @param {Date|string} valor Data vinda do banco.
 * @returns {string} Data como 'dd/mm/aaaa às HH:MM', ou string vazia.
 */
function formatarDataHora(valor) {
  const pedacos = pedacosDaData(valor);

  if (!pedacos) {
    return '';
  }

  return `${pedacos.dia}/${pedacos.mes}/${pedacos.ano} às ${pedacos.hora}:${pedacos.minuto}`;
}

/**
 * Formata uma data para preencher um `<input type="datetime-local">`, que so
 * aceita exatamente 'YYYY-MM-DDTHH:MM'.
 *
 * @param {Date|string} valor Data vinda do banco.
 * @returns {string} Valor aceito pelo campo, ou string vazia.
 */
function paraCampoDataHora(valor) {
  const pedacos = pedacosDaData(valor);

  if (!pedacos) {
    return '';
  }

  return `${pedacos.ano}-${pedacos.mes}-${pedacos.dia}T${pedacos.hora}:${pedacos.minuto}`;
}

/**
 * Converte o valor do campo datetime-local para o formato que o MySQL grava.
 *
 * @param {string} valor Valor enviado pelo formulario ('YYYY-MM-DDTHH:MM').
 * @returns {string} Data como 'YYYY-MM-DD HH:MM:SS'.
 */
function paraDataHoraDoBanco(valor) {
  if (typeof valor !== 'string' || valor.trim() === '') {
    return '';
  }

  const semT = valor.trim().replace('T', ' ');

  // O campo do navegador nao manda os segundos; o MySQL espera o horario completo.
  return semT.length === 16 ? `${semT}:00` : semT;
}

module.exports = {
  dataJaPassou,
  formatarDataHora,
  paraCampoDataHora,
  paraDataHoraDoBanco,
  partesDaData,
};
