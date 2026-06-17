/**
 * NEXUS PAINEL — Seed do banco de dados
 * Uso: node server/seed.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function seed() {
  var dbConf;
  if (process.env.DATABASE_URL) {
    dbConf = { uri: process.env.DATABASE_URL, multipleStatements: true };
  } else {
    dbConf = {
      host:     process.env.DB_HOST || 'localhost',
      port:     process.env.DB_PORT || 3306,
      user:     process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      multipleStatements: true
    };
  }

  const conn = await mysql.createConnection(dbConf);

  console.log('  Criando banco de dados…');

  if (process.env.DATABASE_URL) {
    // Railway: banco já existe, usa direto
    await conn.query('USE ' + (process.env.DB_NAME || 'nexus_painel'));
    // Dropar tudo para recriar
    await conn.query('DROP TABLE IF EXISTS chat_mensagens, transmissoes, stream_config, metricas_diarias, membros, agendamentos, usuarios');
  } else {
    await conn.query('DROP DATABASE IF EXISTS nexus_painel');
    await conn.query('CREATE DATABASE nexus_painel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await conn.query('USE nexus_painel');
  }

  // Schema
  await conn.query(`
    CREATE TABLE usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(120) NOT NULL UNIQUE,
      senha_hash VARCHAR(255) NOT NULL,
      avatar MEDIUMTEXT DEFAULT NULL,
      bio TEXT DEFAULT NULL,
      stream_key VARCHAR(64) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;

    CREATE TABLE agendamentos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      titulo VARCHAR(150) NOT NULL,
      categoria VARCHAR(60) DEFAULT NULL,
      data DATE NOT NULL,
      hora TIME NOT NULL,
      descricao TEXT DEFAULT NULL,
      status ENUM('agendada','rascunho','planejamento','cancelada') NOT NULL DEFAULT 'agendada',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE membros (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      nome VARCHAR(100) NOT NULL,
      username VARCHAR(50) NOT NULL,
      avatar VARCHAR(255) DEFAULT NULL,
      nivel ENUM('VIP','MOD','SUB','NEW') NOT NULL DEFAULT 'NEW',
      seguidores INT DEFAULT 0,
      horas_assistidas DECIMAL(10,1) DEFAULT 0,
      ultima_visita TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      entrou_em DATE DEFAULT (CURRENT_DATE),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE metricas_diarias (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      data DATE NOT NULL,
      visualizacoes INT DEFAULT 0,
      novos_seguidores INT DEFAULT 0,
      horas_transmitidas DECIMAL(6,1) DEFAULT 0,
      avg_espectadores DECIMAL(6,1) DEFAULT 0,
      pico_espectadores INT DEFAULT 0,
      chat_mensagens INT DEFAULT 0,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      UNIQUE KEY uk_usuario_data (usuario_id, data)
    ) ENGINE=InnoDB;

    CREATE TABLE transmissoes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      titulo VARCHAR(150) DEFAULT NULL,
      data_inicio DATETIME DEFAULT NULL,
      data_fim DATETIME DEFAULT NULL,
      status ENUM('ao_vivo','encerrada','cancelada') NOT NULL DEFAULT 'ao_vivo',
      qualidade VARCHAR(20) DEFAULT '1080p',
      bitrate INT DEFAULT 6000,
      servidor VARCHAR(60) DEFAULT 'São Paulo',
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE stream_config (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL UNIQUE,
      qualidade VARCHAR(20) DEFAULT '1080p',
      bitrate INT DEFAULT 6000,
      servidor_ingest VARCHAR(60) DEFAULT 'São Paulo',
      notif_seguidores TINYINT(1) DEFAULT 1,
      notif_gift TINYINT(1) DEFAULT 1,
      notif_lembrete TINYINT(1) DEFAULT 1,
      notif_relatorio TINYINT(1) DEFAULT 1,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;

    CREATE TABLE chat_mensagens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      transmissao_id INT NOT NULL,
      usuario_id INT NOT NULL,
      mensagem TEXT NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transmissao_id) REFERENCES transmissoes(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  console.log('  Tabelas criadas.');

  // Ensure avatar column is MEDIUMTEXT (dataURLs can exceed 64KB)
  try {
    await conn.query('ALTER TABLE usuarios MODIFY COLUMN avatar MEDIUMTEXT DEFAULT NULL');
  } catch (_) {}

  // Seed data
  const hash = await bcrypt.hash('12345678', 10);

  await conn.query(`
    INSERT INTO usuarios (nome, username, email, senha_hash, bio, stream_key) VALUES
    ('Lucas Silva', 'lucassilva', 'lucas@email.com', '${hash}',
     'Streamer de tecnologia e games', 'NXS-a7f2-k9d1-m4p8'),
    ('Cria Conteudo', 'criaconteudo', 'teste@email.com', '${hash}',
     'Criador de conteudo multiplataforma', 'NXS-b3x8-l2n5-p7q1');
  `);

  console.log('  Usuários inseridos (senha: 12345678).');

  await conn.query(`
    INSERT INTO agendamentos (usuario_id, titulo, categoria, data, hora, descricao, status) VALUES
    (1, 'React Native na prática', 'Desenvolvimento', '2026-07-10', '19:00', 'Construindo um app do zero com React Native', 'agendada'),
    (1, 'Gameplay de RPG', 'Games', '2026-07-12', '20:30', 'Novo RPG indie que descobri', 'rascunho'),
    (1, 'Review de hardware', 'Tecnologia', '2026-07-15', '18:00', 'Analisando a nova placa de video', 'planejamento'),
    (1, 'Live de aniversário', 'Comunidade', '2026-07-20', '21:00', 'Live especial de 1 ano de canal', 'agendada'),
    (2, 'Introdução ao JavaScript', 'Desenvolvimento', '2026-07-11', '15:00', 'Aula gratuita de JS para iniciantes', 'agendada');
  `);

  console.log('  Agendamentos inseridos.');

  await conn.query(`
    INSERT INTO membros (usuario_id, nome, username, nivel, seguidores, horas_assistidas) VALUES
    (1, 'Rafael Costa', 'rafacosta', 'VIP', 1240, 320.5),
    (1, 'Maria Oliveira', 'mari_oli', 'SUB', 892, 180.2),
    (1, 'João Santos', 'joaosantos', 'MOD', 48, 520.0),
    (1, 'Ana Pereira', 'aninhap', 'SUB', 445, 95.8),
    (1, 'Carlos Mendes', 'carlosm', 'VIP', 2300, 610.0),
    (1, 'Beatriz Lima', 'bialima', 'NEW', 120, 12.5),
    (1, 'Eduardo Rocha', 'durocha', 'MOD', 67, 430.2);
  `);

  console.log('  Membros inseridos.');

  await conn.query(`
    INSERT INTO metricas_diarias (usuario_id, data, visualizacoes, novos_seguidores, horas_transmitidas, avg_espectadores, pico_espectadores, chat_mensagens) VALUES
    (1, '2026-07-01', 15420, 89, 6.5, 2380, 4200, 1250),
    (1, '2026-07-02', 12458, 72, 5.0, 2150, 3800, 980),
    (1, '2026-07-03', 18300, 105, 7.2, 3100, 5100, 1560),
    (1, '2026-07-04', 9870, 45, 4.0, 1780, 2900, 720),
    (1, '2026-07-05', 22100, 130, 8.0, 3500, 6200, 1890),
    (1, '2026-07-06', 14200, 78, 5.5, 2250, 4000, 1100),
    (1, '2026-07-07', 16500, 92, 6.0, 2480, 4500, 1340);
  `);

  console.log('  Métricas inseridas.');

  await conn.query(`
    INSERT INTO stream_config (usuario_id, qualidade, bitrate, servidor_ingest) VALUES
    (1, '1080p', 6000, 'São Paulo'),
    (2, '1080p', 4500, 'São Paulo');
  `);

  console.log('  Configurações inseridas.');

  await conn.close();
  console.log('\n  ✓ Banco de dados populado com sucesso!\n');
  process.exit(0);
}

seed().catch(function (err) {
  console.error('  Erro no seed:', err.message);
  process.exit(1);
});
