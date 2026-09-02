'use strict';

// quiet: true evita o banner do dotenv poluir o log de inicializacao no Render.
require('dotenv').config({ quiet: true });

const PORTA_PADRAO = 3000;
const PORTA_MINIMA = 1;
const PORTA_MAXIMA = 65535;

/**
 * Variaveis sem as quais a aplicacao nao consegue falar com o banco.
 * Sao verificadas na inicializacao para que a falha aponte a variavel ausente
 * em vez de aparecer depois como um erro generico de conexao.
 */
const VARIAVEIS_OBRIGATORIAS = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'DB_SSL_CA',
  'SESSION_SECRET',
];

/**
 * Configuracoes de execucao lidas do ambiente.
 * Nenhum valor sensivel fica no codigo: tudo vem de process.env.
 */
const ambiente = {
  nodeEnv: process.env.NODE_ENV || 'development',
  porta: Number(process.env.PORT) || PORTA_PADRAO,
  banco: {
    host: process.env.DB_HOST,
    // Sem valor padrao de propósito: DB_PORT e obrigatoria e validada em
    // validar(). Um fallback silencioso aqui esconderia um valor invalido e
    // devolveria justamente o erro generico de conexao que queremos evitar.
    porta: Number(process.env.DB_PORT),
    usuario: process.env.DB_USER,
    senha: process.env.DB_PASSWORD,
    nome: process.env.DB_NAME,
    sslCa: process.env.DB_SSL_CA,
  },
  // Segredo que assina o cookie de sessao. Nunca tem fallback no codigo: um
  // valor padrao em producao deixaria qualquer um forjar uma sessao.
  sessaoSegredo: process.env.SESSION_SECRET,
};

ambiente.emProducao = ambiente.nodeEnv === 'production';

/**
 * Garante que todas as variaveis obrigatorias foram preenchidas.
 *
 * @returns {void}
 * @throws {Error} Quando alguma variavel obrigatoria esta ausente, vazia ou
 *   com valor invalido, sempre nomeando a variavel responsavel.
 */
function validar() {
  const ausentes = VARIAVEIS_OBRIGATORIAS.filter((nome) => {
    const valor = process.env[nome];
    return typeof valor !== 'string' || valor.trim() === '';
  });

  if (ausentes.length > 0) {
    throw new Error(
      `Variaveis de ambiente obrigatorias ausentes: ${ausentes.join(', ')}. ` +
        'Copie o .env.example para .env e preencha esses valores.'
    );
  }

  // Estar preenchida nao basta: uma porta invalida so apareceria mais tarde
  // como falha de conexao, sem dizer de onde veio o problema.
  const portaDoBanco = Number(process.env.DB_PORT);
  if (
    !Number.isInteger(portaDoBanco) ||
    portaDoBanco < PORTA_MINIMA ||
    portaDoBanco > PORTA_MAXIMA
  ) {
    throw new Error(
      `DB_PORT precisa ser um numero de porta entre ${PORTA_MINIMA} e ${PORTA_MAXIMA}; ` +
        `valor recebido: "${process.env.DB_PORT}".`
    );
  }
}

ambiente.validar = validar;
ambiente.VARIAVEIS_OBRIGATORIAS = VARIAVEIS_OBRIGATORIAS;

module.exports = ambiente;
