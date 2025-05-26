// Reutilizando e reexportando de provider.types.ts se for o mesmo,
// ou defina um tipo específico para um catálogo de serviços da plataforma aqui.
export { OfferedService as PlatformService } from "./provider.types";

// Exemplo se fosse um catálogo diferente:
// export interface PlatformServiceCategory {
//   id: string;
//   name: string;
//   description?: string;
//   iconUrl?: string;
// }