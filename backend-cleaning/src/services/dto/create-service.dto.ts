// src/services/dto/create-service.dto.ts
import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer'; // Adicionado para transformar string em number se necessário

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty() // Garante que não seja uma string vazia
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsNotEmpty() // Garante que o preço não seja nulo ou indefinido
  @Type(() => Number) // Garante que o valor seja tratado como um número se vier como string (ex: de um formulário)
  price: number; // <-- AGORA É OBRIGATÓRIO! Removido o '?'

  @IsOptional()
  @IsString()
  icon?: string;
}