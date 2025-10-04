// LimpeJaApp/services/categoryService.ts
import { api } from '../services/api'; // use o mesmo axios/api centralizado do projeto

// Tipo básico para Category (ajuste se já tiver em types/backend)
export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

// Buscar todas as categorias (catálogo base)
export async function getCategories(): Promise<Category[]> {
  const response = await api.get('/services'); // GET /services lista os serviços base
  return response.data;
}

// Buscar serviços por categoria (se backend suportar filtro)
export async function getServicesByCategoryId(categoryId: string) {
  // Aqui assumimos que cada service tem um categoryId.
  // Se o backend não expuser diretamente, pode ser necessário ajustar para usar /search.
  const response = await api.get(`/services?categoryId=${categoryId}`);
  return response.data;
}
