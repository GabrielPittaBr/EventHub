-- EventHub - estrutura do banco.
-- Seguro para rodar mais de uma vez: nada aqui apaga dados existentes.

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  papel ENUM('organizador', 'participante') NOT NULL DEFAULT 'participante',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS eventos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo VARCHAR(160) NOT NULL,
  descricao TEXT NULL,
  `local` VARCHAR(160) NOT NULL,
  data_inicio DATETIME NOT NULL,
  data_fim DATETIME NOT NULL,
  vagas INT UNSIGNED NOT NULL,
  organizador_id INT UNSIGNED NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_eventos_organizador (organizador_id),
  KEY idx_eventos_data_inicio (data_inicio),
  CONSTRAINT fk_eventos_organizador
    FOREIGN KEY (organizador_id) REFERENCES usuarios (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inscricoes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  evento_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  status ENUM('confirmada', 'cancelada') NOT NULL DEFAULT 'confirmada',
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Uma inscricao por participante em cada evento: reinscrever apos cancelar
  -- reaproveita a linha em vez de criar outra.
  UNIQUE KEY uk_inscricoes_evento_usuario (evento_id, usuario_id),
  KEY idx_inscricoes_usuario (usuario_id),
  CONSTRAINT fk_inscricoes_evento
    FOREIGN KEY (evento_id) REFERENCES eventos (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_inscricoes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
