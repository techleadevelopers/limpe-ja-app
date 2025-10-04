import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { QueuesService } from '../queues/queues.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin-queues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/queues')
export class AdminQueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Get('status')
  async getQueuesStatus() {
    return this.queuesService.getAllQueuesStatus();
  }

  @Get(':queueName/jobs')
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status (waiting, active, completed, failed, delayed, paused, all)' })
  async getJobs(
    @Param('queueName') queueName: string,
    @Query('status') status?: string,
  ) {
    return this.queuesService.getJobsByStatus(queueName, status);
  }

  @Post(':queueName/jobs/:jobId/retry')
  async retryJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    await this.queuesService.retryJobById(queueName, jobId);
    return { message: `Job ${jobId} reenfileirado com sucesso` };
  }
}
