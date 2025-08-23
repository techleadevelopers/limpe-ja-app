🗺️ geocoding/ — Módulo de Geocodificação de Endereços

O módulo geocoding/ é responsável por converter endereços em coordenadas geográficas (latitude/longitude) e vice-versa. Ele permite melhor roteamento, validação de localização e suporte a mapas em tempo real.

🎯 Objetivo

Fornecer conversão precisa entre:

Endereço completo ↔ Coordenadas (lat/lng)

Códigos postais ↔ Regiões

Suporte a verificação de área atendida

⚙️ Estrutura de Arquivos
geocoding/
├── geocoding.module.ts          # Módulo principal e providers
├── geocoding.service.ts         # Lógica de requisições e formatação
├── geocode-response.dto.ts      # Estrutura de resposta

🔁 Lógica de Operação
Funções principais:

geocodeAddress(address: string)

Converte string de endereço em latitude/longitude

reverseGeocode(lat: number, lng: number)

Converte coordenadas em endereço legível

validateCoverage(area: string)

Verifica se endereço pertence a área de cobertura do app

📥 DTO: geocode-response.dto.ts
{
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  postalCode?: string;
}

🔗 Integração com o App
Tela / Ação	Uso do Módulo
Cadastro de endereço	Geocodifica e valida
Roteamento para prestador	Usa lat/lng para maps
Check-in / check-out geográfico	Confirma presença na área
Validação de cobertura regional	Verifica se o CEP é aceito
🌐 Fonte de Dados

Integração com APIs externas de geolocalização (ex: Google Maps API, OpenStreetMap)

Cache opcional interno para otimização de chamadas

📊 Estratégia Técnica

Torna a plataforma contextual e inteligente

Reduz erros de localização

Permite filtros geográficos e campanhas por região

Suporte a lógica de “atendimento na sua área”

✅ Conclusão

O módulo geocoding/ é um componente essencial para a inteligência de localização da plataforma. Ele conecta dados do usuário com o mundo físico, tornando a experiência mais precisa, eficiente e segura.