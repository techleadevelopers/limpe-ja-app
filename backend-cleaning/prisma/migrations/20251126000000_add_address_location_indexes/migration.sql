-- Adiciona índices geoespaciais sem alterar a estrutura existente
CREATE INDEX IF NOT EXISTS idx_address_location
  ON "Address"
  USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_address_lat_lon
  ON "Address" (latitude, longitude);
