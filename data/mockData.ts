// data/mockData.ts
import { Review, ProviderDetails } from '../../../../types/types'; // Vamos criar um types/types.ts

export const TODOS_OS_PRESTADORES_DETALHES: ProviderDetails[] = [
  {
    id: 'provider1',
    nome: 'Ana Oliveira',
    especialidade: 'Limpeza Residencial Detalhada',
    avaliacao: 5.0,
    precoHora: 'R$ 60-80',
    imagemUrl: 'https://randomuser.me/api/portraits/women/43.jpg',
    numeroAvaliacoes: 240,
    isVerificado: true,
    descricaoCompleta: 'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letter',
    servicosOferecidos: [{ nome: 'Limpeza Padrão Completa' }, { nome: 'Limpeza Pesada Detalhada' }, { nome: 'Organização de Armários' }],
    cidade: 'Campinas, SP',
    anosExperiencia: 5,
    reviews: [
      { id: 'rev1_1', reviewerName: 'Juliana M.', reviewerImageUrl: 'https://picsum.photos/seed/juliana_m/100/100', rating: 5, comment: 'A Ana é fantástica! Minha casa nunca esteve tão limpa. Super recomendo!', date: '20/05/2025' },
      { id: 'rev1_2', reviewerName: 'Ricardo F.',reviewerImageUrl: 'https://picsum.photos/seed/ricardo_f/100/100', rating: 4.5, comment: 'Ótimo serviço, muito profissional e atenciosa aos detalhes. Contratarei novamente.', date: '15/05/2025' },
    ],
    servicoPrincipal: 'Limpeza de Sala de Estar',
    precoOriginal: '$230',
    precoComDesconto: '$200',
  },
  {
    id: 'provider2',
    nome: 'Carlos Silva',
    especialidade: 'Higienização Comercial',
    avaliacao: 4.9,
    precoHora: 'R$ 75',
    imagemUrl: 'https://picsum.photos/seed/carlos_silva_higieniza/700/500',
    numeroAvaliacoes: 88,
    isVerificado: false,
    descricaoCompleta: 'Serviços de limpeza e higienização para ambientes comerciais, escritórios e lojas. Equipe treinada, discrição e eficiência para manter seu local de trabalho sempre apresentável e saudável. Horários flexíveis.',
    cidade: 'Valinhos, SP',
    anosExperiencia: 8,
    reviews: [
      { id: 'rev2_1', reviewerName: 'Empresa X', rating: 5, comment: 'Carlos e sua equipe são excelentes. Nosso escritório está sempre impecável.', date: '10/05/2025' },
    ],
    servicoPrincipal: 'Limpeza de Escritório',
    precoOriginal: '$150',
    precoComDesconto: '$120',
  },
  {
    id: 'provider3',
    nome: 'Mariana Costa',
    especialidade: 'Expert em Pós-Obra',
    avaliacao: 4.7,
    precoHora: 'R$ 90+',
    imagemUrl: 'https://picsum.photos/seed/mariana_costa_posobra/700/500',
    numeroAvaliacoes: 55,
    isVerificado: true,
    descricaoCompleta: 'Especializada na remoção de sujeira pesada, respingos de tinta e resíduos de construção. Deixo seu imóvel novo ou recém-reformado impecável e pronto para uso, com equipamento e produtos específicos.',
    cidade: 'Vinhedo, SP',
    anosExperiencia: 3,
    servicoPrincipal: 'Limpeza Pós-Construção',
    precoOriginal: '$300',
    precoComDesconto: '$250',
  },
];

export const fetchProviderDetailsFromAPI = async (id: string): Promise<ProviderDetails | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return TODOS_OS_PRESTADORES_DETALHES.find(p => p.id === id);
};