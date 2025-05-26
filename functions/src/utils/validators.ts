// LimpeJaApp/functions/src/utils/validators.ts

// TODO: Implementar funções de validação robustas (ex: usando uma lib como Zod ou Joi, ou regex mais completos)

export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simples, pode ser melhorado
  return emailRegex.test(email.trim()); // Adicionado trim() para remover espaços extras
};

/**
 * Valida um CPF brasileiro.
 * Esta função verifica o formato e os dígitos verificadores.
 */
export const isValidCPF = (cpf: string): boolean => {
  if (!cpf) return false;
  const cpfLimpio = cpf.replace(/\D/g, ''); // Remove todos os não dígitos

  if (cpfLimpio.length !== 11 || /^(\d)\1{10}$/.test(cpfLimpio)) { // Verifica se tem 11 dígitos e não são todos iguais
    return false;
  }

  let soma = 0;
  let resto: number;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpio.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(cpfLimpio.substring(9, 10))) {
    return false;
  }

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfLimpio.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(cpfLimpio.substring(10, 11))) {
    return false;
  }

  return true; // Se passou em todas as verificações
};

/**
 * Valida um número de telefone brasileiro (celular ou fixo).
 * Considera formatos como (XX) XXXXX-XXXX, XX XXXXX XXXX, XXXXXXXXXXX, etc.
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  const phoneLimpio = phone.replace(/\D/g, ''); // Remove não dígitos

  // Verifica se tem 10 ou 11 dígitos (para fixo sem 9 e celular com 9)
  if (phoneLimpio.length !== 10 && phoneLimpio.length !== 11) {
    return false;
  }
  // Regex mais abrangente para formatos comuns após limpar não dígitos
  // Este regex apenas verifica a quantidade de dígitos após limpeza e o DDD básico.
  // DDDs válidos vão de 11 a 99 (excluindo alguns não existentes, mas simplificando aqui)
  // Primeiros dígitos do número (após DDD) não podem ser 0 ou 1.
  if (!/^[1-9]{2}[2-9][0-9]{7,8}$/.test(phoneLimpio)) {
      return false;
  }
  return true;
};

export const isValidPassword = (password: string, minLength = 6): boolean => {
  if (!password || password.length < minLength) { // Verifica se a senha não é nula/vazia antes de .length
    return false;
  }
  // Você pode adicionar mais regras aqui (ex: requer maiúscula, número, caractere especial)
  // Exemplo: Pelo menos uma letra maiúscula, uma minúscula, um número e 6 caracteres
  // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;
  // return passwordRegex.test(password);
  return true; // Mantendo a validação simples de tamanho por enquanto
};

/**
 * Valida um CEP brasileiro (formato XXXXX-XXX ou XXXXXXXX).
 */
export const isValidCEP = (cep: string): boolean => {
    if (!cep) return false;
    const cepLimpio = cep.replace(/\D/g, '');
    if (cepLimpio.length !== 8) {
        return false;
    }
    // Regex para verificar se todos são dígitos (já feito pelo replace, mas para garantir)
    // e não são todos iguais (ex: 00000-000)
    if (!/^\d{8}$/.test(cepLimpio) || /^(\d)\1{7}$/.test(cepLimpio)) {
        return false;
    }
    return true;
};


// TODO: Adicionar outras validações conforme necessário:
// - Validação de Data (ex: se uma data está no futuro/passado, formato)
// - Validação de campos de texto (comprimento mínimo/máximo, caracteres permitidos)