CREATE TABLE IF NOT EXISTS auditoria (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NULL,
  accion VARCHAR(120) NOT NULL,
  detalles VARCHAR(500) NULL,
  fecha TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria (fecha);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria (usuario_id);

ALTER TABLE IF EXISTS auditoria
  ADD CONSTRAINT IF NOT EXISTS fk_auditoria_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
