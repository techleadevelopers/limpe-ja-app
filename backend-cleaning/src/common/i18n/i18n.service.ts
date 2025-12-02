import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class I18nService {
  private readonly logger = new Logger(I18nService.name);
  private translations: Map<string, Record<string, string>> = new Map();
  private defaultLocale = 'pt-BR';

  constructor() {
    this.loadTranslations();
  }

  private getDistLocalesPath() {
    return path.join(process.cwd(), 'dist', 'common', 'i18n', 'locales');
  }
  private getSrcLocalesPath() {
    return path.join(process.cwd(), 'src', 'common', 'i18n', 'locales');
  }
  private resolveLocalesPath(): string | null {
    const dist = this.getDistLocalesPath();
    if (fs.existsSync(dist)) return dist;
    const src = this.getSrcLocalesPath();
    if (fs.existsSync(src)) return src;
    return null;
  }

  private loadTranslations() {
    const localesPath = this.resolveLocalesPath();
    if (!localesPath) {
      // Primeira execução sem assets copiados: apenas avisa em nível "warn"
      this.logger.warn(
        `Nenhuma pasta de traduções encontrada em dist/ nem src/. Continuo sem i18n até os assets serem copiados.`,
      );
      return;
    }

    try {
      const files = fs.readdirSync(localesPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const locale = file.replace('.json', '');
          const filePath = path.join(localesPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          this.translations.set(locale, JSON.parse(content));
          this.logger.log(`Traduções carregadas: ${locale} (${filePath})`);
        }
      }
      if (this.translations.size === 0) {
        this.logger.warn(
          `Nenhum arquivo .json de tradução encontrado em: ${localesPath}`,
        );
      }
    } catch (error: any) {
      // Não travar a aplicação por isso
      this.logger.warn(
        `Falha ao ler traduções em '${localesPath}': ${error.message}. Vou continuar usando as chaves.`,
      );
    }
  }

  async translate(
    key: string,
    locale: string = this.defaultLocale,
    args: Record<string, any> = {},
  ): Promise<string> {
    const translationMap =
      this.translations.get(locale) ||
      this.translations.get(this.defaultLocale);

    let message = translationMap?.[key];
    if (!message) message = key;

    return message.replace(/\{(\w+)\}/g, (_ph, k) =>
      args[k] !== undefined ? String(args[k]) : `{${k}}`,
    );
  }
}
