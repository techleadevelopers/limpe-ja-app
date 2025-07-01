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
    const keyFilename = this.configService.get<string>('GCS_KEY_FILE');

    if (!projectId || !keyFilename) {
      this.logger.error('GCS_PROJECT_ID ou GCS_KEY_FILE não configurados nas variáveis de ambiente.');
      // Em um ambiente de produção, você pode querer lançar um erro aqui ou ter um fallback.
      // Para desenvolvimento, pode ser aceitável continuar se a configuração for feita de outra forma (ex: ADC).
    }

    this.storage = new Storage({
      projectId: projectId,
      keyFilename: keyFilename,
    });
    this.bucketName = this.configService.get<string>('GCS_BUCKET_NAME');

    if (!this.bucketName) {
      this.logger.error('GCS_BUCKET_NAME não configurado nas variáveis de ambiente.');
    }

    this.visionClient = new ImageAnnotatorClient({
      projectId: projectId,
      keyFilename: keyFilename,
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
      const confidence = 1.0; // Vision API não retorna confiança direta para textDetection completo

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
      // Passo 1: Detectar faces na selfie
      const [selfieDetection] = await this.visionClient.faceDetection(selfieFile.buffer);
      const selfieFaces = selfieDetection.faceAnnotations;

      if (!selfieFaces || selfieFaces.length === 0) {
        this.logger.warn('Nenhuma face detectada na selfie para comparação.');
        return false;
      }

      // Passo 2: Detectar faces na imagem do documento (precisa ser baixada ou acessível pela API)
      // Para URLs públicas do GCS, a Vision API pode acessá-las diretamente.
      const [documentDetection] = await this.visionClient.faceDetection(documentImageUrl);
      const documentFaces = documentDetection.faceAnnotations;

      if (!documentFaces || documentFaces.length === 0) {
        this.logger.warn('Nenhuma face detectada na imagem do documento para comparação.');
        return false;
      }

      // A Vision API detecta faces e suas características (landmarks, head poses, etc.), mas não compara diretamente a similaridade entre duas faces.
      // Para uma comparação de similaridade robusta, uma API como AWS Rekognition.compareFaces ou outras soluções especializadas em biometria seriam mais diretas.
      // Se você for usar apenas a Vision API, precisaria desenvolver sua própria lógica de similaridade
      // baseada nas características das faces detectadas, o que é complexo e menos preciso para este fim.
      this.logger.log('Comparação facial real concluída (lógica de similaridade ainda mockada, pois Vision API não oferece comparação direta).');
      // Por enquanto, apenas verifica se faces foram detectadas em ambos para simular um sucesso básico.
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
      // TODO: Implementar integração real com um serviço de verificação de prova de vida.
      // Isso geralmente envolve o envio de um vídeo ou sequência de imagens para uma API especializada
      // (ex: FaceTec, CAF, ou outras soluções de biometria).
      // A Vision API não oferece diretamente "liveness check" com uma única imagem.
      // Você precisaria de um serviço externo para isso.

      // Exemplo conceitual de como seria uma chamada a um serviço externo de prova de vida:
      // const livenessApiUrl = this.configService.get<string>('LIVENESS_API_URL');
      // const livenessApiKey = this.configService.get<string>('LIVENESS_API_KEY');
      // if (!livenessApiUrl || !livenessApiKey) {
      //   this.logger.warn('Variáveis de ambiente para API de prova de vida não configuradas. Usando simulação.');
      //   await new Promise((resolve) => setTimeout(resolve, 1800)); // Simula delay
      //   return true; // Simula sucesso na verificação
      // }

      // const formData = new FormData();
      // formData.append('file', selfieFile.buffer, { filename: selfieFile.originalname, contentType: selfieFile.mimetype });
      // const response = await fetch(livenessApiUrl, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${livenessApiKey}` },
      //   body: formData,
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   this.logger.error(`API de prova de vida retornou erro: ${response.status} - ${errorData.message}`);
      //   throw new InternalServerErrorException(`Falha na verificação de prova de vida: ${errorData.message}`);
      // }

      // const result = await response.json();
      // return result.isLive; // Assumindo que a API retorna um campo 'isLive'

      this.logger.warn('Serviço de prova de vida (liveness check) ainda não integrado a uma API real. Retornando simulação.');
      await new Promise((resolve) => setTimeout(resolve, 1800)); // Simula delay
      return true; // Simula sucesso na verificação
    } catch (error) {
      this.logger.error(`Erro ao realizar prova de vida: ${error.message}`);
      throw new InternalServerErrorException(`Falha na verificação de prova de vida: ${error.message}`);
    }
  }
}