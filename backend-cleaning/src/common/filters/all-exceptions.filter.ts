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
import { AuthErrorCode } from '../constants/auth-error-code';

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
    let responseObject: Record<string, any> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        responseObject.message = responseBody;
        responseObject.error = HttpStatus[status];
      } else if (Array.isArray(responseBody)) {
        responseObject.message = responseBody.join(', ');
        responseObject.error = HttpStatus[status];
      } else if (responseBody && typeof responseBody === 'object') {
        responseObject = responseBody as Record<string, any>;
      }

      message = responseObject.message || 'Erro inesperado.';
      error = responseObject.error || HttpStatus[status];

      if (responseObject.message && typeof responseObject.message === 'object' && responseObject.message.key) {
        i18nKey = responseObject.message.key;
        i18nArgs = responseObject.message.args || {};
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

    const codeFromBody =
      typeof responseObject.code === 'string'
        ? responseObject.code
        : undefined;
    const code =
      codeFromBody ??
      (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN
        ? AuthErrorCode.UNAUTHORIZED
        : undefined);
    const requestId =
      responseObject.requestId ??
      request.headers['x-request-id'] ??
      request.headers['X-Client-Request-Id'] ??
      undefined;

    const finalMessage = translatedMessage || message || 'Erro inesperado.';
    const baseResponse: Record<string, any> = {
      statusCode: status,
      message: finalMessage,
      code,
    };
    if (requestId) {
      baseResponse.requestId = requestId;
    }

    const unauthorizedStatuses = [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN];
    if (unauthorizedStatuses.includes(status)) {
      response.status(status).json(baseResponse);
      return;
    }

    response.status(status).json({
      ...baseResponse,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
