# Usa a imagem oficial do PostGIS que já contém o PostgreSQL
# A tag 16-3.4 indica PostgreSQL 16 e PostGIS 3.4
FROM postgis/postgis:16-3.4

# O Railway irá detectar esta imagem e provisionar
# o banco de dados com o PostGIS já instalado.
# Não é necessário mais nenhum comando aqui.
