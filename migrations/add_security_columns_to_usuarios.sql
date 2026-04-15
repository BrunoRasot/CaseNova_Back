ALTER TABLE usuarios
  ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN locked_until DATETIME NULL,
  ADD COLUMN refresh_token_hash VARCHAR(255) NULL,
  ADD COLUMN refresh_token_expires_at DATETIME NULL;
