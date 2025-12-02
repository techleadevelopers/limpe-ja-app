// src/common/filters/all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { I18nService } from '../i18n/i18n.service'; // Importar o serviço de i18n

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly i18n: I18nService) {} // Injetar o serviço de i18n

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let message: string;
    let error: string;
    let i18nKey: string | null = null;
    let i18nArgs: Record<string, any> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
        error = HttpStatus[status];
      } else {
        // Se a resposta for um objeto, podemos ter 'message' e 'error'
        message = (responseBody as any).message || 'Erro inesperado.';
        error = (responseBody as any).error || HttpStatus[status];

        // Tenta extrair chave de i18n se a mensagem for um objeto com 'key'
        if (
          (responseBody as any).message &&
          typeof (responseBody as any).message === 'object' &&
          (responseBody as any).message.key
        ) {
          i18nKey = (responseBody as any).message.key;
          i18nArgs = (responseBody as any).message.args || {};
        }
      }
    } else if (exception instanceof PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST; // Default para erros do Prisma
      error = 'Database Error';

      switch (exception.code) {
        case 'P2002': // Unique constraint violation
          message = `O registro com ${exception.meta.target} já existe.`;
          i18nKey = 'error.prisma.uniqueConstraintViolation';
          i18nArgs = { target: exception.meta.target };
          break;
        case 'P2025': // Record not found
          message = `Registro não encontrado.`;
          i18nKey = 'error.prisma.recordNotFound';
          break;
        case 'P2003': // Foreign key constraint failed
          message = `Violação de chave estrangeira.`;
          i18nKey = 'error.prisma.foreignKeyConstraintFailed';
          break;
        case 'P2000': // Value too long for column
          message = `Valor muito longo para um campo.`;
          i18nKey = 'error.prisma.valueTooLong';
          break;
        default:
          message = `Erro no banco de dados: ${exception.message}`;
          i18nKey = 'error.prisma.generic';
          i18nArgs = { message: exception.message };
          break;
      }
      this.logger.error(
        `Prisma Error (${exception.code}): ${exception.message}`,
        exception.stack,
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Erro interno do servidor.';
      error = 'Internal Server Error';
      i18nKey = 'error.internalServerError';
      this.logger.error(
        `Unhandled Exception: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // Tentar traduzir a mensagem se uma chave i18n foi fornecida
    const lang = request.headers['accept-language'] || 'pt-BR'; // Obter idioma do cabeçalho
    const translatedMessage = i18nKey
      ? await this.i18n.translate(i18nKey, lang, i18nArgs)
      : message;

    response.status(status).json({
      statusCode: status,
      message: translatedMessage,
      error: error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
