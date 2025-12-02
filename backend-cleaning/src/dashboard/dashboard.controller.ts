import {
  Controller,
  Get,
  Req,
  UseGuards,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardDto } from './dto/dashboard.dto';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport'; // Assumindo que você usa Passport JWT

@ApiTags('dashboard')
@ApiBearerAuth() // Indica que esta rota requer autenticação JWT
@Controller('providers/me/dashboard') // Rota BASE alterada para /providers/me/dashboard
@UseGuards(AuthGuard('jwt')) // Protege todas as rotas neste controller com JWT
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get() // Agora, como o prefixo do Controller já é o caminho completo, este será o endpoint GET para /providers/me/dashboard
  @ApiOperation({ summary: 'Obter dados do painel do provedor logado' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dados do dashboard do provedor.',
    type: DashboardDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Provedor não encontrado.',
  })
  async getDashboardData(
    @Req()
    req: Request & { user: { userId: string; email: string; role: string } },
  ): Promise<DashboardDto> {
    // Agora, 'req.user.userId' virá diretamente do JwtStrategy
    const userId = req.user.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'ID de usuário não encontrado no token JWT.',
      );
    }
    return this.dashboardService.getDashboardData(userId);
  }
}
