import { Controller, Get, Query, Res, Post, HttpCode, HttpStatus, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ConnectService } from './connect.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('connect')
@Controller('connect')
export class ConnectController {
  constructor(
    private readonly connect: ConnectService,
    private readonly config: ConfigService,
  ) {}

  @Get('authorize')
  @ApiOperation({ summary: 'Monta a URL de autorização do PagBank Connect' })
  authorize(@Query('scope') scope = 'payments.create+payments.read', @Query('state') state = 'limpeja_auth') {
    const url = this.connect.buildAuthorizeUrl(scope, state);
    return { url };
  }

  @Get('callback')
  @ApiOperation({ summary: 'Callback do PagBank Connect: troca code por access_token' })
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    await this.connect.exchangeAuthorizationCode(code);
    // Redireciona para um painel/ok simples; ajuste conforme necessidade
    res.redirect('/admin/connect/success');
  }

  @Get('public-key')
  @ApiOperation({ summary: 'Exibe a chave pública (PEM) e a data de criação para o Connect Challenge' })
  publicKey() {
    const keyPath = this.config.get<string>('PAGSEGURO_PUBLIC_KEY_PATH') || path.resolve(process.cwd(), 'public-key');
    if (!fs.existsSync(keyPath)) {
      return { error: 'public key not found', path: keyPath };
    }
    const publicKey = fs.readFileSync(keyPath, 'utf8');
    const stat = fs.statSync(keyPath);
    const createdAt = Math.floor((stat.birthtimeMs || stat.mtimeMs || Date.now()));
    return { public_key: publicKey, created_at: createdAt };
  }

  @Post('challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executa o Connect Challenge no PagBank para liberar emissão de certificado mTLS' })
  async challenge() {
    const res = await this.connect.runChallenge();
    return res;
  }

  @Post('application')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria uma aplicação no PagBank Connect (sandbox/prod)' })
  async createApplication(@Body() body: { name: string; description?: string; site?: string; redirect_uri: string; logo?: string }) {
    return this.connect.createApplication(body);
  }

  @Get('application/:clientId')
  @ApiOperation({ summary: 'Consulta detalhes de uma aplicação por client_id' })
  async getApplication(@Param('clientId') clientId: string) {
    return this.connect.getApplication(clientId);
  }
}
