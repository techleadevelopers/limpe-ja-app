import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { EarningsService } from './earnings.service';
import { EarningsResponseDto, WithdrawalResponseDto } from './dto/earnings.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RequestWithdrawalDto } from '../payouts/dto/request-withdrawal.dto';

@ApiTags('earnings')
@ApiBearerAuth()
@Controller('providers/me/earnings')
@UseGuards(AuthGuard('jwt'))
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get()
  @ApiOperation({ summary: 'Obter dados de ganhos e histórico do provedor' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dados de ganhos do provedor.',
    type: EarningsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Provedor não encontrado.',
  })
  async getEarnings(
    @Req() req: Request & { user: { userId: string } },
  ): Promise<EarningsResponseDto> {
    return await this.earningsService.getEarnings((req as any).user.userId);
  }

  @Post('withdrawal')
  @ApiOperation({ summary: 'Solicitar um saque dos ganhos do provedor' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Saque solicitado com sucesso.',
    type: WithdrawalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos ou saldo insuficiente.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado.',
  })
  async requestWithdrawal(
    @Req() req: Request & { user: { userId: string } },
    @Body() withdrawalDto: RequestWithdrawalDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<WithdrawalResponseDto> {
    return await this.earningsService.requestWithdrawal(
      (req as any).user.userId,
      withdrawalDto,
      idempotencyKey,
    );
  }
}
