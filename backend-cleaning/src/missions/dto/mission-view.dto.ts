import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MissionStatus } from '@prisma/client';
import { MissionWithProgressView } from '../progress.service';

export class MissionViewDto {
  @ApiProperty({
    description: 'Detalhes da missão (metadados e regras).',
    type: Object,
  })
  mission: MissionWithProgressView['mission'];

  @ApiPropertyOptional({
    description: 'Progresso atual do usuário dentro dessa missão.',
    type: Object,
  })
  progress: MissionWithProgressView['progress'] | null;

  @ApiProperty({
    description: 'Tendência de progresso (0 a 100).',
    example: 70,
  })
  percent: number;

  @ApiProperty({
    description: 'Indica se a missão pode ser resgatada (COMPLETED e não resgatada).',
    example: true,
  })
  canClaim: boolean;

  @ApiProperty({
    description: 'Indica se a missão já foi concluída.',
    example: true,
  })
  isCompleted: boolean;

  constructor(source: MissionWithProgressView) {
    this.mission = source.mission;
    this.progress = source.progress ?? null;
    this.percent = source.percent;
    this.canClaim = source.canClaim;
    this.isCompleted = this.progress?.status === MissionStatus.COMPLETED;
  }
}
