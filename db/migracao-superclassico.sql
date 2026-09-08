-- Migração: histórico do Superclássico.
-- Rode uma vez no banco já existente:
--   mysql -u seu_usuario -p seu_banco < db/migracao-superclassico.sql

CREATE TABLE IF NOT EXISTS superclassicos (
  id              CHAR(36) NOT NULL PRIMARY KEY,
  data_conquista  DATE     NOT NULL,
  criado_por      CHAR(36) NOT NULL,
  criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_superclassicos_criador FOREIGN KEY (criado_por) REFERENCES pessoas(id),
  INDEX idx_superclassicos_data (data_conquista)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS superclassico_vencedores (
  id                 CHAR(36) NOT NULL PRIMARY KEY,
  superclassico_id   CHAR(36) NOT NULL,
  pessoa_id          CHAR(36) NOT NULL,
  CONSTRAINT fk_sc_vencedores_edicao FOREIGN KEY (superclassico_id) REFERENCES superclassicos(id) ON DELETE CASCADE,
  CONSTRAINT fk_sc_vencedores_pessoa FOREIGN KEY (pessoa_id) REFERENCES pessoas(id),
  UNIQUE KEY uq_sc_vencedores_edicao_pessoa (superclassico_id, pessoa_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
