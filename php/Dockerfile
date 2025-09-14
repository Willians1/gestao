FROM php:8.2-apache

FROM php:8.2-apache

# Instala dependências necessárias e extensões
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        libsqlite3-0 sqlite3 gosu \
        ca-certificates curl; \
    rm -rf /var/lib/apt/lists/*

# Habilita módulos necessários do Apache
RUN a2enmod rewrite

# Instala somente a extensão pdo_sqlite
RUN docker-php-ext-configure pdo_sqlite --with-pdo-sqlite; \
    docker-php-ext-install -j"$(nproc)" pdo_sqlite

# Copia código
COPY . /var/www/html/

# Copia entrypoint separado
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

# Usa o entrypoint customizado
ENTRYPOINT ["/entrypoint.sh"]

