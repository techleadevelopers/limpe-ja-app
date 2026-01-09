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

type RequestWithUser = Request & {
  user?: {
    userId?: string;
    providerId?: string;
    role?: UserRole;
  };
};

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  private readonly logger = new Logger(ReviewsController.name);

  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * Helper para sanitizar objetos de review vindos do Prisma (Date -> String)
   * Isso resolve o erro TS2345 onde o ReviewEntity espera string e recebe Date
   */
  private mapToEntity(review: any): ReviewEntity {
    if (review?.booking) {
      if (review.booking.scheduledDate instanceof Date) {
        review.booking.scheduledDate = review.booking.scheduledDate.toISOString();
      }
      if (review.booking.scheduledTime instanceof Date) {
        review.booking.scheduledTime = review.booking.scheduledTime.toISOString();
      }
    }
    return new ReviewEntity(review);
  }

  @Post()
  @Roles(UserRole.CLIENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enviar uma nova avaliacao para um servico concluido',
  })
  @ApiResponse({
    status: 201,
    description: 'Avaliacao enviada com sucesso.',
    type: ReviewEntity,
  })
  async submitReview(
    @Req() req: RequestWithUser,
    @Body() submitReviewDto: SubmitReviewDto,
  ): Promise<ReviewEntity> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ForbiddenException('Usuario nao autorizado.');
    }
    const review = await this.reviewsService.submitReview(
      userId,
      submitReviewDto,
    );
    return this.mapToEntity(review);
  }

  @Get()
  @ApiOperation({ summary: 'Obter avaliacoes com filtros (publico)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de avaliacoes.',
    type: [ReviewEntity],
  })
  async getReviews(
    @Query() getReviewsDto: GetReviewsDto,
  ): Promise<ReviewEntity[]> {
    const reviews = await this.reviewsService.findReviews(getReviewsDto);
    // Resolve TS2345 mapeando cada item
    return reviews.map((review) => this.mapToEntity(review));
  }

  @Get('provider/:providerId')
  @ApiOperation({
    summary: 'Obter todas as avaliacoes para um provedor especifico',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de avaliacoes do provedor.',
    type: [ReviewEntity],
  })
  async getReviewsByProviderId(
    @Param('providerId') providerId: string,
  ): Promise<ReviewEntity[]> {
    this.logger.log(
      `[ReviewsController] getReviewsByProviderId: Buscando avaliacoes para provedor ID: ${providerId}`,
    );
    const reviews = await this.reviewsService.findReviews({ providerId });
    if (!reviews || reviews.length === 0) {
      return [];
    }
    return reviews.map((review) => this.mapToEntity(review));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter uma avaliacao por ID' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da avaliacao.',
    type: ReviewEntity,
  })
  async getReviewById(@Param('id') id: string): Promise<ReviewEntity> {
    const review = await this.reviewsService.findOne(id);
    if (!review) {
      throw new NotFoundException(`Avaliacao com ID "${id}" nao encontrada.`);
    }
    return this.mapToEntity(review);
  }

  @Get('provider/:providerId/breakdown')
  @ApiOperation({
    summary: 'Obter analise detalhada de avaliacoes do provedor',
  })
  @ApiResponse({
    status: 200,
    description: 'Breakdown detalhado das avaliacoes.',
  })
  async getProviderRatingBreakdown(@Param('providerId') providerId: string) {
    return this.reviewsService.getDetailedRatingBreakdown(providerId);
  }

  @Get('provider/:providerId/suggestions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter sugestoes inteligentes baseadas em IA para o provedor',
  })
  async getSmartSuggestions(
    @Param('providerId') providerId: string,
    @Req() req: RequestWithUser,
  ) {
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Usuario nao autorizado.');
    }
    const { providerId: userProviderId, role } = user;
    if (userProviderId !== providerId && role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Acesso negado as sugestoes deste provedor.',
      );
    }

    return this.reviewsService.generateSmartSuggestions(providerId);
  }
}