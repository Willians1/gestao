FROM php:8.2-cli

WORKDIR /app

# Copia os arquivos PHP
COPY . /app

# Instala dependências de build e habilita extensões necessárias (PDO SQLite e SQLite3)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libsqlite3-dev $PHPIZE_DEPS \
    && docker-php-ext-configure pdo_sqlite --with-pdo-sqlite \
    && docker-php-ext-install pdo_sqlite sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Ajusta config.php para usar caminho do container
ENV PHP_DB_PATH=/app/gestao_obras.db

# Script de entrypoint para semear admin/admin se necessário
RUN echo '#!/bin/sh' > /entrypoint.sh \
    && echo 'set -e' >> /entrypoint.sh \
    && echo 'if [ ! -f "$PHP_DB_PATH" ]; then' >> /entrypoint.sh \
    && echo '  echo "Criando base SQLite em $PHP_DB_PATH";' >> /entrypoint.sh \
    && echo '  php -r "\$db=new PDO(\'sqlite:$PHP_DB_PATH\');\$db->exec(\"CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(255) UNIQUE, hashed_password VARCHAR(255), is_admin BOOLEAN DEFAULT 0, nome TEXT, email TEXT, nivel_acesso TEXT, ativo BOOLEAN DEFAULT 1);\");"' >> /entrypoint.sh \
    && echo 'fi' >> /entrypoint.sh \
    && echo 'php -r "\$db=new PDO(\'sqlite:$PHP_DB_PATH\');\$st=\$db->query(\"SELECT COUNT(*) FROM usuarios WHERE username=\'admin\'\");if((int)\$st->fetchColumn()==0){\$h=hash(\'sha256\',\'admin\');\$db->prepare(\"INSERT INTO usuarios (username,hashed_password,nome,email,nivel_acesso,ativo) VALUES (\'admin\',:p,\'Administrador\',NULL,\'admin\',1)\")->execute([\':p\'=>\$h]);echo \"Seed admin/admin criado\\n\";}"' >> /entrypoint.sh \
    && chmod +x /entrypoint.sh

EXPOSE 10000

# Usa a porta definida pela plataforma em $PORT; fallback para 10000 local
ENV PORT=10000
CMD ["sh", "-c", "/entrypoint.sh && php -S 0.0.0.0:${PORT:-10000} -t /app"]
