import { ContactLeakDetector } from './contact-leak-detector.service';

describe('ContactLeakDetector', () => {
  let detector: ContactLeakDetector;

  beforeEach(() => {
    detector = new ContactLeakDetector();
  });

  it('detects phone leaks with Brazilian formats', () => {
    const result = detector.detect('Me avisa no (11) 98765-4321 amanhã');
    expect(result).not.toBeNull();
    expect(result?.type).toBe('PHONE');
    expect(result?.matches[0]).toBe('(11) 98765-4321');
  });

  it('detects email leaks', () => {
    const result = detector.detect('Meu e-mail é contato@limpeja.com');
    expect(result?.type).toBe('EMAIL');
    expect(result?.matches[0]).toBe('contato@limpeja.com');
  });

  it('detects link leaks', () => {
    const result = detector.detect('https://wa.me/5511987654321');
    expect(result?.type).toBe('LINK');
    expect(result?.matches).toContain('https://wa.me/5511987654321');
  });

  it('hashMatch returns stable 16-digit string', () => {
    const hash = detector.hashMatch('segredo');
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
    expect(detector.hashMatch('segredo')).toBe(hash);
  });
});
