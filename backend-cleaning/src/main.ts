import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as admin from 'firebase-admin'; // Importação do Firebase Admin SDK
import * as path from 'path'; // Adicione a importação de 'path' para o fallback do JSON

async function bootstrap() {
  console.time('AppStartupTotal'); // Inicia contagem total

  console.time('NestAppCreation');
  const app = await NestFactory.create(AppModule);
  console.timeEnd('NestAppCreation'); // Fim da criação da instância Nest

  // Configuração do CORS (ATUALIZADA) para permitir comunicação com o frontend
  app.enableCors({
    origin: [
      'http://localhost:8081', // Seu ambiente de desenvolvimento Expo Web (como visto nas logs)
      'http://localhost', // Para outros casos de localhost sem porta específica
      'exp://localhost:8081', // Para Expo Go em emuladores/dispositivos Android
      'http://localhost:19000', // Porta padrão do Expo Web
      'http://localhost:19001', // Outra porta comum do Expo Web
      'http://localhost:5173', // <--- ADICIONADO: URL do seu painel de administração web
      // Adicione a URL do seu frontend em produção AQUI quando você tiver ela
      // Exemplo: 'https://seunomeapp.web.app', ou a URL do Cloud Run se for um frontend web hospedado lá
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Métodos HTTP permitidos
    credentials: true, // Permitir credenciais como tokens de autorização
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Inicialização do Firebase Admin SDK
  try {
    // Tenta inicializar o SDK automaticamente (ideal para Cloud Run/GCP)
    admin.initializeApp();
    console.log('[Firebase Admin] SDK inicializado automaticamente no ambiente Cloud Run.'); // Log de sucesso
  } catch (error) {
    console.error(`[Firebase Admin] Erro na inicialização automática do SDK: ${error.message}`); // Log de erro na inicialização automática
    // Fallback para ambiente local usando GOOGLE_APPLICATION_CREDENTIALS
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
            const serviceAccountPath = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('[Firebase Admin] SDK inicializado via GOOGLE_APPLICATION_CREDENTIALS.');
        } catch (innerError) {
            console.error(`[Firebase Admin] Erro ao carregar credenciais de GOOGLE_APPLICATION_CREDENTIALS: ${innerError.message}`); // Log de erro ao carregar credenciais
            throw new Error('Firebase Admin SDK failed to initialize via GOOGLE_APPLICATION_CREDENTIALS.'); // Lança erro fatal
        }
    } else {
        console.warn('[Firebase Admin] Firebase Admin SDK não foi inicializado. Funções que dependem dele podem falhar.');
    }
  }

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('LimpeJá API') // Título da sua API
    .setDescription('Documentação da API do marketplace de serviços LimpeJá') // Descrição da API
    .setVersion('1.0') // Versão da API
    .addBearerAuth( // Adiciona suporte a autenticação Bearer (JWT)
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT',
        in: 'header',
      },
      'access-token' // Nome para referenciar este esquema de segurança
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // 'api' é o caminho onde a documentação estará disponível (ex: http://localhost:3000/api)

  // Obtém a porta do serviço de configuração
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000; // Cloud Run usa a porta 8080 padrão

  console.time('AppListening'); // Inicia contagem para a fase de escuta
  await app.listen(port, '0.0.0.0'); // Listen em '0.0.0.0' é crucial para contêineres como Cloud Run
  console.timeEnd('AppListening'); // Fim da fase de escuta

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation available at: ${await app.getUrl()}/api`); // Log para a URL do Swagger
  console.timeEnd('AppStartupTotal'); // Fim da contagem total
}
bootstrap();
