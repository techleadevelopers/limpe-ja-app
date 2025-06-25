// src/verification/document-processing.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express'; // Importar Express para o tipo Multer.File
import { File } from 'multer'; // <-- ADICIONADO: Importar File diretamente de 'multer'

interface BackgroundCheckResult {
  status: 'SUCCESS' | 'FAILED';
  hasIssues: boolean;
  details?: string;
  reportId?: string;
  [key: string]: any;
}

@Injectable()
export class DocumentProcessingService {
  constructor(private configService: ConfigService) {}

  async uploadImage(file: File, path: string): Promise<string> { // <-- ATUALIZADO: Usar File do multer
    console.log(`Simulando upload de imagem para: ${path}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return `https://mock-storage.com/${path}`;
  }

  async processDocumentOcr(file: File): Promise<any> { // <-- ATUALIZADO: Usar File do multer
    console.log('Simulando processamento OCR do documento...');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      extractedText: 'Nome: João Silva, CPF: 12345678900',
      confidence: 0.95,
    };
  }

  async compareFaces(selfieFile: File, documentImageUrl: string): Promise<boolean> { // <-- ATUALIZADO: Usar File do multer
    console.log('Simulando comparação facial...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return true;
  }

  async performLivenessCheck(selfieFile: File): Promise<boolean> { // <-- ATUALIZADO: Usar File do multer
    console.log('Simulando verificação de prova de vida (liveness check)...');
    await new Promise((resolve) => setTimeout(resolve, 1800));
    return true;
  }
}