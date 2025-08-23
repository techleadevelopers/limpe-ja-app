// src/common/middlewares/locale.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LocaleMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Tenta obter o idioma do cabeçalho 'Accept-Language'
    // Ex: 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    const acceptLanguage = req.headers['accept-language'];
    let locale = 'pt-BR'; // Default para pt-BR

    if (acceptLanguage) {
      // Pega o primeiro idioma da lista, que é geralmente o preferido
      const preferredLanguage = acceptLanguage.split(',')[0].trim();
      // Você pode adicionar uma lógica mais sofisticada para mapear para os locales suportados
      if (preferredLanguage.startsWith('en')) {
        locale = 'en-US';
      } else if (preferredLanguage.startsWith('pt')) {
        locale = 'pt-BR';
      }
      // Adicione outros idiomas conforme necessário
    }

    // Adiciona o locale à requisição para que outros serviços possam acessá-lo
    (req as any).locale = locale;
    next();
  }
}