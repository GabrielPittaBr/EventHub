'use strict';

// A confirmacao antes de excluir mora aqui, e nao em um onsubmit inline,
// porque a CSP do helmet manda script-src-attr 'none': o navegador ignora
// atributo de evento no HTML e o formulario seria enviado sem perguntar nada.
//
// Um unico ouvinte no document atende todo formulario com data-confirmar,
// inclusive os que aparecerem depois.
document.addEventListener('submit', function confirmarEnvio(evento) {
  const pergunta = evento.target.dataset.confirmar;

  if (pergunta && !window.confirm(pergunta)) {
    evento.preventDefault();
  }
});
