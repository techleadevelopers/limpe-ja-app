import { IsNotEmpty, IsString } from 'class-validator';

export class TopicSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  topic!: string;
}
