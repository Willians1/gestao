FROM php:8.2-apache

# Código no DocumentRoot
WORKDIR /var/www/html
COPY . /var/www/html

# Instala somente libs de runtime do SQLite e habilita rewrite (sem compilar extensões)
RUN set -eux; \
  apt-get update; \
  apt-get install -y --no-install-recommends libsqlite3-0; \
  a2enmod rewrite; \
  rm -rf /var/lib/apt/lists/*

# Caminho padrão do DB
ENV PHP_DB_PATH=/var/www/html/gestao_obras.db

# Entrypoint robusto via heredoc
RUN set -eux; \
    cat > /entrypoint.sh <<'EOF' \
#!/bin/sh
set -e

# Ajusta Apache para a porta do Render
PORT_ENV="${PORT:-8080}"
if [ -f /etc/apache2/ports.conf ]; then sed -ri "s/Listen 80/Listen ${PORT_ENV}/" /etc/apache2/ports.conf || true; fi
if [ -f /etc/apache2/sites-available/000-default.conf ]; then sed -ri "s/:80>/:${PORT_ENV}>/" /etc/apache2/sites-available/000-default.conf || true; fi

# Caminho do DB
: "${PHP_DB_PATH:=/var/www/html/gestao_obras.db}"

# Cria DB e tabela se necessário (usa PDO se disponível; senão tenta sqlite3 CLI)
if [ ! -f "$PHP_DB_PATH" ]; then
  echo "Criando base SQLite em $PHP_DB_PATH"
  if php -m | grep -qi pdo_sqlite; then
    php -r "\$db=new PDO('sqlite:$PHP_DB_PATH');\$db->exec(\"CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(255) UNIQUE, hashed_password VARCHAR(255), is_admin BOOLEAN DEFAULT 0, nome TEXT, email TEXT, nivel_acesso TEXT, ativo BOOLEAN DEFAULT 1);\");"
  elif command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$PHP_DB_PATH" "CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(255) UNIQUE, hashed_password VARCHAR(255), is_admin BOOLEAN DEFAULT 0, nome TEXT, email TEXT, nivel_acesso TEXT, ativo BOOLEAN DEFAULT 1);"
  else
    echo "Aviso: nem pdo_sqlite nem sqlite3 estão disponíveis; o app tentará criar a tabela em runtime."
  fi
fi

# Seed admin/admin
if php -m | grep -qi pdo_sqlite; then
  php -r "\$db=new PDO('sqlite:$PHP_DB_PATH');\$st=\$db->query(\"SELECT COUNT(*) FROM usuarios WHERE username='admin'\");if((int)\$st->fetchColumn()==0){\$h=hash('sha256','admin');\$db->prepare(\"INSERT INTO usuarios (username,hashed_password,nome,email,nivel_acesso,ativo) VALUES ('admin',:p,'Administrador',NULL,'admin',1)\")->execute([':p'=>\$h]);echo \"Seed admin/admin criado\\n\";}"
elif command -v sqlite3 >/dev/null 2>&1; then
  ADMIN_COUNT=$(sqlite3 "$PHP_DB_PATH" "SELECT COUNT(*) FROM usuarios WHERE username='admin';" 2>/dev/null || echo 0)
  if [ "${ADMIN_COUNT}" = "0" ]; then
    HASH=$(php -r "echo hash('sha256','admin');")
    sqlite3 "$PHP_DB_PATH" "INSERT INTO usuarios (username,hashed_password,nome,email,nivel_acesso,ativo) VALUES ('admin','${HASH}','Administrador',NULL,'admin',1);"
    echo "Seed admin/admin criado via sqlite3 CLI"
  fi
else
  echo "Aviso: não foi possível semear admin/admin (extensões indisponíveis)"
fi

exec apache2-foreground
EOF
RUN chmod +x /entrypoint.sh

EXPOSE 8080

CMD ["/entrypoint.sh"]
