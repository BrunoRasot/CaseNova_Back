-- Drop existing triggers (Postgres will drop functions below if recreated)
DROP TRIGGER IF EXISTS trg_usuarios_ai_auditoria ON usuarios;
DROP TRIGGER IF EXISTS trg_usuarios_au_auditoria ON usuarios;
DROP TRIGGER IF EXISTS trg_usuarios_ad_auditoria ON usuarios;
DROP TRIGGER IF EXISTS trg_productos_ai_auditoria ON productos;
DROP TRIGGER IF EXISTS trg_productos_au_auditoria ON productos;
DROP TRIGGER IF EXISTS trg_productos_ad_auditoria ON productos;

-- Usuarios: AFTER INSERT
CREATE OR REPLACE FUNCTION trg_usuarios_ai_auditoria_fn() RETURNS trigger AS $$
BEGIN
  INSERT INTO auditoria (usuario_id, accion, detalles, fecha)
  VALUES (
    NULL,
    'TRIGGER_USUARIO_INSERTADO',
    'Usuario creado en BD: id=' || NEW.id || ', nombre=' || COALESCE(NEW.nombre, '') || ', rol=' || COALESCE(NEW.rol, '') || ', db_user=' || current_user,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_ai_auditoria
AFTER INSERT ON usuarios
FOR EACH ROW
EXECUTE FUNCTION trg_usuarios_ai_auditoria_fn();

-- Usuarios: AFTER UPDATE
CREATE OR REPLACE FUNCTION trg_usuarios_au_auditoria_fn() RETURNS trigger AS $$
BEGIN
  INSERT INTO auditoria (usuario_id, accion, detalles, fecha)
  VALUES (
    NULL,
    'TRIGGER_USUARIO_ACTUALIZADO',
    'Usuario actualizado en BD: id=' || NEW.id || ', nombre=' || COALESCE(NEW.nombre, '') || ', rol=' || COALESCE(NEW.rol, '') || ', db_user=' || current_user,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_au_auditoria
AFTER UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION trg_usuarios_au_auditoria_fn();

-- Usuarios: AFTER DELETE
CREATE OR REPLACE FUNCTION trg_usuarios_ad_auditoria_fn() RETURNS trigger AS $$
BEGIN
  INSERT INTO auditoria (usuario_id, accion, detalles, fecha)
  VALUES (
    NULL,
    'TRIGGER_USUARIO_ELIMINADO',
    'Usuario eliminado en BD: id=' || OLD.id || ', nombre=' || COALESCE(OLD.nombre, '') || ', rol=' || COALESCE(OLD.rol, '') || ', db_user=' || current_user,
    NOW()
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_ad_auditoria
AFTER DELETE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION trg_usuarios_ad_auditoria_fn();

-- Productos: AFTER INSERT
CREATE OR REPLACE FUNCTION trg_productos_ai_auditoria_fn() RETURNS trigger AS $$
BEGIN
  INSERT INTO auditoria (usuario_id, accion, detalles, fecha)
  VALUES (
    NULL,
    'TRIGGER_PRODUCTO_INSERTADO',
    'Producto creado en BD: id=' || NEW.id || ', nombre=' || COALESCE(NEW.nombre, '') || ', db_user=' || current_user,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_productos_ai_auditoria
AFTER INSERT ON productos
FOR EACH ROW
EXECUTE FUNCTION trg_productos_ai_auditoria_fn();

-- Productos: AFTER UPDATE
CREATE OR REPLACE FUNCTION trg_productos_au_auditoria_fn() RETURNS trigger AS $$
BEGIN
  INSERT INTO auditoria (usuario_id, accion, detalles, fecha)
  VALUES (
    NULL,
    'TRIGGER_PRODUCTO_ACTUALIZADO',
    'Producto actualizado en BD: id=' || NEW.id || ', nombre=' || COALESCE(NEW.nombre, '') || ', db_user=' || current_user,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_productos_au_auditoria
AFTER UPDATE ON productos
FOR EACH ROW
EXECUTE FUNCTION trg_productos_au_auditoria_fn();

-- Productos: AFTER DELETE
CREATE OR REPLACE FUNCTION trg_productos_ad_auditoria_fn() RETURNS trigger AS $$
BEGIN
  INSERT INTO auditoria (usuario_id, accion, detalles, fecha)
  VALUES (
    NULL,
    'TRIGGER_PRODUCTO_ELIMINADO',
    'Producto eliminado en BD: id=' || OLD.id || ', nombre=' || COALESCE(OLD.nombre, '') || ', db_user=' || current_user,
    NOW()
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_productos_ad_auditoria
AFTER DELETE ON productos
FOR EACH ROW
EXECUTE FUNCTION trg_productos_ad_auditoria_fn();
