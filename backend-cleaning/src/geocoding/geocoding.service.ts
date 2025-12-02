// src/geocoding/geocoding.service.ts
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GeocodeResponseDto } from './dto/geocode-response.dto';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly googleMapsApiKey: string;
  private readonly googleMapsGeocodingApiUrl: string;

  constructor(private configService: ConfigService) {
    this.googleMapsApiKey = this.configService.get<string>(
      'GOOGLE_MAPS_API_KEY',
    );
    this.googleMapsGeocodingApiUrl = this.configService.get<string>(
      'GOOGLE_MAPS_GEOCODING_API_URL',
      'https://maps.googleapis.com/maps/api/geocode/json',
    );

    if (!this.googleMapsApiKey) {
      this.logger.warn(
        'GOOGLE_MAPS_API_KEY não está configurada. A geocodificação de endereços pode não funcionar.',
      );
    }
  }

  /**
   * Converte um endereço legível por humanos em coordenadas de latitude e longitude.
   * @param address O endereço a ser geocodificado (ex: "Rua Exemplo, 123, São Paulo").
   * @returns Um objeto com latitude e longitude, ou null se não for encontrado.
   */
  async geocodeAddress(address: string): Promise<GeocodeResponseDto | null> {
    if (!this.googleMapsApiKey) {
      this.logger.error(
        'Não é possível geocodificar o endereço: GOOGLE_MAPS_API_KEY não está configurada.',
      );
      throw new InternalServerErrorException(
        'Serviço de geocodificação não configurado.',
      );
    }

    try {
      this.logger.log(`Geocodificando endereço: ${address}`);
      const response = await axios.get(this.googleMapsGeocodingApiUrl, {
        params: {
          address: address,
          key: this.googleMapsApiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        this.logger.log(
          `Endereço geocodificado: Lat ${location.lat}, Lng ${location.lng}`,
        );
        return {
          latitude: location.lat,
          longitude: location.lng,
        };
      } else if (response.data.status === 'ZERO_RESULTS') {
        this.logger.warn(
          `Nenhum resultado encontrado para o endereço: ${address}`,
        );
        return null;
      } else {
        this.logger.error(
          `Erro na API de geocodificação para ${address}: ${response.data.status} - ${response.data.error_message || 'Erro desconhecido'}`,
        );
        throw new InternalServerErrorException(
          `Falha ao geocodificar endereço: ${response.data.status}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Erro ao chamar a API de geocodificação para ${address}: ${error.message}`,
      );
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error(
          `Detalhes do erro da API: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw new InternalServerErrorException(
        'Erro ao se comunicar com o serviço de geocodificação.',
      );
    }
  }

  /**
   * (Exemplo Simplificado) Determina uma "zona" ou ID de região com base em coordenadas.
   * Em um cenário real, isso envolveria lógica de negócios complexa, como:
   * - Consultar um banco de dados com polígonos geográficos (ex: PostGIS).
   * - Chamar uma API interna ou externa que mapeia coordenadas para zonas de serviço/preço.
   * Por simplicidade, este exemplo retorna uma zona fixa ou baseada em uma regra simples.
   * @param latitude Latitude da localização.
   * @param longitude Longitude da localização.
   * @returns O ID da zona.
   */
  async getZoneByCoordinates(
    latitude: number,
    longitude: number,
  ): Promise<string> {
    this.logger.log(
      `Buscando zona para coordenadas: Lat ${latitude}, Lng ${longitude}`,
    );

    // Exemplo de lógica simplificada:
    if (
      latitude > -23.6 &&
      latitude < -23.5 &&
      longitude > -46.7 &&
      longitude < -46.6
    ) {
      return 'ZONE_SAO_PAULO_CENTRO';
    } else if (
      latitude > -23.8 &&
      latitude < -23.7 &&
      longitude > -46.8 &&
      longitude < -46.7
    ) {
      return 'ZONE_SAO_PAULO_SUL';
    }
    return 'ZONE_DEFAULT';
  }
}
