DROP TRIGGER IF EXISTS trg_usuarios_ai_auditoria;
DROP TRIGGER IF EXISTS trg_usuarios_au_auditoria;
DROP TRIGGER IF EXISTS trg_usuarios_ad_auditoria;
DROP TRIGGER IF EXISTS trg_productos_ai_auditoria;
DROP TRIGGER IF EXISTS trg_productos_au_auditoria;
DROP TRIGGER IF EXISTS trg_productos_ad_auditoria;

DELIMITER $$

CREATE TRIGGER trg_usuarios_ai_auditoria
AFTER INSERT ON usuarios
FOR EACH ROW
BEGIN
  INSERT INTO auditoria (usuario_id, accion, detalles, fecha)
  VALUES (
    NULL,
    'TRIGGER_USUARIO_INSERTADO',
    CONCAT('Usuario creado en BD: id=', NEW.id, ', nombre=', NEW.nombre, ', rol=', NEW.rol, ', db_user=', CURRENT_USER()),
    NOW()
  );
END$$

CREATE TRIGGER trg_usuarios_au_auditoria
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
  INSERT INTO auditoria (usuario_id, accion, detalles, fecha)
  VALUES (
    NULL,
    'TRIGGER_USUARIO_ACTUALIZADO',
    CONCAT('Usuario actualizado en BD: id=', NEW.id, ', nombre=', NEW.nombre, ', rol=', NEW.rol, ', db_user=', CURRENT_USER()),
    NOW()
  );
END$$

CREATE TRIGGER trg_usuarios_ad_auditoria
AFTER DELETE ON usuarios
FOR EACH ROW
BEGIN
  INSERT INTO auditoria (usuario_id, accion, detalles, fecha)
  VALUES (
    NULL,
    'TRIGGER_USUARIO_ELIMINADO',
    CONCAT('Usuario eliminado en BD: id=', OLD.id, ', nombre=', OLD.nombre, ', rol=', OLD.rol, ', db_user=', CURRENT_USER()),
    NOW()
  );
END$$

CREATE TRIGGER trg_productos_ai_auditoria
AFTER INSERT ON productos
FOR EACH ROW
BEGIN
  INSERT INTO auditoria (usuario_id, accion, detalles, fecha)
  VALUES (
    NULL,
    'TRIGGER_PRODUCTO_INSERTADO',
    CONCAT('Producto creado en BD: id=', NEW.id, ', nombre=', NEW.nombre, ', db_user=', CURRENT_USER()),
    NOW()
  );
END$$

CREATE TRIGGER trg_productos_au_auditoria
AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
  INSERT INTO auditoria (usuario_id, accion, detalles, fecha)
  VALUES (
    NULL,
    'TRIGGER_PRODUCTO_ACTUALIZADO',
    CONCAT('Producto actualizado en BD: id=', NEW.id, ', nombre=', NEW.nombre, ', db_user=', CURRENT_USER()),
    NOW()
  );
END$$

CREATE TRIGGER trg_productos_ad_auditoria
AFTER DELETE ON productos
FOR EACH ROW
BEGIN
  INSERT INTO auditoria (usuario_id, accion, detalles, fecha)
  VALUES (
    NULL,
    'TRIGGER_PRODUCTO_ELIMINADO',
    CONCAT('Producto eliminado en BD: id=', OLD.id, ', nombre=', OLD.nombre, ', db_user=', CURRENT_USER()),
    NOW()
  );
END$$

DELIMITER ;
