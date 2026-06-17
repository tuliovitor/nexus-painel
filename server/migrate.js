/**
 * NEXUS PAINEL — Migration segura (não destrói dados)
 * Cria tabelas se não existirem e aplica alterações de schema.
 * Uso: node server/migrate.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function migrate() {
  var dbConf, dbName, conn;
  if (process.env.DATABASE_URL) {
    dbConf = { uri: process.env.DATABASE_URL };
    conn = await mysql.createConnection(dbConf);
  } else {
    dbName = process.env.DB_NAME || 'nexus_painel';
    // First connect without database to create it if needed
    conn = await mysql.createConnection({
      host:     process.env.DB_HOST || 'localhost',
      port:     process.env.DB_PORT || 3306,
      user:     process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });
    await conn.query('CREATE DATABASE IF NOT EXISTS `' + dbName + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await conn.query('USE `' + dbName + '`');
  }
  console.log('  Rodando migrations…');

  // Schema
  await conn.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
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
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS agendamentos (
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
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS membros (
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
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS metricas_diarias (
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
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS transmissoes (
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
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS stream_config (
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
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS chat_mensagens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      transmissao_id INT NOT NULL,
      usuario_id INT NOT NULL,
      mensagem TEXT NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transmissao_id) REFERENCES transmissoes(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  // Ensure avatar column is MEDIUMTEXT (dataURLs)
  try {
    await conn.query('ALTER TABLE usuarios MODIFY COLUMN avatar MEDIUMTEXT DEFAULT NULL');
  } catch (_) {}

  console.log('  Migrações concluídas.');
  await conn.close();
}

migrate().catch(function (err) {
  console.error('  Erro no migrate:', err.message);
  process.exit(1);
});
