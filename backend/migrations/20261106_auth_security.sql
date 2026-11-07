ALTER TABLE users
  ADD COLUMN reset_password_token CHAR(64) NULL,
  ADD COLUMN reset_password_expires DATETIME NULL,
  ADD COLUMN two_factor_secret VARCHAR(64) NULL,
  ADD COLUMN two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN two_factor_method ENUM('app', 'sms') NULL,
  ADD COLUMN two_factor_sms_code_hash CHAR(64) NULL,
  ADD COLUMN two_factor_sms_expires DATETIME NULL;
