import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthErrorCode } from '../../src/common/constants/auth-error-code';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  it('exibe code e requestId para 401 customizado', async () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockRequest = {
      headers: {
        'accept-language': 'pt-BR',
        'x-request-id': 'req-123',
      },
      url: '/test-endpoint',
    };

    const i18nService = {
      translate: jest.fn().mockResolvedValue('token expirado'),
    } as any;

    const filter = new AllExceptionsFilter(i18nService);
    const exception = new UnauthorizedException({
      message: 'Token expirado.',
      code: AuthErrorCode.TOKEN_EXPIRED,
    });

    await filter.catch(exception, {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        code: AuthErrorCode.TOKEN_EXPIRED,
        requestId: 'req-123',
        message: 'token expirado',
      }),
    );
  });

  it('padroniza 403 sem code para UNAUTHORIZED', async () => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const mockRequest = {
      headers: {
        'accept-language': 'pt-BR',
      },
      url: '/some',
    };

    const i18nService = {
      translate: jest.fn().mockResolvedValue('acesso bloqueado'),
    } as any;

    const filter = new AllExceptionsFilter(i18nService);
    const exception = new ForbiddenException('Sem permissão.');

    await filter.catch(exception, {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 403,
      message: 'Sem permissão.',
      code: AuthErrorCode.UNAUTHORIZED,
    });
  });
});
