FROM php:8.2-apache

# Coloca o código no DocumentRoot do Apache
WORKDIR /var/www/html
COPY . /var/www/html

# Instala pdo_sqlite/sqlite3 e habilita rewrite
RUN apt-get update \
    && apt-get install -y --no-install-recommends libsqlite3-dev $PHPIZE_DEPS \
    && docker-php-ext-install pdo_sqlite sqlite3 \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# Caminho do banco dentro do container
ENV PHP_DB_PATH=/var/www/html/gestao_obras.db

# EntryPoint: ajusta Apache para escutar em $PORT e faz seed admin/admin
RUN echo '#!/bin/sh' > /entrypoint.sh \
    && echo 'set -e' >> /entrypoint.sh \
    && echo 'PORT_ENV=${PORT:-8080}' >> /entrypoint.sh \
    && echo 'if [ -f /etc/apache2/ports.conf ]; then sed -ri "s/Listen 80/Listen ${PORT_ENV}/" /etc/apache2/ports.conf || true; fi' >> /entrypoint.sh \
    && echo 'if [ -f /etc/apache2/sites-available/000-default.conf ]; then sed -ri "s/:80>/:${PORT_ENV}>/" /etc/apache2/sites-available/000-default.conf || true; fi' >> /entrypoint.sh \
    && echo 'if [ ! -f "$PHP_DB_PATH" ]; then' >> /entrypoint.sh \
    && echo '  echo "Criando base SQLite em $PHP_DB_PATH";' >> /entrypoint.sh \
    && echo '  php -r "\$db=new PDO(\"sqlite:$PHP_DB_PATH\");\$db->exec(\"CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(255) UNIQUE, hashed_password VARCHAR(255), is_admin BOOLEAN DEFAULT 0, nome TEXT, email TEXT, nivel_acesso TEXT, ativo BOOLEAN DEFAULT 1);\");"' >> /entrypoint.sh \
    && echo 'fi' >> /entrypoint.sh \
    && echo 'php -r "\$db=new PDO(\"sqlite:$PHP_DB_PATH\");\$st=\$db->query(\"SELECT COUNT(*) FROM usuarios WHERE username=\\\"admin\\\"\");if((int)\$st->fetchColumn()==0){\$h=hash(\"sha256\",\"admin\");\$db->prepare(\"INSERT INTO usuarios (username,hashed_password,nome,email,nivel_acesso,ativo) VALUES (\\\"admin\\\",:p,\\\"Administrador\\\",NULL,\\\"admin\\\",1)\")->execute([\":p\"=>\$h]);echo \"Seed admin/admin criado\\n\";}"' >> /entrypoint.sh \
    && chmod +x /entrypoint.sh

EXPOSE 8080

CMD ["/bin/sh", "-lc", "/entrypoint.sh && apache2-foreground"]
