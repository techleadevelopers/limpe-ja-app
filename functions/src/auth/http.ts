// LimpeJaApp/functions/src/auth/http.ts
import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";

// --- CORREÇÃO DAS IMPORTAÇÕES ---
import express from "express"; // Importa o default export como 'express'
import cors from "cors";       // Importa o default export como 'cors'
// --- FIM DA CORREÇÃO ---

import { auth as adminAuth } from "../config/firebaseAdmin";

const REGION = "southamerica-east1";

const app = express(); // Agora 'express' é a função construtora correta

// Habilita CORS para todas as origens (ajuste para produção!)
// Agora 'cors' é a função middleware correta
app.use(cors({ origin: true }));

/**
 * Middleware de exemplo para verificar autenticação.
 */
const checkIfAuthenticated = async (
  // Tipagem explícita para req e res
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  functions.logger.log("Verificando token de autenticação HTTP...");
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ")
  ) {
    functions.logger.warn("Token não fornecido ou mal formatado na requisição HTTP.");
    res.status(403).send("Unauthorized - No token provided.");
    return;
  }
  const idToken = req.headers.authorization.split("Bearer ")[1];
  try {
    const decodedIdToken = await adminAuth.verifyIdToken(idToken);
    functions.logger.log("ID Token é válido:", decodedIdToken.uid);
    (req as any).user = decodedIdToken; // Adiciona o usuário decodificado ao objeto req
                                        // Para tipagem melhor, defina uma interface que estenda express.Request
    return next();
  } catch (error) {
    functions.logger.error("Erro ao verificar ID token:", error);
    res.status(403).send("Unauthorized - Invalid token.");
    return;
  }
};

app.get("/checkAuthStatus", checkIfAuthenticated, (
  // Tipagem explícita para req e res
  req: express.Request,
  res: express.Response
) => {
  const user = (req as any).user; // Acesso ao usuário injetado pelo middleware
  functions.logger.info(`Usuário autenticado ${user.uid} acessou /checkAuthStatus`);
  return res.status(200).json({
    message: `Usuário ${user.uid} está autenticado.`,
    email: user.email,
    role: user.token.role || "Não definido",
  });
});

export const authApi = region(REGION).https.onRequest(app);