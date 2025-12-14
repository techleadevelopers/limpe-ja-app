// src/reviews/reviews.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
  Query,
  Logger,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { GetReviewsDto } from './dto/get-reviews.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ReviewEntity } from './entities/review.entity';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  // Declare and initialize the logger
  private readonly logger = new Logger(ReviewsController.name);

  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(UserRole.CLIENT) // Apenas clientes podem enviar avaliações
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enviar uma nova avaliação para um serviço concluído',
  })
  @ApiResponse({
    status: 201,
    description: 'Avaliação enviada com sucesso.',
    type: ReviewEntity,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({
    status: 404,
    description: 'Agendamento não encontrado ou não concluído.',
  })
  @ApiResponse({
    status: 409,
    description: 'Agendamento já possui uma avaliação.',
  })
  async submitReview(
    @Req() req: Request,
    @Body() submitReviewDto: SubmitReviewDto,
  ): Promise<ReviewEntity> {
    const userId = req.user['userId']; // usa userId do JWT
    const review = await this.reviewsService.submitReview(userId, submitReviewDto);
    return new ReviewEntity(review);
  }

  @Get()
  @ApiOperation({ summary: 'Obter avaliações com filtros (pode ser público)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de avaliações.',
    type: [ReviewEntity],
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhuma avaliação encontrada com os filtros fornecidos.',
  })
  async getReviews(
    @Query() getReviewsDto: GetReviewsDto,
  ): Promise<ReviewEntity[]> {
    const reviews = await this.reviewsService.findReviews(getReviewsDto);
    return reviews.map((review) => new ReviewEntity(review));
  }

  // NEW ENDPOINT: Get reviews for a specific provider
  @Get('provider/:providerId')
  @ApiOperation({
    summary: 'Obter todas as avaliações para um provedor específico',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de avaliações do provedor.',
    type: [ReviewEntity],
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhuma avaliação encontrada para o provedor.',
  })
  async getReviewsByProviderId(
    @Param('providerId') providerId: string,
  ): Promise<ReviewEntity[]> {
    this.logger.log(
      `[ReviewsController] getReviewsByProviderId: Buscando avaliações para provedor ID: ${providerId}`,
    );
    const reviews = await this.reviewsService.findReviews({ providerId }); // Reusing findReviews with providerId filter
    if (!reviews || reviews.length === 0) {
      // É melhor retornar um array vazio do que lançar 404 para um endpoint de lista
      return [];
    }
    return reviews.map((review) => new ReviewEntity(review));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter uma avaliação por ID' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da avaliação.',
    type: ReviewEntity,
  })
  @ApiResponse({ status: 404, description: 'Avaliação não encontrada.' })
  async getReviewById(@Param('id') id: string): Promise<ReviewEntity> {
    const review = await this.reviewsService.findOne(id);
    if (!review) {
      throw new NotFoundException(`Avaliação com ID "${id}" não encontrada.`);
    }
    return new ReviewEntity(review);
  }

  @Get('provider/:providerId/breakdown')
  @ApiOperation({
    summary: 'Obter análise detalhada de avaliações do provedor',
  })
  @ApiResponse({
    status: 200,
    description: 'Breakdown detalhado das avaliações.',
  })
  async getProviderRatingBreakdown(@Param('providerId') providerId: string) {
    return this.reviewsService.getDetailedRatingBreakdown(providerId);
  }

  @Get('provider/:providerId/suggestions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter sugestões inteligentes baseadas em IA para o provedor',
  })
  @ApiResponse({ status: 200, description: 'Lista de sugestões inteligentes.' })
  async getSmartSuggestions(
    @Param('providerId') providerId: string,
    @Req() req: Request,
  ) {
    // Verificar se o usuário tem permissão para ver as sugestões deste provedor
    const userProviderId = req.user['providerId'];
    if (userProviderId !== providerId && req.user['role'] !== 'ADMIN') {
      throw new ForbiddenException(
        'Acesso negado às sugestões deste provedor.',
      );
    }

    return this.reviewsService.generateSmartSuggestions(providerId);
  }
}
