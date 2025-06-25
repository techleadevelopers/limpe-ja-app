import { Controller, Get, Post, Body, Param, UseGuards, Req, NotFoundException, ForbiddenException, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { GetReviewsDto } from './dto/get-reviews.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ReviewEntity } from './entities/review.entity';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(UserRole.CLIENT) // Apenas clientes podem enviar avaliações
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar uma nova avaliação para um serviço concluído' })
  @ApiResponse({ status: 201, description: 'Avaliação enviada com sucesso.', type: ReviewEntity })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado ou não concluído.' })
  @ApiResponse({ status: 409, description: 'Agendamento já possui uma avaliação.' })
  async submitReview(@Req() req: Request, @Body() submitReviewDto: SubmitReviewDto): Promise<ReviewEntity> {
    const clientId = req.user['clientId']; // Assumindo que o clientId está no payload do JWT do cliente
    const review = await this.reviewsService.submitReview(clientId, submitReviewDto);
    return new ReviewEntity(review);
  }

  @Get()
  @ApiOperation({ summary: 'Obter avaliações com filtros (pode ser público)' })
  @ApiResponse({ status: 200, description: 'Lista de avaliações.', type: [ReviewEntity] })
  @ApiResponse({ status: 404, description: 'Nenhuma avaliação encontrada com os filtros fornecidos.' })
  async getReviews(@Query() getReviewsDto: GetReviewsDto): Promise<ReviewEntity[]> {
    const reviews = await this.reviewsService.findReviews(getReviewsDto);
    return reviews.map(review => new ReviewEntity(review));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter uma avaliação por ID' })
  @ApiResponse({ status: 200, description: 'Detalhes da avaliação.', type: ReviewEntity })
  @ApiResponse({ status: 404, description: 'Avaliação não encontrada.' })
  async getReviewById(@Param('id') id: string): Promise<ReviewEntity> {
    const review = await this.reviewsService.findOne(id);
    if (!review) {
      throw new NotFoundException(`Avaliação com ID "${id}" não encontrada.`);
    }
    return new ReviewEntity(review);
  }
}