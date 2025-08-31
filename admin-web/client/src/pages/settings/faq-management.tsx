import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchFAQs,
    createFAQ,
    updateFAQ,
    deleteFAQ,
} from '../../lib/api'; // Ajuste o caminho conforme necessário
import { FAQItem } from '../../lib/types'; // Ajuste o caminho conforme necessário

// Type definitions for reusable components
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
}

interface ErrorMessageProps {
    message: string;
}

// Componente Modal
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
                <h2 className="text-xl font-semibold mb-4">{title}</h2>
                {children}
                <button onClick={onClose} className="mt-4 bg-gray-300 text-gray-800 py-2 px-4 rounded-md">
                    Fechar
                </button>
            </div>
        </div>
    );
};

// Componente LoadingSpinner
const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medium-blue"></div>
    </div>
);

// Componente ErrorMessage
const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Erro:</strong>
        <span className="block sm:inline"> {message}</span>
    </div>
);

const FaqManagementPage = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<Partial<FAQItem> | null>(null);
    const [formState, setFormState] = useState<Partial<FAQItem>>({});

    // Fetching FAQs
    const { data: faqs, isLoading, error } = useQuery<FAQItem[], Error>({
        queryKey: ['faqs'],
        queryFn: fetchFAQs,
    });

    // Mutations for CRUD operations
    const createMutation = useMutation<FAQItem, Error, Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt'>>({
        mutationFn: createFAQ,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            setIsModalOpen(false);
            setEditingFaq(null);
            setFormState({});
        },
        onError: (err) => console.error("Erro ao criar FAQ:", err),
    });

    const updateMutation = useMutation<FAQItem, Error, { id: string; data: Partial<FAQItem> }>({
        mutationFn: ({ id, data }) => updateFAQ(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            setIsModalOpen(false);
            setEditingFaq(null);
            setFormState({});
        },
        onError: (err) => console.error("Erro ao atualizar FAQ:", err),
    });

    const deleteMutation = useMutation<void, Error, string>({
        mutationFn: deleteFAQ,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
        },
        onError: (err) => console.error("Erro ao deletar FAQ:", err),
    });

    useEffect(() => {
        if (editingFaq) {
            setFormState(editingFaq);
        } else {
            setFormState({
                isActive: true, // Default for new FAQs
                language: 'pt-BR', // Default language
                order: 0, // Default order
                audience: 'CLIENT' // Default audience
            });
        }
    }, [editingFaq]);

    const handleAddFaq = () => {
        setEditingFaq(null);
        setIsModalOpen(true);
    };

    const handleEditFaq = (faq: FAQItem) => {
        setEditingFaq(faq);
        setIsModalOpen(true);
    };

    const handleDeleteFaq = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta FAQ?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormState(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (name === 'order') {
            setFormState(prev => ({ ...prev, [name]: parseInt(value, 10) }));
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingFaq?.id) { // Check for editingFaq.id to confirm it's an existing rule
            updateMutation.mutate({ id: editingFaq.id, data: formState });
        } else {
            // For creation, ensure all required fields are present and correctly typed
            const newFaq: Omit<FAQItem, 'id' | 'createdAt' | 'updatedAt'> = {
                question: formState.question || '', // Ensure non-nullable
                answer: formState.answer || '', // Ensure non-nullable
                category: formState.category, // Can be string | null | undefined
                order: formState.order ?? 0, // Default if undefined
                audience: formState.audience ?? 'CLIENT', // Default if undefined
                tags: formState.tags,
                language: formState.language,
                isActive: formState.isActive ?? true, // Default if undefined
            };
            createMutation.mutate(newFaq);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold text-gray-800">Gerenciamento de FAQ</h1>
                <button
                    onClick={handleAddFaq}
                    className="bg-medium-blue text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Adicionar Pergunta
                </button>
            </div>

            {isLoading && <LoadingSpinner />}
            {error && <ErrorMessage message={error.message} />}

            {faqs && faqs.length > 0 ? (
                <div className="bg-white shadow rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pergunta</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordem</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ativo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {faqs.map((faq) => (
                                <tr key={faq.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{faq.question}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{faq.category || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{faq.order}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {faq.isActive ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Sim</span> : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Não</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEditFaq(faq)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteFaq(faq.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                !isLoading && !error && <p className="text-gray-500 mt-4">Nenhum item de FAQ encontrado.</p>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingFaq ? "Editar Item de FAQ" : "Adicionar Novo Item de FAQ"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="question" className="block text-sm font-medium text-gray-700">Pergunta</label>
                        <input
                            type="text"
                            id="question"
                            name="question"
                            value={formState.question || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="answer" className="block text-sm font-medium text-gray-700">Resposta</label>
                        <textarea
                            id="answer"
                            name="answer"
                            value={formState.answer || ''}
                            onChange={handleChange}
                            rows={4}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            required
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
                        <input
                            type="text"
                            id="category"
                            name="category"
                            value={formState.category || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="order" className="block text-sm font-medium text-gray-700">Ordem</label>
                        <input
                            type="number"
                            id="order"
                            name="order"
                            value={formState.order ?? 0} // Use nullish coalescing for numbers
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="audience" className="block text-sm font-medium text-gray-700">Público</label>
                        <select
                            id="audience"
                            name="audience"
                            value={formState.audience || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                        >
                            <option value="">Selecione o Público</option>
                            <option value="CLIENT">Cliente</option>
                            <option value="PROVIDER">Provedor</option>
                            <option value="ALL">Todos</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="language" className="block text-sm font-medium text-gray-700">Idioma</label>
                        <input
                            type="text"
                            id="language"
                            name="language"
                            value={formState.language || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            placeholder="Ex: pt-BR"
                        />
                    </div>
                    <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (separadas por vírgula)</label>
                        <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={formState.tags?.join(',') || ''}
                            onChange={(e) => setFormState(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) }))}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            placeholder="Ex: pagamentos, pix, agendamento"
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={formState.isActive ?? false} // Use nullish coalescing for boolean
                            onChange={handleChange}
                            className="h-4 w-4 text-medium-blue border-gray-300 rounded focus:ring-medium-blue"
                        />
                        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Ativo</label>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-medium-blue text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                        disabled={createMutation.isPending || updateMutation.isPending}
                    >
                        {createMutation.isPending || updateMutation.isPending ? <LoadingSpinner /> : (editingFaq ? "Salvar Alterações" : "Adicionar FAQ")}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default FaqManagementPage;