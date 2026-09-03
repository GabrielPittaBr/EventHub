-- EventHub - dados de exemplo para desenvolvimento e testes manuais.
--
-- Seguro para rodar mais de uma vez: cada linha tem id fixo e o
-- ON DUPLICATE KEY UPDATE reaplica os valores em vez de duplicar registros.
--
-- Todos os usuarios abaixo usam a mesma senha de exemplo: Senha@123
-- Ela nunca aparece em texto puro: o que vai para o banco e o hash bcrypt
-- de custo 10 gerado a partir dela.

INSERT INTO usuarios (id, nome, email, senha_hash, papel) VALUES
  (1, 'Ana Organizadora', 'ana.organizadora@eventhub.dev',
   '$2b$10$1YRNgjkTT0elmH.rxIoOzeS6QWuTvvWeViz7oVceb2NvWS80nyNDe', 'organizador'),
  (2, 'Bruno Participante', 'bruno.participante@eventhub.dev',
   '$2b$10$Kq1/WImrXWmdDeA.E4fjp.hYKmZcqTLMlAmyx4Zp2yPwobllvZ31S', 'participante'),
  (3, 'Carla Participante', 'carla.participante@eventhub.dev',
   '$2b$10$MLYgpayspYhAnc774Ym0AOcx0oI0dKgRoKAQ4xEmAgHzZCI.qyXue', 'participante')
ON DUPLICATE KEY UPDATE
  nome = VALUES(nome),
  email = VALUES(email),
  senha_hash = VALUES(senha_hash),
  papel = VALUES(papel);

-- As datas sao relativas a NOW() para que os tres primeiros eventos continuem
-- no futuro e o ultimo continue encerrado, seja qual for o dia do seed.
INSERT INTO eventos (id, titulo, descricao, `local`, data_inicio, data_fim, vagas, organizador_id) VALUES
  (1, 'Semana de Tecnologia',
   'Cinco dias de palestras sobre desenvolvimento web, dados e carreira em TI.',
   'Auditorio Central',
   DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY) + INTERVAL 4 HOUR,
   80, 1),
  (2, 'Oficina de Banco de Dados',
   'Oficina pratica de modelagem relacional e consultas SQL com MySQL.',
   'Laboratorio 3',
   DATE_ADD(NOW(), INTERVAL 18 DAY), DATE_ADD(NOW(), INTERVAL 18 DAY) + INTERVAL 3 HOUR,
   25, 1),
  (3, 'Palestra: Carreira em TI',
   'Conversa aberta sobre primeiro emprego, portfolio e processos seletivos.',
   'Sala 12',
   DATE_ADD(NOW(), INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY) + INTERVAL 2 HOUR,
   40, 1),
  (4, 'Maratona de Programacao 2025',
   'Edicao ja encerrada, mantida para testar a regra que impede inscricao em evento passado.',
   'Auditorio Central',
   DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 6 HOUR,
   60, 1)
ON DUPLICATE KEY UPDATE
  titulo = VALUES(titulo),
  descricao = VALUES(descricao),
  `local` = VALUES(`local`),
  data_inicio = VALUES(data_inicio),
  data_fim = VALUES(data_fim),
  vagas = VALUES(vagas),
  organizador_id = VALUES(organizador_id);

-- Duas inscricoes confirmadas para que a contagem de vagas restantes do
-- ticket 03 ja tenha dado real para exercitar.
INSERT INTO inscricoes (id, evento_id, usuario_id, status) VALUES
  (1, 1, 2, 'confirmada'),
  (2, 1, 3, 'confirmada'),
  (3, 2, 2, 'confirmada')
ON DUPLICATE KEY UPDATE
  evento_id = VALUES(evento_id),
  usuario_id = VALUES(usuario_id),
  status = VALUES(status);
