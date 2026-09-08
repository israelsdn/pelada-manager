-- =========================================================
-- Pelada Manager - modelagem MySQL
-- =========================================================
-- Rode este arquivo uma vez no banco vazio para criar as tabelas:
--   mysql -u seu_usuario -p seu_banco < db/schema.sql
-- =========================================================

CREATE TABLE IF NOT EXISTS pessoas (
  id             CHAR(36)     NOT NULL PRIMARY KEY,
  nome_completo  VARCHAR(150) NOT NULL,
  apelido        VARCHAR(60)  NOT NULL,
  telefone       VARCHAR(11)  NOT NULL UNIQUE,
  ativo          BOOLEAN      NOT NULL DEFAULT FALSE,
  administrador  BOOLEAN      NOT NULL DEFAULT FALSE,
  gols           INT UNSIGNED NOT NULL DEFAULT 0,
  assistencias   INT UNSIGNED NOT NULL DEFAULT 0,
  foto           TEXT         NULL, -- JPEG compactado em data URL (base64)
  criado_em      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS peladas (
  id              CHAR(36)  NOT NULL PRIMARY KEY,
  data_inicio     DATETIME  NOT NULL,   -- sábado 19h (abertura das inscrições)
  dia_evento      DATETIME  NOT NULL,   -- segunda 20h30 (dia do jogo)
  data_termino    DATETIME  NOT NULL,   -- segunda 19h (fim das inscrições)
  responsavel_id  CHAR(36)  NOT NULL,   -- admin que abriu a lista
  criado_em       DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Atualizado manualmente pela aplicação sempre que alguém entra/sai da
  -- lista. Usado para o polling leve de "mudou algo?" (veja lib/pelada-service.ts).
  atualizado_em   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_peladas_responsavel FOREIGN KEY (responsavel_id) REFERENCES pessoas(id),
  INDEX idx_peladas_dia_evento (dia_evento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inscricoes (
  id                CHAR(36) NOT NULL PRIMARY KEY,
  pelada_id         CHAR(36) NOT NULL,
  pessoa_id         CHAR(36) NOT NULL,
  status            ENUM('goleiro', 'jogador', 'suplente') NOT NULL,
  posicao_suplente  ENUM('goleiro', 'jogador') NULL, -- só preenchido quando status = 'suplente'
  device_id         CHAR(36) NOT NULL, -- identifica o aparelho usado na inscrição (antifraude)
  criado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inscricoes_pelada FOREIGN KEY (pelada_id) REFERENCES peladas(id) ON DELETE CASCADE,
  CONSTRAINT fk_inscricoes_pessoa FOREIGN KEY (pessoa_id) REFERENCES pessoas(id),
  UNIQUE KEY uq_inscricoes_pelada_pessoa (pelada_id, pessoa_id), -- 1 inscrição por pessoa por lista
  UNIQUE KEY uq_inscricoes_pelada_device (pelada_id, device_id), -- 1 inscrição por aparelho por lista
  INDEX idx_inscricoes_pelada_status (pelada_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de linha única (id sempre 1) com o texto das regras da pelada.
CREATE TABLE IF NOT EXISTS regras (
  id              TINYINT  NOT NULL PRIMARY KEY DEFAULT 1,
  conteudo        TEXT     NOT NULL,
  atualizado_por  CHAR(36) NULL,
  atualizado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_regras_pessoa FOREIGN KEY (atualizado_por) REFERENCES pessoas(id),
  CONSTRAINT chk_regras_id_unico CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Um voto (nota 0-10) de um admin para um jogador da lista, por pelada.
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

-- Edições do Superclássico e quem ganhou em cada data.
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

-- Linha inicial das regras, para a página não ficar vazia no primeiro acesso.
INSERT IGNORE INTO regras (id, conteudo) VALUES (
  1,
  'Regras da pelada:\n\n1. Chegue 10 minutos antes do horário marcado.\n2. Times sorteados no dia.\n3. Falta = time reduzido.\n\nEdite este texto na aba Regras (só administradores).'
);

-- =========================================================
-- Migração: se você já criou o banco antes dessa alteração,
-- rode só isto (idempotente o suficiente para rodar 1x):
-- =========================================================
-- ALTER TABLE peladas
--   ADD COLUMN atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- =========================================================
-- Migração: tabela de votação (bancos já existentes)
-- =========================================================
-- CREATE TABLE IF NOT EXISTS votos (
--   id          CHAR(36) NOT NULL PRIMARY KEY,
--   pelada_id   CHAR(36) NOT NULL,
--   votante_id  CHAR(36) NOT NULL,
--   votado_id   CHAR(36) NOT NULL,
--   nota        TINYINT  NOT NULL,
--   criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   CONSTRAINT fk_votos_pelada FOREIGN KEY (pelada_id) REFERENCES peladas(id) ON DELETE CASCADE,
--   CONSTRAINT fk_votos_votante FOREIGN KEY (votante_id) REFERENCES pessoas(id),
--   CONSTRAINT fk_votos_votado FOREIGN KEY (votado_id) REFERENCES pessoas(id),
--   CONSTRAINT chk_votos_nota CHECK (nota >= 0 AND nota <= 10),
--   UNIQUE KEY uq_votos_pelada_votante_votado (pelada_id, votante_id, votado_id),
--   INDEX idx_votos_votado (votado_id),
--   INDEX idx_votos_criado_em (criado_em)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- Migração: foto de perfil (bancos já existentes)
-- =========================================================
-- ALTER TABLE pessoas ADD COLUMN foto TEXT NULL;

-- =========================================================
-- Migração: Superclássico (bancos já existentes)
-- =========================================================
-- CREATE TABLE IF NOT EXISTS superclassicos (
--   id              CHAR(36) NOT NULL PRIMARY KEY,
--   data_conquista  DATE     NOT NULL,
--   criado_por      CHAR(36) NOT NULL,
--   criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   CONSTRAINT fk_superclassicos_criador FOREIGN KEY (criado_por) REFERENCES pessoas(id),
--   INDEX idx_superclassicos_data (data_conquista)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- CREATE TABLE IF NOT EXISTS superclassico_vencedores (
--   id                 CHAR(36) NOT NULL PRIMARY KEY,
--   superclassico_id   CHAR(36) NOT NULL,
--   pessoa_id          CHAR(36) NOT NULL,
--   CONSTRAINT fk_sc_vencedores_edicao FOREIGN KEY (superclassico_id) REFERENCES superclassicos(id) ON DELETE CASCADE,
--   CONSTRAINT fk_sc_vencedores_pessoa FOREIGN KEY (pessoa_id) REFERENCES pessoas(id),
--   UNIQUE KEY uq_sc_vencedores_edicao_pessoa (superclassico_id, pessoa_id)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- Bootstrap: criar o primeiro administrador
-- =========================================================
-- Como todo cadastro nasce com ativo = false e só um admin pode ativar
-- outras pessoas, é preciso criar o primeiro admin manualmente uma vez.
-- Troque os valores abaixo e rode direto no banco:
--
-- INSERT INTO pessoas (id, nome_completo, apelido, telefone, ativo, administrador)
-- VALUES (UUID(), 'Seu Nome', 'Seu Apelido', '85999999999', TRUE, TRUE);
-- =========================================================
