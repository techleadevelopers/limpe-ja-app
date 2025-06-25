// src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Obtém a resposta do erro (pode ser um objeto ou string)
    const errorResponse = exception.getResponse();

    // Determina a mensagem de erro e a estrutura
    const message =
      typeof errorResponse === 'object'
        ? (errorResponse as any).message || 'Internal server error'
        : errorResponse || 'Internal server error';

    // Se for um erro de validação (status 400), o message pode ser um array de strings
    const errors = Array.isArray(message) ? message : [message];

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errors.join(', '), // Junta as mensagens de erro em uma string
      errors: errors, // Mantém o array de erros para o frontend consumir
    });
  }
}