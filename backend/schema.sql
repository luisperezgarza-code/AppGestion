CREATE DATABASE IF NOT EXISTS appgestion_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE appgestion_db;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(40) NOT NULL DEFAULT '',
  avatar MEDIUMTEXT NOT NULL,
  password_hash VARCHAR(60) NOT NULL,
  role ENUM('owner', 'receptionist', 'trainer') NOT NULL,
  two_factor_secret VARCHAR(64) NULL,
  two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
  two_factor_method ENUM('app') NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS members (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  plan VARCHAR(80) NOT NULL,
  expiry_date DATE NOT NULL,
  status ENUM('Activo', 'Inactivo', 'Pendiente de Pago') NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_members_created_at (created_at),
  KEY idx_members_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  client VARCHAR(120) NOT NULL,
  concept VARCHAR(160) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  method ENUM('Tarjeta', 'Transferencia', 'Efectivo') NOT NULL,
  transaction_date DATE NOT NULL,
  status ENUM('Completado', 'Pendiente') NOT NULL DEFAULT 'Completado',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_transactions_date (transaction_date, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS staff (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  specialty VARCHAR(120) NOT NULL,
  schedule VARCHAR(120) NOT NULL,
  availability ENUM('Disponible', 'Vacaciones', 'Incapacidad', 'Fuera de servicio') NOT NULL DEFAULT 'Disponible',
  initials VARCHAR(5) NOT NULL DEFAULT '',
  color VARCHAR(40) NOT NULL DEFAULT 'lavender',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_staff_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS classes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  trainer_id INT UNSIGNED NULL,
  schedule VARCHAR(120) NOT NULL,
  capacity SMALLINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_classes_trainer_id (trainer_id),
  CONSTRAINT fk_classes_trainer
    FOREIGN KEY (trainer_id) REFERENCES staff (id)
    ON DELETE SET NULL
) ENGINE=InnoDB;
