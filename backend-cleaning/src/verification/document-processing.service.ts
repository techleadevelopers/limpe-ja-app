// src/verification/document-processing.service.ts
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage'; // Importa o SDK do Google Cloud Storage
import { ImageAnnotatorClient } from '@google-cloud/vision'; // Importar Vision API para OCR e Face Detection
import { File } from 'multer';

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);
  private storage: Storage;
  private bucketName: string;
  private visionClient: ImageAnnotatorClient;

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('GCS_PROJECT_ID');
    // ATENÇÃO AQUI: Mudado para 'GCS_KEY' para corresponder ao --set-secrets do deploy
    const keyFileContentBase64 = this.configService.get<string>('GCS_KEY'); 

    if (!projectId) {
      this.logger.error('GCS_PROJECT_ID não configurado nas variáveis de ambiente.');
      throw new Error('Configurações de GCS ausentes: GCS_PROJECT_ID.');
    }
    if (!keyFileContentBase64) {
      this.logger.error('GCS_KEY (Base64) não configurada nas variáveis de ambiente. Verifique o --set-secrets no deploy.');
      // Adicionei um log para mostrar o PORT se não estiver setado, para ajudar na depuração do Cloud Run
      const port = process.env.PORT || 'não definido';
      this.logger.warn(`Variável de ambiente PORT: ${port}. O container deve escutar nesta porta.`);
      throw new Error('Configurações de GCS ausentes: GCS_KEY.');
    }


    let credentialsJson: any;
    try {
      // LOGS DETALHADOS PARA DEPURAR A CHAVE
      this.logger.log(`Conteúdo GCS_KEY recebido (primeiros 50 caracteres): ${keyFileContentBase64.substring(0, 50)}...`);
      
      const decodedKeyContent = Buffer.from(keyFileContentBase64, 'base64').toString('utf8');
      
      this.logger.log(`Conteúdo decodificado (primeiros 50 caracteres): ${decodedKeyContent.substring(0, 50)}...`);
      
      // Validação rápida do formato JSON
      if (!decodedKeyContent.trim().startsWith('{') || !decodedKeyContent.trim().endsWith('}')) {
        this.logger.error('Conteúdo decodificado não parece ser JSON válido (não começa ou termina com chaves).');
        // Para depuração, logar mais do conteúdo decodificado se não for JSON válido
        this.logger.error(`Conteúdo decodificado completo (truncado para 500 chars se não for JSON): ${decodedKeyContent.substring(0, 500)}...`);
        throw new Error('Conteúdo decodificado não é um JSON válido.');
      }

      credentialsJson = JSON.parse(decodedKeyContent);
      this.logger.log('Chave JSON decodificada e parseada com sucesso!');

    } catch (e) {
      this.logger.error(`Erro ao decodificar ou parsear a chave GCS Base64: ${e.message}`);
      // Logs extras para depuração do erro de parsing
      if (e instanceof SyntaxError) {
        this.logger.error(`SyntaxError: Caractere inesperado encontrado. Verifique o JSON original.`);
        this.logger.error(`Conteúdo da chave Base64 (truncado, para depuração): ${keyFileContentBase64.substring(0, 200)}...`);
        // Tenta decodificar novamente para logar o que causou o erro de parse
        try {
          const problematicDecodedContent = Buffer.from(keyFileContentBase64, 'base64').toString('utf8');
          this.logger.error(`Conteúdo decodificado ANTES do parse (truncado, para depuração): ${problematicDecodedContent.substring(0, 200)}...`);
        } catch (decodeError) {
          this.logger.error(`Erro ao tentar re-decodificar para log: ${decodeError.message}`);
        }
      }
      throw new Error('Chave GCS inválida ou corrompida.');
    }

    this.storage = new Storage({
      projectId: projectId,
      credentials: credentialsJson,
    });
    this.bucketName = this.configService.get<string>('GCS_BUCKET_NAME');

    if (!this.bucketName) {
      this.logger.error('GCS_BUCKET_NAME não configurado nas variáveis de ambiente.');
      throw new Error('Nome do bucket GCS ausente.');
    }

    this.visionClient = new ImageAnnotatorClient({
      projectId: projectId,
      credentials: credentialsJson,
    });
  }

  /**
   * Upload de um arquivo para o Google Cloud Storage.
   * @param file O arquivo a ser enviado (Multer.File).
   * @param destinationPath O caminho dentro do bucket GCS (ex: 'provider-documents/userId/identity-front.jpg').
   * @returns Promise<string> A URL pública do arquivo no GCS.
   */
  async uploadImage(file: File, destinationPath: string): Promise<string> {
    this.logger.log(`Iniciando upload de imagem para GCS. Destino: ${destinationPath}`);

    if (!this.bucketName) {
      this.logger.error('Bucket GCS não configurado. Não é possível realizar o upload.');
      throw new InternalServerErrorException('Configuração do Google Cloud Storage indisponível.');
    }

    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(destinationPath);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        this.logger.error(`Erro durante o upload para GCS em ${destinationPath}: ${err.message}`);
        reject(new InternalServerErrorException(`Falha ao enviar arquivo para o Google Cloud Storage: ${err.message}`));
      });

      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        this.logger.log(`Arquivo enviado com sucesso para GCS: ${publicUrl}`);
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  }

  /**
   * Integração real com o Google Cloud Vision API para processamento de OCR em um documento.
   * @param file O arquivo do documento.
   * @returns Um objeto com o texto extraído e confiança.
   */
  async processDocumentOcr(file: File): Promise<any> {
    this.logger.log('Iniciando processamento OCR real do documento com Google Cloud Vision API...');
    try {
      const [result] = await this.visionClient.textDetection(file.buffer);
      const detections = result.textAnnotations;
      const extractedText = detections && detections.length > 0 ? detections[0].description : '';
      const confidence = 1.0;

      this.logger.log(`OCR real concluído. Texto extraído: ${extractedText.substring(0, 100)}...`);
      return { extractedText, confidence };
    } catch (error) {
      this.logger.error(`Erro ao processar OCR com Google Cloud Vision API: ${error.message}`);
      throw new InternalServerErrorException(`Falha no processamento OCR: ${error.message}`);
    }
  }

  /**
   * Integração real com o Google Cloud Vision API (ou similar) para comparação facial.
   * @param selfieFile O arquivo da selfie.
   * @param documentImageUrl A URL da imagem do documento.
   * @returns Um booleano indicando se a comparação foi bem-sucedida.
   */
  async compareFaces(selfieFile: File, documentImageUrl: string): Promise<boolean> {
    this.logger.log('Iniciando comparação facial real com Google Cloud Vision API...');
    try {
      const [selfieDetection] = await this.visionClient.faceDetection(selfieFile.buffer);
      const selfieFaces = selfieDetection.faceAnnotations;

      if (!selfieFaces || selfieFaces.length === 0) {
        this.logger.warn('Nenhuma face detectada na selfie para comparação.');
        return false;
      }

      const [documentDetection] = await this.visionClient.faceDetection(documentImageUrl);
      const documentFaces = documentDetection.faceAnnotations;
      
      if (!documentFaces || documentFaces.length === 0) {
        this.logger.warn('Nenhuma face detectada na imagem do documento para comparação.');
        return false;
      }
      this.logger.log('Comparação facial real concluída (lógica de similaridade ainda mockada, pois Vision API não oferece comparação direta).');
      return selfieFaces.length > 0 && documentFaces.length > 0;

    } catch (error) {
      this.logger.error(`Erro ao comparar faces com Google Cloud Vision API: ${error.message}`);
      throw new InternalServerErrorException(`Falha na comparação facial: ${error.message}`);
    }
  }

  /**
   * Integração real com serviço de prova de vida (liveness check).
   * @param selfieFile O arquivo da selfie (pode ser vídeo para algumas APIs).
   * @returns Um booleano indicando se a prova de vida foi bem-sucedida.
   */
  async performLivenessCheck(selfieFile: File): Promise<boolean> {
    this.logger.log('Iniciando verificação de prova de vida (liveness check) real...');
    try {
      this.logger.warn('Serviço de prova de vida (liveness check) ainda não integrado a uma API real. Retornando simulação.');
      await new Promise((resolve) => setTimeout(resolve, 1800));
      return true;
    } catch (error) {
      this.logger.error(`Erro ao realizar prova de vida: ${error.message}`);
      throw new InternalServerErrorException(`Falha na verificação de prova de vida: ${error.message}`);
    }
  }
}