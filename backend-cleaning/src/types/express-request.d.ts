// backend-cleaning/express-request.d.ts (ou onde estiver)
import { User } from '@prisma/client'; // <-- ISSO É CRÍTICO!

declare global {
  namespace Express {
    interface Request {
      user?: User; // Ou User | undefined, dependendo da sua lógica de autenticação
    }
  }
}