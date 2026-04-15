CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  documento VARCHAR(20) NULL,
  telefono VARCHAR(20) NULL,
  correo VARCHAR(120) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO clientes (nombre, documento, telefono, correo)
SELECT * FROM (
  SELECT 'Cliente General' AS nombre, NULL AS documento, NULL AS telefono, NULL AS correo
) AS tmp
WHERE NOT EXISTS (
  SELECT 1 FROM clientes WHERE nombre = 'Cliente General'
) LIMIT 1;
