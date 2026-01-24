// src/geocoding/geocoding.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { CacheService } from '../cache/cache.service';
import { GeocodeResponseDto } from './dto/geocode-response.dto';

const CACHE_PREFIX = 'geocode:address:';
const CIRCUIT_BREAKER_KEY = 'geocode:circuit:google';
const DEFAULT_CACHE_TTL_SECONDS = 5 * 60; // 5 minutos
const DEFAULT_BREAKER_TTL_SECONDS = 10 * 60; // 10 minutos
const CIRCUITABLE_STATUSES = new Set(['OVER_QUERY_LIMIT', 'REQUEST_DENIED']);

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly googleMapsApiKey: string;
  private readonly googleMapsGeocodingApiUrl: string;
  private readonly cacheTtlSeconds: number;
  private readonly breakerTtlSeconds: number;

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
  ) {
    this.googleMapsApiKey = this.configService.get<string>(
      'GOOGLE_MAPS_API_KEY',
    );
    this.googleMapsGeocodingApiUrl = this.configService.get<string>(
      'GOOGLE_MAPS_GEOCODING_API_URL',
      'https://maps.googleapis.com/maps/api/geocode/json',
    );
    this.cacheTtlSeconds = this.parseTtl(
      'GEOCODING_CACHE_TTL_SECONDS',
      DEFAULT_CACHE_TTL_SECONDS,
    );
    this.breakerTtlSeconds = this.parseTtl(
      'GEOCODING_BREAKER_TTL_SECONDS',
      DEFAULT_BREAKER_TTL_SECONDS,
    );

    if (!this.googleMapsApiKey) {
      this.logger.warn(
        'GOOGLE_MAPS_API_KEY não está configurada. Os endereços serão aceitos apenas com fallback de cidade.',
      );
    }
  }

  private parseTtl(key: string, fallback: number): number {
    const value =
      this.configService.get<number>(key) ??
      Number(this.configService.get<string>(key));
    if (!value || Number.isNaN(value) || value <= 0) {
      return fallback;
    }
    return value;
  }

  private normalizeAddress(address: string): string | null {
    if (!address) {
      return null;
    }
    return address.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private buildCacheKey(normalizedAddress: string): string {
    return `${CACHE_PREFIX}${normalizedAddress}`;
  }

  private async isCircuitOpen(): Promise<boolean> {
    return !!(await this.cacheService.get<boolean>(CIRCUIT_BREAKER_KEY));
  }

  private async tripCircuit(reason: string) {
    this.logger.warn(`Circuit breaker ativado para geocoding: ${reason}`);
    await this.cacheService.set(
      CIRCUIT_BREAKER_KEY,
      true,
      this.breakerTtlSeconds,
    );
  }

  private shouldTripDueToStatus(status?: string): boolean {
    return !!status && CIRCUITABLE_STATUSES.has(status);
  }

  private shouldTripDueToHttpCode(statusCode?: number): boolean {
    return statusCode === 429 || statusCode === 403 || statusCode === 401;
  }

  /**
   * Converte um endereço legível por humanos em coordenadas de latitude e longitude.
   * @param address O endereço a ser geocodificado (ex: "Rua Exemplo, 123, São Paulo").
   * @returns Um objeto com latitude e longitude, ou null se não for encontrado ou se o circuito estiver aberto.
   */
  async geocodeAddress(address: string): Promise<GeocodeResponseDto | null> {
    const normalized = this.normalizeAddress(address);
    if (!normalized) {
      return null;
    }

    if (await this.isCircuitOpen()) {
      this.logger.warn(
        `Circuit breaker ativo para geocode; pulando tentativa para "${address}"`,
      );
      return null;
    }

    const cacheKey = this.buildCacheKey(normalized);
    const cached = await this.cacheService.get<GeocodeResponseDto>(cacheKey);
    if (cached) {
      this.logger.verbose(`Cache GEOCODE HIT (${cacheKey})`);
      return cached;
    }

    if (!this.googleMapsApiKey) {
      this.logger.warn(
        'Sem API key configurada, pulando chamada ao Google Maps (fallback para cidade).',
      );
      return null;
    }

    try {
      this.logger.log(`Geocodificando endereço: ${address}`);
      const response = await axios.get(this.googleMapsGeocodingApiUrl, {
        params: {
          address,
          key: this.googleMapsApiKey,
        },
        timeout: 8000,
      });

      const status: string = response.data?.status;
      if (status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        this.logger.log(
          `Endereço geocodificado: Lat ${location.lat}, Lng ${location.lng}`,
        );
        const payload: GeocodeResponseDto = {
          latitude: location.lat,
          longitude: location.lng,
        };
        await this.cacheService.set(cacheKey, payload, this.cacheTtlSeconds);
        return payload;
      }

      if (status === 'ZERO_RESULTS') {
        this.logger.warn(`Nenhum resultado para o endereço: ${address}`);
        return null;
      }

      if (this.shouldTripDueToStatus(status)) {
        await this.tripCircuit(status);
        return null;
      }

      this.logger.error(
        `Resposta inesperada da API de geocoding (${status}) para: ${address}`,
      );
      return null;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axios.isAxiosError(axiosError)) {
        const statusCode = axiosError.response?.status;
        const errorData = axiosError.response?.data;
        this.logger.error(
          `Erro na API de geocodificação (${statusCode}) para ${address}: ${axiosError.message}`,
        );
        if (errorData) {
          this.logger.debug(
            `Payload de erro do Google: ${JSON.stringify(errorData)}`,
          );
        }

        if (this.shouldTripDueToHttpCode(statusCode)) {
          await this.tripCircuit(`HTTP ${statusCode}`);
          return null;
        }
      } else {
        this.logger.error(
          `Erro inesperado ao geocodificar ${address}: ${(error as Error).message}`,
        );
      }
      return null;
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
