ALTER TABLE staff
  MODIFY COLUMN availability
    ENUM(
      'Disponible',
      'En sesión',
      'Fuera de horario',
      'Vacaciones',
      'Incapacidad',
      'Fuera de servicio'
    ) NOT NULL DEFAULT 'Disponible';

UPDATE staff
SET availability = CASE availability
  WHEN 'En sesión' THEN 'Disponible'
  WHEN 'Fuera de horario' THEN 'Fuera de servicio'
  ELSE availability
END;

ALTER TABLE staff
  MODIFY COLUMN availability
    ENUM(
      'Disponible',
      'Vacaciones',
      'Incapacidad',
      'Fuera de servicio'
    ) NOT NULL DEFAULT 'Disponible';

ALTER TABLE users
  DROP COLUMN IF EXISTS reset_password_token;

ALTER TABLE users
  DROP COLUMN IF EXISTS reset_password_expires;
