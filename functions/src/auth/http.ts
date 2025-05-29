// LimpeJaApp/functions/src/auth/http.ts
import * as functions from "firebase-functions";
import { region } from "firebase-functions/v1";
import express from "express";
import cors from "cors";
// Corrigido: Importar DecodedIdToken diretamente de 'firebase-admin/auth'
import { DecodedIdToken } from "firebase-admin/auth";
import { auth as adminAuth, db } from "../config/firebaseAdmin"; // Import db if needed for fetching more profile data
import { UserProfile } from "../types"; // Assuming UserProfile might be useful

const REGION = "southamerica-east1";

const app = express();

// Middleware para habilitar CORS. Para produção, considere restringir as origens.
app.use(cors({ origin: true }));
// Middleware para parsear JSON no corpo da requisição
app.use(express.json());

// Interface para estender o objeto Request do Express e adicionar a propriedade 'user'
export interface AuthenticatedRequest extends express.Request {
  user?: DecodedIdToken; // Corrigido: Usa o tipo DecodedIdToken importado
}

/**
 * Middleware para verificar se o usuário está autenticado via Firebase ID Token.
 * O token deve ser passado no header Authorization como 'Bearer <ID_TOKEN>'.
 */
const checkIfAuthenticated = async (
  req: AuthenticatedRequest, // Usa a interface customizada
  res: express.Response,
  next: express.NextFunction
) => {
  functions.logger.log("Verificando token de autenticação HTTP...", {
    headers: req.headers.authorization ? true : false,
  });

  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ")
  ) {
    functions.logger.warn(
      "Token não fornecido ou mal formatado na requisição HTTP."
    );
    res.status(403).json({ error: "Unauthorized", message: "Nenhum token de autenticação fornecido." });
    return;
  }

  const idToken = req.headers.authorization.split("Bearer ")[1];

  try {
    const decodedIdToken = await adminAuth.verifyIdToken(idToken);
    functions.logger.log("ID Token é válido. UID:", decodedIdToken.uid);
    req.user = decodedIdToken; // Adiciona o usuário decodificado ao objeto req
    return next();
  } catch (error: any) {
    functions.logger.error("Erro ao verificar ID token:", {
      errorMessage: error.message,
      errorCode: error.code,
    });
    // Detalha o erro com base no código de erro do Firebase Auth
    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({ error: "Unauthorized", message: "Token de autenticação expirado." });
    } else {
      res.status(403).json({ error: "Unauthorized", message: "Token de autenticação inválido." });
    }
    return;
  }
};

/**
 * Endpoint GET para verificar o status da autenticação do usuário.
 * Retorna informações básicas do usuário se autenticado, incluindo custom claims.
 */
app.get("/checkAuthStatus", checkIfAuthenticated, async (
    req: AuthenticatedRequest, // Usa a interface customizada
    res: express.Response
  ) => {
  // O middleware checkIfAuthenticated já validou o token e adicionou 'req.user'
  const decodedToken = req.user!; // O '!' é seguro aqui devido ao middleware

  functions.logger.info(
    `Usuário autenticado ${decodedToken.uid} acessou /checkAuthStatus`
  );

  try {
    // Opcional: Buscar dados adicionais do UserProfile no Firestore
    // Isso pode ser útil se nem todas as informações necessárias estiverem nos custom claims.
    const userProfileDoc = await db.collection("users").doc(decodedToken.uid).get();
    let userProfileData: Partial<UserProfile> = {};

    if (userProfileDoc.exists) {
        userProfileData = userProfileDoc.data() as UserProfile;
    } else {
        functions.logger.warn(`Perfil de usuário não encontrado no Firestore para UID: ${decodedToken.uid} durante /checkAuthStatus. Usando apenas dados do token.`);
    }

    // Monta a resposta com dados do token decodificado e, opcionalmente, do perfil do Firestore
    const responsePayload = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: userProfileData.name || decodedToken.name, // Prioriza Firestore, fallback para token
      avatarUrl: userProfileData.avatarUrl || decodedToken.picture, // Prioriza Firestore, fallback para token
      // Custom claims (ajuste os nomes dos claims conforme definido no seu backend, ex: em auth/triggers.ts)
      role: decodedToken.role || userProfileData.role || "client", // 'role' é um custom claim comum
      isProvider: decodedToken.isProvider || userProfileData.isProvider || (decodedToken.role === 'provider'),
      isProviderVerified: decodedToken.isProviderVerified || userProfileData.isProviderVerified || false,
      // Adicione outros claims ou dados do perfil que o frontend precise
    };

    return res.status(200).json({
      message: "Usuário autenticado.",
      user: responsePayload,
    });

  } catch (error) {
    functions.logger.error("Erro ao buscar perfil do usuário em /checkAuthStatus para UID:", decodedToken.uid, error);
    return res.status(500).json({ error: "InternalServerError", message: "Erro ao processar informações do usuário." });
  }
});

// TODO: Adicionar outros endpoints HTTP relacionados à autenticação se necessário.
// Por exemplo, se você precisar de uma rota para admins forçarem o refresh de tokens de um usuário
// ou para lidar com webhooks de provedores de autenticação de terceiros (embora Firebase geralmente lide com isso).

// Exporta a API do Express como uma Cloud Function HTTPS
export const authApi = region(REGION).https.onRequest(app);