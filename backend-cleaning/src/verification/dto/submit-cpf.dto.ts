// src/verification/dto/submit-cpf.dto.ts
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class SubmitCpfDto {
  @IsNotEmpty({ message: 'CPF é obrigatório.' })
  @IsString({ message: 'CPF deve ser uma string.' })
  @Length(11, 11, { message: 'CPF deve ter 11 dígitos.' })
  @Matches(/^\d{11}$/, { message: 'CPF deve conter apenas números.' })
  cpf: string;
}
