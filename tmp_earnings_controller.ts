import { Controller, Get, Post, Body, Req, UseGuards, HttpStatus } from '@nestjs/common';
import { EarningsService } from './earnings.service';
import { EarningsResponseDto, WithdrawalRequestDto, WithdrawalResponseDto } from './dto/earnings.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport'; // Assumindo que vocÃª usa Passport JWT

@ApiTags('earnings')
@ApiBearerAuth() // Indica que esta rota requer autenticaÃ§Ã£o JWT
@Controller('providers/me/earnings')
@UseGuards(AuthGuard('jwt')) // Protege todas as rotas neste controller com JWT
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get()
  @ApiOperation({ summary: 'Obter dados de ganhos e histórico de transações do provedor' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Dados de ganhos do provedor.', type: EarningsResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Provedor não encontrado.' })
  async getEarnings(@Req() req: Request & { user: { userId: string } }): Promise<EarningsResponseDto> {
    // req.user.userId Ã© preenchido pelo AuthGuard
    return await this.earningsService.getEarnings(req.user.userId);
  }

  @Post('withdrawal')
  @ApiOperation({ summary: 'Solicitar um saque dos ganhos do provedor' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Saque solicitado com sucesso.', type: WithdrawalResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos ou saldo insuficiente.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  async requestWithdrawal(
    @Req() req: Request & { user: { userId: string } },
    @Body() withdrawalDto: WithdrawalRequestDto,
  ): Promise<WithdrawalResponseDto> {
    return await this.earningsService.requestWithdrawal(req.user.userId, withdrawalDto);
  }
}
