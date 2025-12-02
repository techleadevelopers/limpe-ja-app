// src/services/dto/update-service.dto.ts
import { PartialType } from '@nestjs/swagger'; // Certifique-se de que é do @nestjs/swagger
// Se estiver usando @nestjs/mapped-types, importaria de lá:
// import { PartialType } from '@nestjs/mapped-types';

import { CreateServiceDto } from './create-service.dto'; // Importa o DTO base atualizado

// UpdateServiceDto herda todas as propriedades de CreateServiceDto e as torna opcionais.
// Como CreateServiceDto AGORA inclui 'icon?: string;',
// UpdateServiceDto automaticamente também incluirá 'icon?: string;'.
export class UpdateServiceDto extends PartialType(CreateServiceDto) {}
