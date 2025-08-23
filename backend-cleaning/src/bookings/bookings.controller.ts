// src/bookings/bookings.controller.ts
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, NotFoundException, ForbiddenException, Query, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common'; // CORREÇÃO: Importar BadRequestException, HttpCode, HttpStatus
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingDetailsDto } from './dto/booking-details.dto';
import { BookingAndPixResponseDto } from './dto/booking-and-pix-response.dto'; // Importe o novo DTO de resposta
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BookingStatus, UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ReportDisputeDto, DisputeReason } from './dto/report-dispute.dto'; // Importe o novo DTO de disputa
import { MessageResponseDto } from '../common/dto/message-response.dto'; // Para mensagens de sucesso
import { I18nService } from '../common/i18n/i18n.service'; // Importar I18nService

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly i18n: I18nService, // Injetar I18nService
  ) {}

  @Post()
  @Roles(UserRole.CLIENT) // Apenas clientes podem criar agendamentos
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um novo agendamento (somente o agendamento)' }) // Atualizado o summary
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso.', type: BookingDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Provedor ou serviço do provedor não encontrado.' })
  async create(@Req() req: Request, @Body() createBookingDto: CreateBookingDto): Promise<BookingDetailsDto> {
    const userId = req.user['userId'];
    // Passar o objeto 'req' completo para o service para que ele possa extrair o locale
    const booking = await this.bookingsService.create(userId, createBookingDto, req);
    return new BookingDetailsDto(booking);
  }

  // NOVA ROTA: Criar agendamento e gerar cobrança PIX em uma única chamada
  @Post('schedule-and-pay')
  @Roles(UserRole.CLIENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria um novo agendamento e gera a cobrança PIX associada' })
  @ApiResponse({
    status: 201,
    description: 'Agendamento criado e cobrança PIX gerada com sucesso.',
    type: BookingAndPixResponseDto, // Usar o novo DTO de resposta combinado
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Provedor, serviço ou cliente não encontrado.' })
  @ApiResponse({ status: 500, description: 'Erro interno ao criar agendamento ou cobrança PIX.' })
  async scheduleAndPay(
    @Req() req: Request,
    @Body() createBookingDto: CreateBookingDto, // O mesmo DTO de entrada do agendamento
  ): Promise<BookingAndPixResponseDto> {
    const userId = req.user['userId'];
    // Passar o objeto 'req' completo para o service para que ele possa extrair o locale
    const { booking, pixCharge } = await this.bookingsService.createBookingAndPixCharge(userId, createBookingDto, req);

    // Retorna o DTO combinado
    return {
      booking: new BookingDetailsDto(booking),
      pixCharge: pixCharge,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter agendamentos do usuário logado (cliente ou provedor)' })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos do usuário.', type: [BookingDetailsDto] })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async findMyBookings(@Req() req: Request, @Query('status') status?: BookingStatus): Promise<BookingDetailsDto[]> {
    const userId = req.user['userId'];
    const userRole = req.user['role'];
    // Passar o objeto 'req' completo para o service para que ele possa extrair o locale
    const bookings = await this.bookingsService.findUserBookings(userId, userRole, status, req);
    return bookings.map(booking => new BookingDetailsDto(booking));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter detalhes de um agendamento específico' })
  @ApiResponse({ status: 200, description: 'Detalhes do agendamento.', type: BookingDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<BookingDetailsDto> {
    const userId = req.user['userId'];
    const userRole = req.user['role'];
    // Passar o objeto 'req' completo para o service para que ele possa extrair o locale
    const booking = await this.bookingsService.findOne(id, req);

    if (!booking) {
      // Usar o I18nService para mensagens de erro
      throw new NotFoundException(await this.i18n.translate('booking.notFound', (req as any).locale, { id }));
    }

    // Verifica se o usuário tem permissão para ver este agendamento
    const isClientOfBooking = booking.client.userId === userId;
    const isProviderOfBooking = booking.provider.userId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isClientOfBooking && !isProviderOfBooking && !isAdmin) {
      // Usar o I18nService para mensagens de erro
      throw new ForbiddenException(await this.i18n.translate('booking.forbidden.access', (req as any).locale));
    }

    return new BookingDetailsDto(booking);
  }

  @Patch(':id/status')
  @Roles(UserRole.PROVIDER, UserRole.CLIENT) // Provedor pode CONFIRMAR/COMPLETAR/CANCELAR. Cliente pode CANCELAR.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar o status de um agendamento' })
  @ApiResponse({ status: 200, description: 'Status do agendamento atualizado com sucesso.', type: BookingDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  async updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ): Promise<BookingDetailsDto> {
    const userId = req.user['userId'];
    const userRole = req.user['role'];

    // Passar o objeto 'req' completo para o service para que ele possa extrair o locale
    const booking = await this.bookingsService.findOne(id, req);
    if (!booking) {
      // Usar o I18nService para mensagens de erro
      throw new NotFoundException(await this.i18n.translate('booking.notFound', (req as any).locale, { id }));
    }

    // Lógica de autorização para atualização de status
    if (userRole === UserRole.CLIENT && booking.client.userId !== userId) {
      // Usar o I18nService para mensagens de erro
      throw new ForbiddenException(await this.i18n.translate('booking.forbidden.updateStatus', (req as any).locale));
    }
    if (userRole === UserRole.PROVIDER && booking.provider.userId !== userId) {
      // Usar o I18nService para mensagens de erro
      throw new ForbiddenException(await this.i18n.translate('booking.forbidden.updateStatus', (req as any).locale));
    }

    // Passar o objeto 'req' completo para o service para que ele possa extrair o locale
    const updatedBooking = await this.bookingsService.updateStatus(id, updateBookingStatusDto.status, userRole, req);
    return new BookingDetailsDto(updatedBooking);
  }

  // Rota para cliente cancelar agendamento (exemplo específico do frontend)
  @Patch(':id/cancel')
  @Roles(UserRole.CLIENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar um agendamento (pelo cliente)' })
  @ApiResponse({ status: 200, description: 'Agendamento cancelado com sucesso.', type: BookingDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  async cancelBooking(@Req() req: Request, @Param('id') id: string): Promise<BookingDetailsDto> {
    const userId = req.user['userId'];
    // Passar o objeto 'req' completo para o service para que ele possa extrair o locale
    const booking = await this.bookingsService.findOne(id, req);

    if (!booking) {
      // Usar o I18nService para mensagens de erro
      throw new NotFoundException(await this.i18n.translate('booking.notFound', (req as any).locale, { id }));
    }
    if (booking.client.userId !== userId) {
      // Usar o I18nService para mensagens de erro
      throw new ForbiddenException(await this.i18n.translate('booking.forbidden.updateStatus', (req as any).locale));
    }

    // Passar o objeto 'req' completo para o service para que ele possa extrair o locale
    const updatedBooking = await this.bookingsService.updateStatus(id, BookingStatus.CANCELED, UserRole.CLIENT, req);
    return new BookingDetailsDto(updatedBooking);
  }

  @Post(':id/report-issue')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reportar um problema com um agendamento' })
  @ApiResponse({ status: 200, description: 'Problema reportado com sucesso. Status do agendamento alterado para PENDING_DISPUTE.', type: BookingDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  @ApiResponse({ status: 400, description: 'Requisição inválida.' })
  async reportIssue(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<BookingDetailsDto> {
    if (!reason || reason.trim().length === 0) {
      // Usar o I18nService para mensagens de erro
      throw new BadRequestException(await this.i18n.translate('booking.badRequest.issueReasonRequired', (req as any).locale));
    }
    const userId = req.user['userId'];
    const userRole = req.user['role'];
    // Passar o objeto 'req' completo para o service para que ele possa extrair o locale
    const updatedBooking = await this.bookingsService.reportIssue(id, userId, userRole, reason, req);
    return new BookingDetailsDto(updatedBooking);
  }

  // NOVO ENDPOINT: Gerenciar Disputas (ADMIN ou provedor/cliente envolvido)
  @Post(':id/dispute')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER) // Cliente/Provedor reporta, Admin gerencia
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reportar uma disputa para um agendamento' })
  @ApiResponse({ status: 202, description: 'Disputa reportada com sucesso. Será processada em segundo plano.', type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado.' })
  @ApiResponse({ status: 400, description: 'Dados da disputa inválidos.' })
  @HttpCode(HttpStatus.ACCEPTED)
  async reportDispute(
    @Req() req: Request,
    @Param('id') bookingId: string,
    @Body() reportDisputeDto: ReportDisputeDto,
  ): Promise<MessageResponseDto> {
    const userId = req.user['userId'];
    const userRole = req.user['role'];
    // Passar o objeto 'req' completo para o service para que ele possa extrair o locale
    await this.bookingsService.reportDispute(bookingId, userId, userRole, reportDisputeDto, req);
    // Usar o I18nService para mensagens de sucesso
    return { message: await this.i18n.translate('booking.disputeReportedSuccess', (req as any).locale) };
  }

  @Patch(':id/resolve-dispute')
  @Roles(UserRole.ADMIN) // Apenas administradores podem resolver disputas
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolver uma disputa de agendamento (apenas para administradores)' })
  @ApiResponse({ status: 200, description: 'Disputa resolvida com sucesso.', type: BookingDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Agendamento ou disputa não encontrada.' })
  @ApiResponse({ status: 400, description: 'Requisição inválida.' })
  async resolveDispute(
    @Req() req: Request, // Adicionado req aqui
    @Param('id') bookingId: string,
    @Body('resolution') resolution: string,
    @Body('refundAmount') refundAmount?: number,
    @Body('newStatus') newStatus?: BookingStatus,
  ): Promise<BookingDetailsDto> {
    if (!resolution || resolution.trim().length === 0) {
      // Usar o I18nService para mensagens de erro
      throw new BadRequestException(await this.i18n.translate('booking.badRequest.disputeResolutionRequired', (req as any).locale));
    }
    // Passar o objeto 'req' completo para o service para que ele possa extrair o locale
    const updatedBooking = await this.bookingsService.resolveDispute(bookingId, resolution, refundAmount, newStatus, req);
    return new BookingDetailsDto(updatedBooking);
  }
}