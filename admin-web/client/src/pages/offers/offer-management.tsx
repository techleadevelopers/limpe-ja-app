import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchOffers,
    createOffer,
    updateOffer,
    deleteOffer,
} from '../../lib/api'; // Ajuste o caminho conforme necessário
import { Offer, OfferTarget, OfferStatus } from '../../lib/types'; // Ajuste o caminho conforme necessário

// Type definitions for reusable components (reutilizando do exemplo anterior)
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

const OfferManagementPage = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Partial<Offer> | null>(null);
    const [formState, setFormState] = useState<Partial<Offer>>({});

    // Fetching offers
    const { data: offers, isLoading, error } = useQuery<Offer[], Error>({
        queryKey: ['offers'],
        queryFn: fetchOffers,
    });

    // Mutations for CRUD operations
    const createMutation = useMutation<Offer, Error, Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>>({
        mutationFn: createOffer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['offers'] });
            setIsModalOpen(false);
            setEditingOffer(null);
            setFormState({});
        },
        onError: (err) => console.error("Erro ao criar oferta:", err),
    });

    const updateMutation = useMutation<Offer, Error, { id: string; data: Partial<Offer> }>({
        mutationFn: ({ id, data }) => updateOffer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['offers'] });
            setIsModalOpen(false);
            setEditingOffer(null);
            setFormState({});
        },
        onError: (err) => console.error("Erro ao atualizar oferta:", err),
    });

    const deleteMutation = useMutation<void, Error, string>({
        mutationFn: deleteOffer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['offers'] });
        },
        onError: (err) => console.error("Erro ao deletar oferta:", err),
    });

    useEffect(() => {
        if (editingOffer) {
            setFormState({
                ...editingOffer,
                // Format dates for input type="date"
                validUntil: editingOffer.validUntil ? new Date(editingOffer.validUntil).toISOString().split('T')[0] : '',
            });
        } else {
            // Default values for new offer
            setFormState({
                status: OfferStatus.ACTIVE,
                target: OfferTarget.GENERAL,
                validUntil: new Date().toISOString().split('T')[0], // Default to today
            });
        }
    }, [editingOffer]);

    const handleAddOffer = () => {
        setEditingOffer(null);
        setIsModalOpen(true);
    };

    const handleEditOffer = (offer: Offer) => {
        setEditingOffer(offer);
        setIsModalOpen(true);
    };

    const handleDeleteOffer = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta oferta?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            setFormState(prev => ({ ...prev, [name]: parseFloat(value) || null }));
        } else if (name === 'validUntil') {
            setFormState(prev => ({ ...prev, [name]: value ? new Date(value).toISOString() : '' }));
        } else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Ensure discount fields are numbers or null
        const payload = {
            ...formState,
            discountPercentage: formState.discountPercentage === null ? undefined : formState.discountPercentage,
            fixedDiscountAmount: formState.fixedDiscountAmount === null ? undefined : formState.fixedDiscountAmount,
        };

        if (editingOffer?.id) {
            updateMutation.mutate({ id: editingOffer.id, data: payload });
        } else {
            const newOffer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'> = {
                title: payload.title || '',
                validUntil: payload.validUntil || new Date().toISOString(),
                target: payload.target || OfferTarget.GENERAL,
                status: payload.status || OfferStatus.ACTIVE,
                description: payload.description,
                discountPercentage: payload.discountPercentage,
                fixedDiscountAmount: payload.fixedDiscountAmount,
                imageUrl: payload.imageUrl,
                targetId: payload.targetId,
            };
            createMutation.mutate(newOffer);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold text-gray-800">Gerenciamento de Ofertas</h1>
                <button
                    onClick={handleAddOffer}
                    className="bg-medium-blue text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Adicionar Oferta
                </button>
            </div>

            {isLoading && <LoadingSpinner />}
            {error && <ErrorMessage message={error.message} />}

            {offers && offers.length > 0 ? (
                <div className="bg-white shadow rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desconto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Válido Até</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Público</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {offers.map((offer) => (
                                <tr key={offer.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{offer.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {offer.discountPercentage ? `${offer.discountPercentage}%` : ''}
                                        {offer.fixedDiscountAmount ? `R$ ${offer.fixedDiscountAmount.toFixed(2)}` : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(offer.validUntil).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{offer.target}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            offer.status === OfferStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                                            offer.status === OfferStatus.INACTIVE ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {offer.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEditOffer(offer)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteOffer(offer.id)}
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
                !isLoading && !error && <p className="text-gray-500 mt-4">Nenhuma oferta encontrada.</p>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingOffer ? "Editar Oferta" : "Adicionar Nova Oferta"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formState.title || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formState.description || ''}
                            onChange={handleChange}
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-700">Desconto Percentual (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            id="discountPercentage"
                            name="discountPercentage"
                            value={formState.discountPercentage ?? ''}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="fixedDiscountAmount" className="block text-sm font-medium text-gray-700">Desconto Fixo (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            id="fixedDiscountAmount"
                            name="fixedDiscountAmount"
                            value={formState.fixedDiscountAmount ?? ''}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">Válido Até</label>
                        <input
                            type="date"
                            id="validUntil"
                            name="validUntil"
                            value={formState.validUntil ? new Date(formState.validUntil).toISOString().split('T')[0] : ''}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">URL da Imagem</label>
                        <input
                            type="text"
                            id="imageUrl"
                            name="imageUrl"
                            value={formState.imageUrl || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="target" className="block text-sm font-medium text-gray-700">Público-Alvo</label>
                        <select
                            id="target"
                            name="target"
                            value={formState.target || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            required
                        >
                            {Object.values(OfferTarget).map(target => (
                                <option key={target} value={target}>{target.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                    {formState.target && (formState.target === OfferTarget.SPECIFIC_SERVICE || formState.target === OfferTarget.SPECIFIC_PROVIDER) && (
                        <div>
                            <label htmlFor="targetId" className="block text-sm font-medium text-gray-700">ID do Alvo Específico</label>
                            <input
                                type="text"
                                id="targetId"
                                name="targetId"
                                value={formState.targetId || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={formState.status || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            required
                        >
                            {Object.values(OfferStatus).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-medium-blue text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                        disabled={createMutation.isPending || updateMutation.isPending}
                    >
                        {createMutation.isPending || updateMutation.isPending ? <LoadingSpinner /> : (editingOffer ? "Salvar Alterações" : "Adicionar Oferta")}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default OfferManagementPage;