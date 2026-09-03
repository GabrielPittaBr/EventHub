'use strict';

// A CSP do helmet manda script-src-attr 'none': onsubmit inline nao roda.
// Um ouvinte no document atende todo formulario com data-confirmar.
document.addEventListener('submit', function confirmarEnvio(evento) {
  const pergunta = evento.target.dataset.confirmar;

  if (pergunta && !window.confirm(pergunta)) {
    evento.preventDefault();
  }
});
