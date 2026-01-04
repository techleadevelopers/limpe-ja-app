import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
  Query,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingDetailsDto } from './dto/booking-details.dto';
import { BookingAndPixResponseDto } from './dto/booking-and-pix-response.dto';
import { BookingQuoteRequestDto } from './dto/quote-request.dto';
import { BookingLocationDto } from './dto/booking-location.dto';
import { BookingQuoteResponseDto } from './dto/quote-response.dto';
import {
  BookingProofResponseDto,
  SubmitBookingProofDto,
} from './dto/booking-proof.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BookingStatus, UserRole, BookingProofType } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ReportDisputeDto } from './dto/report-dispute.dto';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { I18nService } from '../common/i18n/i18n.service';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

type RequestWithUser = Request & {
  user: {
    userId: string;
    role: UserRole;
    locale?: string;
  };
  locale?: string;
};

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly i18n: I18nService,
  ) {}

  // ADMIN: Listar todos os agendamentos (com filtro opcional de status)
  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os agendamentos (apenas admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de agendamentos.',
    type: [BookingDetailsDto],
  })
  async findAllBookings(
    @Req() req: RequestWithUser,
    @Query('status') status?: BookingStatus,
  ): Promise<BookingDetailsDto[]> {
    const { userId, role } = req.user;
    const bookings = await this.bookingsService.findUserBookings(
      userId,
      role,
      status,
      req,
    );
    return bookings.map((b) => new BookingDetailsDto(b));
  }

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60 } }) // Limita criação de bookings para evitar spikes sem bloquear fluxo legítimo
  @Roles(UserRole.CLIENT)
  @UseGuards(ThrottlerGuard, JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar um novo agendamento (somente o agendamento)',
  })
  @ApiResponse({
    status: 201,
    description: 'Agendamento criado com sucesso.',
    type: BookingDetailsDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({
    status: 404,
    description: 'Provedor ou serviço do provedor não encontrado.',
  })
  async create(
    @Req() req: RequestWithUser,
    @Body() createBookingDto: CreateBookingDto,
  ): Promise<BookingDetailsDto> {
    const userId = req.user.userId;
    const booking = await this.bookingsService.create(
      userId,
      createBookingDto,
      req,
    );
    const bookingWithActions = this.bookingsService.withAllowedActions(
      booking,
      UserRole.CLIENT,
      userId,
    );
    return new BookingDetailsDto(bookingWithActions);
  }

  @Post('quote')
  @Throttle({ default: { limit: 30, ttl: 60 } })
  @Roles(UserRole.CLIENT)
  @UseGuards(ThrottlerGuard, JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar cotação de preço para o booking' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da cotação de preço.',
    type: BookingQuoteResponseDto,
  })
  async quote(
    @Req() req: RequestWithUser,
    @Body() bookingQuoteRequestDto: BookingQuoteRequestDto,
  ): Promise<BookingQuoteResponseDto> {
    const userId = req.user.userId;
    return this.bookingsService.quotePrice(
      userId,
      bookingQuoteRequestDto,
      req,
    );
  }

  @Post('schedule-and-pay')
  @Throttle({ default: { limit: 15, ttl: 60 } }) // Cobrança via PIX merece limite moderado para evitar DoS de QRs
  @Roles(UserRole.CLIENT)
  @UseGuards(ThrottlerGuard, JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cria um novo agendamento e gera a cobrança PIX associada',
  })
  @ApiResponse({
    status: 201,
    description: 'Agendamento criado e cobrança PIX gerada com sucesso.',
    type: BookingAndPixResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({
    status: 404,
    description: 'Provedor, serviço ou cliente não encontrado.',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno ao criar agendamento ou cobrança PIX.',
  })
  async scheduleAndPay(
    @Req() req: RequestWithUser,
    @Body() createBookingDto: CreateBookingDto,
  ): Promise<BookingAndPixResponseDto> {
    const userId = req.user.userId;
    const { booking, pixCharge } =
      await this.bookingsService.createBookingAndPixCharge(
        userId,
        createBookingDto,
        req,
      );

    return {
      booking,
      pixCharge,
    };
  }

  @Post(':id/proof/checkin')
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'Comprovante de check-in registrado.',
    type: BookingProofResponseDto,
  })
  async submitCheckinProof(
    @Req() req: RequestWithUser,
    @Param('id') bookingId: string,
    @Body() proofDto: SubmitBookingProofDto,
  ): Promise<BookingProofResponseDto> {
    const proof = await this.bookingsService.submitProof(
      bookingId,
      req.user.userId,
      BookingProofType.CHECKIN,
      proofDto,
    );
    return new BookingProofResponseDto(proof);
  }

  @Post(':id/proof/checkout')
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'Comprovante de checkout registrado.',
    type: BookingProofResponseDto,
  })
  async submitCheckoutProof(
    @Req() req: RequestWithUser,
    @Param('id') bookingId: string,
    @Body() proofDto: SubmitBookingProofDto,
  ): Promise<BookingProofResponseDto> {
    const proof = await this.bookingsService.submitProof(
      bookingId,
      req.user.userId,
      BookingProofType.CHECKOUT,
      proofDto,
    );
    return new BookingProofResponseDto(proof);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter agendamentos do usuário logado (cliente ou provedor)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de agendamentos do usuário.',
    type: [BookingDetailsDto],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async findMyBookings(
    @Req() req: RequestWithUser,
    @Query('status') status?: BookingStatus,
  ): Promise<BookingDetailsDto[]> {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const bookings = await this.bookingsService.findUserBookings(
      userId,
      userRole,
      status,
      req,
    );
    return bookings.map((booking) => new BookingDetailsDto(booking));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter detalhes de um agendamento específico' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do agendamento.',
    type: BookingDetailsDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  async findOne(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<BookingDetailsDto> {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const booking = await this.bookingsService.findOne(id, req);

    if (!booking) {
      throw new NotFoundException(
        await this.i18n.translate('booking.notFound', req.locale, {
          id,
        }),
      );
    }

    const isClientOfBooking = booking.client.userId === userId;
    const isProviderOfBooking = booking.provider.userId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isClientOfBooking && !isProviderOfBooking && !isAdmin) {
      throw new ForbiddenException(
        await this.i18n.translate('booking.forbidden.access', req.locale),
      );
    }

    return new BookingDetailsDto(
      this.bookingsService.withAllowedActions(booking, userRole, userId),
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.PROVIDER, UserRole.CLIENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar o status de um agendamento' })
  @ApiResponse({
    status: 200,
    description: 'Status do agendamento atualizado com sucesso.',
    type: BookingDetailsDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  async updateStatus(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ): Promise<BookingDetailsDto> {
    const userId = req.user.userId;
    const userRole = req.user.role;

    const booking = await this.bookingsService.findOne(id, req);
    if (!booking) {
      throw new NotFoundException(
        await this.i18n.translate('booking.notFound', req.locale, {
          id,
        }),
      );
    }

    if (userRole === UserRole.CLIENT && booking.client.userId !== userId) {
      throw new ForbiddenException(
        await this.i18n.translate('booking.forbidden.updateStatus', req.locale),
      );
    }
    if (userRole === UserRole.PROVIDER && booking.provider.userId !== userId) {
      throw new ForbiddenException(
        await this.i18n.translate('booking.forbidden.updateStatus', req.locale),
      );
    }

    const updatedBooking = await this.bookingsService.updateStatus(
      id,
      updateBookingStatusDto.status,
      userRole,
      req,
    );
    return new BookingDetailsDto(
      this.bookingsService.withAllowedActions(updatedBooking, userRole, userId),
    );
  }

  @Patch(':id/cancel')
  @Roles(UserRole.CLIENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar um agendamento (pelo cliente)' })
  @ApiResponse({
    status: 200,
    description: 'Agendamento cancelado com sucesso.',
    type: BookingDetailsDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  async cancelBooking(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<BookingDetailsDto> {
    const userId = req.user.userId;
    const booking = await this.bookingsService.findOne(id, req);

    if (!booking) {
      throw new NotFoundException(
        await this.i18n.translate('booking.notFound', req.locale, {
          id,
        }),
      );
    }
    if (booking.client.userId !== userId) {
      throw new ForbiddenException(
        await this.i18n.translate('booking.forbidden.updateStatus', req.locale),
      );
    }

    const updatedBooking = await this.bookingsService.updateStatus(
      id,
      BookingStatus.CANCELED,
      UserRole.CLIENT,
      req,
    );
    return new BookingDetailsDto(
      this.bookingsService.withAllowedActions(
        updatedBooking,
        UserRole.CLIENT,
        userId,
      ),
    );
  }

  @Get('check-active-chat/:clientId/:providerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Verifica se há agendamento ativo entre cliente e provedor para permitir chat',
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna se pode abrir chat e o bookingId, se existir.',
  })
  async checkActiveChat(
    @Param('clientId') clientId: string,
    @Param('providerId') providerId: string,
  ): Promise<{ canChat: boolean; bookingId?: string }> {
    return this.bookingsService.checkActiveChatBooking(clientId, providerId);
  }

  @Post(':id/report-issue')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reportar um problema com um agendamento' })
  @ApiResponse({
    status: 200,
    description:
      'Problema reportado com sucesso. Status do agendamento alterado para PENDING_DISPUTE.',
    type: BookingDetailsDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  @ApiResponse({ status: 400, description: 'Requisição inválida.' })
  async reportIssue(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<BookingDetailsDto> {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException(
        await this.i18n.translate(
          'booking.badRequest.issueReasonRequired',
          req.locale,
        ),
      );
    }
    const userId = req.user.userId;
    const userRole = req.user.role;
    const updatedBooking = await this.bookingsService.reportIssue(
      id,
      userId,
      userRole,
      reason,
      req,
    );
    return new BookingDetailsDto(
      this.bookingsService.withAllowedActions(updatedBooking, userRole, userId),
    );
  }

  @Post(':id/dispute')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reportar uma disputa para um agendamento' })
  @ApiResponse({
    status: 202,
    description:
      'Disputa reportada com sucesso. Será processada em segundo plano.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  @ApiResponse({ status: 400, description: 'Dados da disputa inválidos.' })
  @HttpCode(HttpStatus.ACCEPTED)
  async reportDispute(
    @Req() req: RequestWithUser,
    @Param('id') bookingId: string,
    @Body() reportDisputeDto: ReportDisputeDto,
  ): Promise<MessageResponseDto> {
    const userId = req.user.userId;
    const userRole = req.user.role;
    await this.bookingsService.reportDispute(
      bookingId,
      userId,
      userRole,
      reportDisputeDto,
      req,
    );
    return {
      message: await this.i18n.translate(
        'booking.disputeReportedSuccess',
        req.locale,
      ),
    };
  }

  @Patch(':id/resolve-dispute')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Resolver uma disputa de agendamento (apenas para administradores)',
  })
  @ApiResponse({
    status: 200,
    description: 'Disputa resolvida com sucesso.',
    type: BookingDetailsDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({
    status: 404,
    description: 'Agendamento ou disputa não encontrada.',
  })
  @ApiResponse({ status: 400, description: 'Requisição inválida.' })
  async resolveDispute(
    @Req() req: RequestWithUser,
    @Param('id') bookingId: string,
    @Body('resolution') resolution: string,
    @Body('refundAmount') refundAmount?: number,
    @Body('newStatus') newStatus?: BookingStatus,
  ): Promise<BookingDetailsDto> {
    if (!resolution || resolution.trim().length === 0) {
      throw new BadRequestException(
        await this.i18n.translate(
          'booking.badRequest.disputeResolutionRequired',
          req.locale,
        ),
      );
    }
    const updatedBooking = await this.bookingsService.resolveDispute(
      bookingId,
      resolution,
      refundAmount,
      newStatus,
      req,
    );
    const actorUserId = req.user.userId;
    const actorRole = req.user.role;
    return new BookingDetailsDto(
      this.bookingsService.withAllowedActions(
        updatedBooking,
        actorRole,
        actorUserId,
      ),
    );
  }

  @Post(':id/on-the-way')
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marcar prestador a caminho (CONFIRMED -> ON_THE_WAY)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status atualizado para a caminho.',
    type: BookingDetailsDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  async onTheWay(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user.userId;
    const booking = await this.bookingsService.onTheWayService(id, userId);
    return new BookingDetailsDto(
      this.bookingsService.withAllowedActions(
        booking,
        UserRole.PROVIDER,
        userId,
      ),
    );
  }

  @Post(':id/arrived')
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registrar chegada do prestador (ON_THE_WAY -> ARRIVED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status atualizado para chegou.',
    type: BookingDetailsDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  async arrive(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() location?: BookingLocationDto,
  ) {
    const userId = req.user.userId;
    const booking = await this.bookingsService.arriveAtLocation(
      id,
      userId,
      location,
    );
    return new BookingDetailsDto(
      this.bookingsService.withAllowedActions(
        booking,
        UserRole.PROVIDER,
        userId,
      ),
    );
  }

  @Post(':id/start')
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Iniciar o serviço (prestador)' })
  @ApiResponse({
    status: 200,
    description: 'Serviço iniciado com sucesso.',
    type: BookingDetailsDto,
  })
  async start(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() location?: BookingLocationDto,
  ) {
    const userId = req.user.userId;
    const booking = await this.bookingsService.startService(
      id,
      userId,
      location,
    );
    return new BookingDetailsDto(
      this.bookingsService.withAllowedActions(
        booking,
        UserRole.PROVIDER,
        userId,
      ),
    );
  }

  @Post(':id/complete')
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Concluir o serviço (prestador)' })
  @ApiResponse({
    status: 200,
    description: 'Serviço concluído com sucesso.',
    type: BookingDetailsDto,
  })
  async complete(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() location?: BookingLocationDto,
  ) {
    const userId = req.user.userId;
    const booking = await this.bookingsService.completeService(
      id,
      userId,
      location,
    );
    return new BookingDetailsDto(
      this.bookingsService.withAllowedActions(
        booking,
        UserRole.PROVIDER,
        userId,
      ),
    );
  }

  @Post('auto-complete-overdue')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Auto-completar bookings STARTED cujo horário final já passou e estão pagos',
  })
  @ApiResponse({
    status: 200,
    description: 'Agendamentos auto-completados.',
  })
  async autoCompleteOverdue() {
    return this.bookingsService.autoCompleteOverdueBookings();
  }

  @Get(':id/can-review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verifica se o cliente pode avaliar este booking' })
  @ApiResponse({
    status: 200,
    description: 'Retorna se pode avaliar e detalhes do prestador.',
  })
  async canReview(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.bookingsService.canReview(id, userId);
  }
}
