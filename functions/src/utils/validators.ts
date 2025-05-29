import { z, ZodErrorMap, ZodIssue, ZodError, ZodIssueOptionalMessage, ErrorMapCtx } from 'zod'; // Import ErrorMapCtx

// --- Esquemas Zod Base ---

// Validação de CPF (mantendo a função manual, pois é específica)
const isValidCPFManual = (cpf: string): boolean => {
  if (!cpf) return false;
  const cpfLimpio = cpf.replace(/\D/g, '');
  if (cpfLimpio.length !== 11 || /^(\d)\1{10}$/.test(cpfLimpio)) return false;
  let soma = 0;
  let resto: number;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpfLimpio.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpio.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpfLimpio.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpio.substring(10, 11))) return false;
  return true;
};

// Validação de Telefone (mantendo uma base manual para o regex, mas integrada ao Zod)
const brazilianPhoneNumberRegex = /^[1-9]{2}[2-9][0-9]{7,8}$/; // DDD + número (fixo ou celular com 9)
const isValidPhoneNumberManual = (phone: string): boolean => {
    if (!phone) return false;
    const phoneLimpio = phone.replace(/\D/g, '');
    if (phoneLimpio.length < 10 || phoneLimpio.length > 11) return false;
    const ddd = parseInt(phoneLimpio.substring(0, 2));
    if (ddd < 11 || ddd > 99) return false; // DDD básico
    
    const numeroAposDDD = phoneLimpio.substring(2);
    if (numeroAposDDD.length === 9 && numeroAposDDD[0] !== '9') return false; 
    if (numeroAposDDD.length === 8 && !/^[2-5]/.test(numeroAposDDD[0])) return false; 

    return brazilianPhoneNumberRegex.test(phoneLimpio);
};

// Corrected: Use Zod's ErrorMapCtx for the context parameter
const customErrorMap: ZodErrorMap = (issue: ZodIssueOptionalMessage, ctx: ErrorMapCtx) => {
  if (issue.code === z.ZodIssueCode.invalid_string && issue.validation === 'email') {
    return { message: 'Email em formato inválido.' };
  }
  // Example: Accessing issue.path if needed for more specific messages
  // if (issue.code === z.ZodIssueCode.too_small && issue.path[0] === 'password') {
  //   return { message: `A senha no campo '${issue.path[0]}' precisa ter no mínimo ${issue.minimum} caracteres.`};
  // }
  return { message: ctx.defaultError }; // ctx.defaultError is the standard Zod message
};
z.setErrorMap(customErrorMap);


export const NonEmptyString = z.string({required_error: "Este campo é obrigatório."}).trim().min(1, { message: "O campo não pode estar vazio." });

export const EmailSchema = NonEmptyString.email({ message: "Formato de email inválido." }); // This message might be overridden by customErrorMap

export const PasswordSchema = NonEmptyString
  .min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
  .regex(/[A-Z]/, { message: "A senha deve conter pelo menos uma letra maiúscula." })
  .regex(/[a-z]/, { message: "A senha deve conter pelo menos uma letra minúscula." })
  .regex(/\d/, { message: "A senha deve conter pelo menos um número." });

export const CpfSchema = NonEmptyString
  .refine(isValidCPFManual, { message: "CPF inválido." });

export const PhoneNumberSchema = NonEmptyString
  .refine(isValidPhoneNumberManual, { message: "Número de telefone inválido." });

export const CepSchema = NonEmptyString
  .regex(/^\d{5}-?\d{3}$/, { message: "Formato de CEP inválido (Ex: 12345-678 ou 12345678)." })
  .transform((cep: string) => cep.replace(/\D/g, '')) 
  .refine((cep: string) => cep.length === 8 && !/^(\d)\1{7}$/.test(cep), { message: "CEP inválido."});


export const DateStringYYYYMMDDSchema = NonEmptyString
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato de data inválido. Use AAAA-MM-DD." })
  .refine((dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.getFullYear() === year && dateObj.getMonth() === month - 1 && dateObj.getDate() === day;
  }, { message: "Data inválida (ex: dia ou mês não existe)." });

export const FutureDateSchema = DateStringYYYYMMDDSchema.refine((dateString: string) => {
    const dateToCheck = new Date(dateString);
    const today = new Date();
    today.setHours(0,0,0,0); 
    dateToCheck.setHours(0,0,0,0);
    return dateToCheck > today;
}, { message: "A data deve ser no futuro."});

export const PastDateSchema = DateStringYYYYMMDDSchema.refine((dateString: string) => {
    const dateToCheck = new Date(dateString);
    const today = new Date();
    today.setHours(0,0,0,0);
    dateToCheck.setHours(0,0,0,0);
    return dateToCheck < today;
}, { message: "A data deve ser no passado."});


export const DateOfBirthSchema = (minAge = 18) => DateStringYYYYMMDDSchema.refine((dateString: string) => {
    const birthDate = new Date(dateString);
    if (isNaN(birthDate.getTime())) return false;
    
    const todayForFutureCheck = new Date();
    todayForFutureCheck.setHours(0,0,0,0);
    const birthDateForFutureCheck = new Date(birthDate);
    birthDateForFutureCheck.setHours(0,0,0,0);
    if (birthDateForFutureCheck > todayForFutureCheck) return false;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age >= minAge;
}, { message: `A idade mínima é de ${minAge} anos.` }); 


// --- Esquemas Específicos para LimpeJá (Exemplos) ---

export const UserRegistrationDataSchema = z.object({
  name: NonEmptyString.min(2, {message: "Nome deve ter pelo menos 2 caracteres."}).max(100, {message: "Nome muito longo (máx. 100 caracteres)."}),
  email: EmailSchema,
  password: PasswordSchema,
  cpf: CpfSchema.optional(),
  phone: PhoneNumberSchema.optional(),
  dateOfBirth: DateOfBirthSchema(18).optional(),
  role: z.enum(['client', 'provider'], { required_error: "Tipo de usuário é obrigatório.", invalid_type_error: "Tipo de usuário inválido."})
});
export type UserRegistrationData = z.infer<typeof UserRegistrationDataSchema>;


export const UserProfileUpdateDataSchema = z.object({
  name: NonEmptyString.min(2, {message: "Nome deve ter pelo menos 2 caracteres."}).max(100, {message: "Nome muito longo (máx. 100 caracteres)."}).optional(),
  phone: PhoneNumberSchema.optional().nullable(),
  dateOfBirth: DateOfBirthSchema(18).optional().nullable(),
  avatarUrl: z.string().url({message: "URL do avatar inválida."}).optional().nullable(),
}).partial();
export type UserProfileUpdateData = z.infer<typeof UserProfileUpdateDataSchema>;


export const AddressSchema = z.object({
    alias: z.string().trim().max(50, {message: "Apelido do endereço muito longo (máx. 50)."}).optional(),
    street: NonEmptyString.max(100, {message: "Rua muito longa (máx. 100)."}),
    number: NonEmptyString.max(20, {message: "Número muito longo (máx. 20)."}),
    complement: z.string().trim().max(50, {message: "Complemento muito longo (máx. 50)."}).optional().nullable(),
    neighborhood: NonEmptyString.max(50, {message: "Bairro muito longo (máx. 50)."}),
    city: NonEmptyString.max(50, {message: "Cidade muito longa (máx. 50)."}),
    state: NonEmptyString.length(2, {message: "Estado deve ter 2 caracteres (UF)."}).toUpperCase(),
    zipCode: CepSchema,
    isPrimary: z.boolean().optional()
});
export type AddressData = z.infer<typeof AddressSchema>;


export const OfferedServiceSchema = z.object({
    name: NonEmptyString.min(3, {message: "Nome do serviço muito curto (mín. 3)."}).max(100, {message: "Nome do serviço muito longo (máx. 100)."}),
    description: z.string().trim().max(1000, {message: "Descrição muito longa (máx. 1000)."}).optional().nullable(),
    priceType: z.enum(['hourly', 'fixed', 'quote'], { required_error: "Tipo de preço é obrigatório.", invalid_type_error: "Tipo de preço inválido."}),
    price: z.number({invalid_type_error: "Preço deve ser um número."}).positive({message: "Preço deve ser positivo."}).int({message: "Preço deve ser em centavos (inteiro)."}).optional().nullable(),
    currency: z.string().length(3, {message: "Moeda inválida (ex: BRL)."}).default("BRL"),
    estimatedDurationMinutes: z.number({invalid_type_error: "Duração estimada deve ser um número."}).int({message: "Duração deve ser em minutos (inteiro)."}).positive({message: "Duração deve ser positiva."}).optional().nullable(),
    isActive: z.boolean().optional().default(true)
}).refine((data: {priceType: string, price?: number | null}) => {
    if (data.priceType === 'hourly' || data.priceType === 'fixed') {
        return typeof data.price === 'number' && data.price > 0;
    }
    return true;
}, { message: "Preço (em centavos) é obrigatório e deve ser maior que zero para os tipos 'por hora' ou 'fixo'.", path: ['price'] });
export type OfferedServiceData = z.infer<typeof OfferedServiceSchema>;


export const ProviderProfileRegistrationDataSchema = UserRegistrationDataSchema.extend({
    bio: z.string().trim().min(10, {message: "Bio muito curta (mín. 10)."}).max(1000, {message: "Bio muito longa (máx. 1000)."}).optional().nullable(),
    yearsOfExperience: z.number({invalid_type_error: "Anos de experiência devem ser um número."}).int({message: "Anos de experiência devem ser um número inteiro."}).min(0, {message: "Anos de experiência não podem ser negativos."}).max(80, {message: "Anos de experiência inválidos (máx. 80)."}).optional().nullable(),
    servicesOffered: z.array(OfferedServiceSchema).min(1, {message: "Ofereça pelo menos um serviço."}),
    serviceAreas: z.array(NonEmptyString.max(100, {message: "Nome da área de atendimento muito longo (máx. 100)."})).min(1, {message: "Informe pelo menos uma área de atendimento."}),
    bankAccount: z.object({
        bankName: NonEmptyString.max(50, {message: "Nome do banco muito longo (máx. 50)."}).optional(),
        agency: NonEmptyString.regex(/^\d{1,5}$/, {message: "Agência inválida (apenas números, até 5 dígitos)."}).optional(),
        accountNumber: NonEmptyString.regex(/^\d{1,12}-?[\dX]$/, {message: "Número de conta inválido."}).optional(),
        accountType: z.enum(['checking', 'savings'], {invalid_type_error: "Tipo de conta inválido."}).optional(),
        holderName: NonEmptyString.max(100, {message: "Nome do titular muito longo (máx. 100)."}).optional(),
        holderDocument: CpfSchema.optional(),
        pixKey: NonEmptyString.max(100, {message: "Chave PIX muito longa (máx. 100)."}).optional(),
        pixKeyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random'], {invalid_type_error: "Tipo de chave PIX inválido."}).optional(),
    }).optional().nullable(),
    location: z.object({
        latitude: z.number({required_error: "Latitude é obrigatória.", invalid_type_error: "Latitude deve ser um número."}).min(-90, {message: "Latitude inválida."}).max(90, {message: "Latitude inválida."}),
        longitude: z.number({required_error: "Longitude é obrigatória.", invalid_type_error: "Longitude deve ser um número."}).min(-180, {message: "Longitude inválida."}).max(180, {message: "Longitude inválida."}),
    }).optional().nullable(),
});
export type ProviderProfileRegistrationData = z.infer<typeof ProviderProfileRegistrationDataSchema>;


export const BookingCreationDataSchema = z.object({
    providerId: NonEmptyString,
    offeredServiceId: NonEmptyString,
    scheduledDateTime: DateStringYYYYMMDDSchema
        .transform((str: string) => new Date(str))
        .refine((date: Date) => {
            const now = new Date();
            const thirtyMinutesFromNow = new Date(now.getTime() + 29 * 60 * 1000);
            return date > thirtyMinutesFromNow;
        } , {
            message: "O agendamento deve ser feito com pelo menos 30 minutos de antecedência."
        }),
    address: AddressSchema,
    clientNotes: z.string().trim().max(500, {message: "Observações muito longas (máx. 500)."}).optional().nullable(),
});
export type BookingCreationData = z.infer<typeof BookingCreationDataSchema>;

// --- Funções de Validação Usando Esquemas Zod ---

interface FormattedZodError {
    path: string;
    message: string;
}

export const validateDataWithSchema = <T extends z.ZodTypeAny>(data: unknown, schema: T): z.infer<T> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formattedErrors: FormattedZodError[] = result.error.errors.map((err: ZodIssue) => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    console.error("[Validation Error]", JSON.stringify(formattedErrors, null, 2));
    throw new ZodError(result.error.issues);
  }
  return result.data;
};

export const tryValidateDataWithSchema = <T extends z.ZodTypeAny>(
    data: unknown,
    schema: T
): { success: boolean; data?: z.infer<T>; errors?: FormattedZodError[] } => {
    const result = schema.safeParse(data);
    if (!result.success) {
        const formattedErrors: FormattedZodError[] = result.error.errors.map((err: ZodIssue) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        return { success: false, errors: formattedErrors };
    }
    return { success: true, data: result.data };
};

console.log("[Validators] Esquemas Zod e funções de validação carregados.");
