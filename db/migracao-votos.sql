-- Migração: votação de notas (0-10) por jogador da lista, por pelada.
-- Rode uma vez no banco já existente:
--   mysql -u seu_usuario -p seu_banco < db/migracao-votos.sql

CREATE TABLE IF NOT EXISTS votos (
  id          CHAR(36) NOT NULL PRIMARY KEY,
  pelada_id   CHAR(36) NOT NULL,
  votante_id  CHAR(36) NOT NULL,
  votado_id   CHAR(36) NOT NULL,
  nota        TINYINT  NOT NULL,
  criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_votos_pelada FOREIGN KEY (pelada_id) REFERENCES peladas(id) ON DELETE CASCADE,
  CONSTRAINT fk_votos_votante FOREIGN KEY (votante_id) REFERENCES pessoas(id),
  CONSTRAINT fk_votos_votado FOREIGN KEY (votado_id) REFERENCES pessoas(id),
  CONSTRAINT chk_votos_nota CHECK (nota >= 0 AND nota <= 10),
  UNIQUE KEY uq_votos_pelada_votante_votado (pelada_id, votante_id, votado_id),
  INDEX idx_votos_votado (votado_id),
  INDEX idx_votos_criado_em (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
