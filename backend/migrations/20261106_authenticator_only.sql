UPDATE users
SET two_factor_enabled = 0,
    two_factor_secret = NULL,
    two_factor_method = NULL
WHERE two_factor_method = 'sms';

ALTER TABLE users
  MODIFY COLUMN two_factor_method ENUM('app') NULL,
  DROP COLUMN two_factor_sms_code_hash,
  DROP COLUMN two_factor_sms_expires;
