import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CacheService } from '../cache/cache.service';
import * as fs from 'fs';
import * as path from 'path';

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
};

@Injectable()
export class ConnectService {
  private readonly logger = new Logger(ConnectService.name);
  private readonly connectAuthorizeBaseSandbox = 'https://connect.sandbox.pagbank.com.br/oauth2/authorize';
  private readonly connectAuthorizeBaseProd = 'https://connect.pagbank.com.br/oauth2/authorize';

  constructor(
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {}

  private apiBase(): string {
    const base = this.config.get<string>('PAGSEGURO_API_BASE_URL') || 'https://sandbox.api.pagseguro.com';
    return base.replace(/\/$/, '');
  }

  // In v4.x, the token endpoint is /oauth2/token

  buildAuthorizeUrl(scope: string, state = 'limpeja_auth'): string {
    const clientId = this.config.get<string>('PAGSEGURO_CONNECT_CLIENT_ID');
    const redirectUri = this.config.get<string>('PAGSEGURO_CONNECT_REDIRECT_URI');
    const isSandbox = /sandbox\./i.test(this.apiBase());
    const authorizeBase = isSandbox ? this.connectAuthorizeBaseSandbox : this.connectAuthorizeBaseProd;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId || '',
      redirect_uri: redirectUri || '',
      scope,
      state,
    });
    return `${authorizeBase}?${params.toString()}`;
  }

  async exchangeAuthorizationCode(code: string): Promise<TokenResponse> {
    const client_id = this.config.get<string>('PAGSEGURO_CONNECT_CLIENT_ID') || '';
    const client_secret = this.config.get<string>('PAGSEGURO_CONNECT_CLIENT_SECRET') || '';
    const redirect_uri = this.config.get<string>('PAGSEGURO_CONNECT_REDIRECT_URI') || '';
    const url = `${this.apiBase()}/oauth2/token`;
    const body = {
      grant_type: 'authorization_code',
      code,
      client_id,
      client_secret,
      redirect_uri,
    } as const;
    const bearer = this.config.get<string>('PAGSEGURO_API_TOKEN') || '';
    const headers: any = {
      'Content-Type': 'application/json',
      'X_CLIENT_ID': client_id,
      'X_CLIENT_SECRET': client_secret,
    };
    if (bearer) headers['Authorization'] = `Bearer ${bearer}`;
    const res = await axios.post<TokenResponse>(url, body, { timeout: 15000, headers });
    await this.saveTokens(res.data);
    return res.data;
  }

  async refreshAccessToken(): Promise<TokenResponse> {
    const refresh_token = (await this.cache.get<string>('connect:pagbank:refresh_token')) || '';
    if (!refresh_token) throw new Error('No refresh_token stored');
    const url = `${this.apiBase()}/oauth2/token`;
    const client_id = this.config.get<string>('PAGSEGURO_CONNECT_CLIENT_ID') || '';
    const client_secret = this.config.get<string>('PAGSEGURO_CONNECT_CLIENT_SECRET') || '';
    const body = { grant_type: 'refresh_token', refresh_token } as const;
    const bearer = this.config.get<string>('PAGSEGURO_API_TOKEN') || '';
    const headers: any = {
      'Content-Type': 'application/json',
      'X_CLIENT_ID': client_id,
      'X_CLIENT_SECRET': client_secret,
    };
    if (bearer) headers['Authorization'] = `Bearer ${bearer}`;
    const res = await axios.post<TokenResponse>(url, body, { timeout: 15000, headers });
    await this.saveTokens(res.data);
    return res.data;
  }

  async getAccessToken(): Promise<string> {
    // Prefer Connect token in production; fallback to env token (sandbox or if Connect not configured)
    const nodeEnv = this.config.get<string>('NODE_ENV') || 'development';
    if (nodeEnv !== 'production') {
      return this.config.get<string>('PAGSEGURO_API_TOKEN') || '';
    }

    const access = await this.cache.get<string>('connect:pagbank:access_token');
    const expiresAt = await this.cache.get<number>('connect:pagbank:expires_at'); // epoch ms
    const now = Date.now();
    if (access && expiresAt && now < expiresAt - 30_000) {
      return access;
    }
    try {
      const refreshed = await this.refreshAccessToken();
      return refreshed.access_token;
    } catch (e: any) {
      this.logger.error(`Failed to refresh access token: ${e?.message}`);
      // As a last resort, try env token if present
      const envToken = this.config.get<string>('PAGSEGURO_API_TOKEN');
      if (envToken) return envToken;
      throw e;
    }
  }

  private async saveTokens(t: TokenResponse): Promise<void> {
    const ttlSeconds = Math.max(60, Math.floor(t.expires_in));
    const expiresAt = Date.now() + ttlSeconds * 1000;
    await this.cache.set('connect:pagbank:access_token', t.access_token, ttlSeconds);
    // store refresh without TTL to survive a bit longer; optionally set a long TTL
    await this.cache.set('connect:pagbank:refresh_token', t.refresh_token, 7 * 24 * 3600);
    await this.cache.set('connect:pagbank:expires_at', expiresAt, 7 * 24 * 3600);
  }

  /**
   * Runs the PagBank Connect Challenge to unlock mTLS certificate issuance.
   * It sends the public key and created_at to /oauth2/token with grant_type=challenge.
   */
  async runChallenge(): Promise<any> {
    const client_id = this.config.get<string>('PAGSEGURO_CONNECT_CLIENT_ID') || '';
    const client_secret = this.config.get<string>('PAGSEGURO_CONNECT_CLIENT_SECRET') || '';
    const url = `${this.apiBase()}/oauth2/token`;

    // Read public key (PEM) and created_at (epoch ms) from filesystem
    const keyPath = this.config.get<string>('PAGSEGURO_PUBLIC_KEY_PATH')
      || path.resolve(process.cwd(), 'public-key');
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Public key not found at ${keyPath}`);
    }
    const public_key = fs.readFileSync(keyPath, 'utf8');
    const stat = fs.statSync(keyPath);
    const created_at = Math.floor((stat.birthtimeMs || stat.mtimeMs || Date.now()));

    const headers: any = {
      'Content-Type': 'application/json',
      'X_CLIENT_ID': client_id,
      'X_CLIENT_SECRET': client_secret,
      Authorization: `Bearer ${await this.getAccessToken()}`,
    };
    const body = {
      grant_type: 'challenge',
      scope: 'certificate.create',
      public_key,
      created_at,
    } as const;

    try {
      const res = await axios.post(url, body, { headers, timeout: 20000 });
      this.logger.log(`[ConnectService] Challenge response received.`);
      return res.data;
    } catch (e: any) {
      this.logger.error(`[ConnectService] Challenge error: ${e?.response?.status} ${JSON.stringify(e?.response?.data || e.message)}`);
      throw e;
    }
  }

  /**
   * Creates a Connect application (POST /oauth2/application).
   * Requires a bearer token (sandbox: PAGSEGURO_API_TOKEN; prod: Connect access token).
   */
  async createApplication(input: {
    name: string;
    description?: string;
    site?: string;
    redirect_uri: string;
    logo?: string;
  }): Promise<any> {
    if (!input || !input.name || !input.redirect_uri) {
      throw new BadRequestException('name and redirect_uri are required');
    }
    const url = `${this.apiBase()}/oauth2/application`;
    const bearer = (await this.getAccessToken()) || this.config.get<string>('PAGSEGURO_API_TOKEN') || '';
    const headers: any = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bearer}`,
    };
    const body = {
      name: input.name,
      description: input.description || 'Aplicação LimpeJá (Connect)',
      site: input.site || 'https://limpeja.app',
      redirect_uri: input.redirect_uri,
      logo: input.logo || undefined,
    };
    try {
      const res = await axios.post(url, body, { headers, timeout: 20000 });
      return res.data;
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      this.logger.error(`[ConnectService] createApplication error: ${status} ${JSON.stringify(data || e.message)}`);
      throw new BadRequestException(data?.message || 'Falha ao criar aplicação no PagBank');
    }
  }

  /**
   * Retrieves application details by client_id (GET /oauth2/application/{client_id}).
   */
  async getApplication(clientId: string): Promise<any> {
    const url = `${this.apiBase()}/oauth2/application/${encodeURIComponent(clientId)}`;
    const bearer = (await this.getAccessToken()) || this.config.get<string>('PAGSEGURO_API_TOKEN') || '';
    const headers: any = {
      Authorization: `Bearer ${bearer}`,
    };
    const res = await axios.get(url, { headers, timeout: 15000 });
    return res.data;
  }
}
