import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchPricingRules,
    createPricingRule,
    updatePricingRule,
    deletePricingRule,
    fetchPricingHistory,
    PricingAuditEvent,
} from '../../lib/api';
import { PricingRule } from '../../lib/types'; // Ajuste o caminho conforme necessário

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

const PricingRulesPage = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Partial<PricingRule> | null>(null);
    const [formState, setFormState] = useState<Partial<PricingRule>>({});
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [history, setHistory] = useState<PricingAuditEvent[]>([]);
    const [cursor, setCursor] = useState<number | null>(0);
    const [period, setPeriod] = useState<'all' | '24h' | '7d' | '30d'>('all');

    // Fetching pricing rules
    const { data: rules, isLoading, error } = useQuery<PricingRule[], Error>({
        queryKey: ['pricingRules'],
        queryFn: fetchPricingRules,
    });

    const { data: historyPage } = useQuery<{ items: PricingAuditEvent[]; nextCursor: number | null}>({
        queryKey: ['pricingRulesHistory', cursor],
        queryFn: () => fetchPricingHistory(20, cursor ?? 0),
        enabled: isHistoryOpen && cursor !== null,
    });

    useEffect(() => {
        if (historyPage?.items) {
            setHistory(prev => [...prev, ...historyPage.items]);
            setCursor(historyPage.nextCursor);
        }
    }, [historyPage]);

    // Mutations for CRUD operations
    const createMutation = useMutation<PricingRule, Error, Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt'>>({
        mutationFn: createPricingRule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pricingRules'] });
            setIsModalOpen(false);
            setEditingRule(null);
            setFormState({});
        },
        onError: (err) => console.error("Erro ao criar regra:", err),
    });

    const updateMutation = useMutation<PricingRule, Error, { id: string; data: Partial<PricingRule> }>({
        mutationFn: ({ id, data }) => updatePricingRule(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pricingRules'] });
            setIsModalOpen(false);
            setEditingRule(null);
            setFormState({});
        },
        onError: (err) => console.error("Erro ao atualizar regra:", err),
    });

    const deleteMutation = useMutation<void, Error, string>({
        mutationFn: deletePricingRule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pricingRules'] });
        },
        onError: (err) => console.error("Erro ao deletar regra:", err),
    });

    useEffect(() => {
        if (editingRule) {
            setFormState(editingRule);
        } else {
            // Initialize formState for new rule creation with default values for required fields
            setFormState({
                scope: 'GLOBAL', // Default value
                kind: 'SURGE', // Default value
                valueType: 'MULTIPLIER', // Default value
                value: 1.0, // Default value
                isActive: true,
                // surgeFactor is part of PricingRule, not specific to kind. Ensure it's included if needed
                // If surgeFactor is always required, add it here:
                // surgeFactor: 1.0,
            });
        }
    }, [editingRule]);

    const handleAddRule = () => {
        setEditingRule(null);
        setIsModalOpen(true);
    };
    const openHistory = () => {
        setHistory([]);
        setCursor(0);
        setIsHistoryOpen(true);
    };

    const handleEditRule = (rule: PricingRule) => {
        setEditingRule(rule);
        setIsModalOpen(true);
    };

    const handleDeleteRule = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta regra?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormState(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (name === 'daysOfWeek') {
            // Handle array of numbers for daysOfWeek
            setFormState(prev => ({ ...prev, [name]: value.split(',').map(Number).filter(n => !isNaN(n)) }));
        } else if (name === 'surgeFactor' || name === 'value' || name === 'maxEffect' || name === 'priority') {
            // Handle number inputs
            setFormState(prev => ({ ...prev, [name]: parseFloat(value) }));
        } else if (name === 'activeFrom' || name === 'activeTo') {
            // Handle date inputs (store as ISO string)
            setFormState(prev => ({ ...prev, [name]: value ? new Date(value).toISOString() : null }));
        }
        else {
            setFormState(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRule?.id) { // Check for editingRule.id to confirm it's an existing rule
            updateMutation.mutate({ id: editingRule.id, data: formState });
        } else {
            // For creation, ensure all required fields are present and correctly typed
            const newRule: Omit<PricingRule, 'id' | 'createdAt' | 'updatedAt'> = {
                scope: formState.scope!, // Assert non-null as it's required in form
                kind: formState.kind!, // Assert non-null
                valueType: formState.valueType!, // Assert non-null
                value: formState.value!, // Assert non-null
                isActive: formState.isActive ?? true, // Provide default if undefined
                // Optional fields
                refId: formState.refId,
                maxEffect: formState.maxEffect,
                daysOfWeek: formState.daysOfWeek,
                timeStart: formState.timeStart,
                timeEnd: formState.timeEnd,
                activeFrom: formState.activeFrom,
                activeTo: formState.activeTo,
                priority: formState.priority,
                description: formState.description,
            };
            createMutation.mutate(newRule);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold text-gray-800">Regras de Precificação</h1>
                <div className="flex gap-3">
                    <button
                        onClick={openHistory}
                        className="bg-white border border-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Histórico
                    </button>
                    <button
                        onClick={handleAddRule}
                        className="bg-medium-blue text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Adicionar Regra
                    </button>
                </div>
            </div>

            {isLoading && <LoadingSpinner />}
            {error && <ErrorMessage message={error.message} />}

            {rules && rules.length > 0 ? (
                <div className="bg-white shadow rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escopo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ativo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rules.map((rule) => (
                                <tr key={rule.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.id.substring(0, 8)}...</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.scope}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.kind}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.valueType}: {rule.value}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {rule.isActive ? <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Sim</span> : <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Não</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEditRule(rule)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRule(rule.id)}
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
                !isLoading && !error && <p className="text-gray-500 mt-4">Nenhuma regra de precificação encontrada.</p>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingRule ? "Editar Regra de Precificação" : "Adicionar Nova Regra de Precificação"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="scope" className="block text-sm font-medium text-gray-700">Escopo</label>
                        <select
                            id="scope"
                            name="scope"
                            value={formState.scope || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            required
                        >
                            <option value="">Selecione o Escopo</option>
                            <option value="GLOBAL">Global</option>
                            <option value="CITY">Cidade</option>
                            <option value="CATEGORY">Categoria</option>
                            <option value="SERVICE">Serviço</option>
                            <option value="PROVIDER">Provedor</option>
                        </select>
                    </div>
                    {formState.scope && formState.scope !== 'GLOBAL' && (
                        <div>
                            <label htmlFor="refId" className="block text-sm font-medium text-gray-700">ID de Referência (Cidade/Categoria/Serviço/Provedor)</label>
                            <input
                                type="text"
                                id="refId"
                                name="refId"
                                value={formState.refId || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="kind" className="block text-sm font-medium text-gray-700">Tipo de Regra</label>
                        <select
                            id="kind"
                            name="kind"
                            value={formState.kind || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            required
                        >
                            <option value="">Selecione o Tipo</option>
                            <option value="SURGE">Surge</option>
                            <option value="DISTANCE_FEE">Taxa de Distância</option>
                            <option value="FLOOR">Piso (Valor Mínimo)</option>
                            <option value="CAP">Teto (Valor Máximo)</option>
                            <option value="PACKAGE_DISCOUNT">Desconto de Pacote</option>
                            <option value="ABSOLUTE_ADJUST">Ajuste Absoluto</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="valueType" className="block text-sm font-medium text-gray-700">Tipo de Valor</label>
                        <select
                            id="valueType"
                            name="valueType"
                            value={formState.valueType || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            required
                        >
                            <option value="">Selecione o Tipo de Valor</option>
                            <option value="MULTIPLIER">Multiplicador</option>
                            <option value="FIXED">Fixo</option>
                            <option value="PERCENT">Porcentagem</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="value" className="block text-sm font-medium text-gray-700">Valor</label>
                        <input
                            type="number"
                            step="0.01"
                            id="value"
                            name="value"
                            value={formState.value ?? ''} // Use nullish coalescing for numbers
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="maxEffect" className="block text-sm font-medium text-gray-700">Efeito Máximo (Opcional)</label>
                        <input
                            type="number"
                            step="0.01"
                            id="maxEffect"
                            name="maxEffect"
                            value={formState.maxEffect ?? ''} // Use nullish coalescing for numbers
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="daysOfWeek" className="block text-sm font-medium text-gray-700">Dias da Semana (0-6, separados por vírgula)</label>
                        <input
                            type="text"
                            id="daysOfWeek"
                            name="daysOfWeek"
                            value={formState.daysOfWeek?.join(',') || ''}
                            onChange={handleChange}
                            placeholder="Ex: 0,1,2 (Dom, Seg, Ter)"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="timeStart" className="block text-sm font-medium text-gray-700">Hora Início (HH:MM)</label>
                            <input
                                type="time"
                                id="timeStart"
                                name="timeStart"
                                value={formState.timeStart || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="timeEnd" className="block text-sm font-medium text-gray-700">Hora Fim (HH:MM)</label>
                            <input
                                type="time"
                                id="timeEnd"
                                name="timeEnd"
                                value={formState.timeEnd || ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="activeFrom" className="block text-sm font-medium text-gray-700">Ativo De</label>
                            <input
                                type="date"
                                id="activeFrom"
                                name="activeFrom"
                                // Convert ISO string to YYYY-MM-DD for date input value
                                value={formState.activeFrom ? new Date(formState.activeFrom).toISOString().split('T')[0] : ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="activeTo" className="block text-sm font-medium text-gray-700">Ativo Até</label>
                            <input
                                type="date"
                                id="activeTo"
                                name="activeTo"
                                // Convert ISO string to YYYY-MM-DD for date input value
                                value={formState.activeTo ? new Date(formState.activeTo).toISOString().split('T')[0] : ''}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Prioridade</label>
                        <input
                            type="number"
                            id="priority"
                            name="priority"
                            value={formState.priority ?? ''} // Use nullish coalescing for numbers
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
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
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição (para admins)</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formState.description || ''}
                            onChange={handleChange}
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medium-blue focus:border-medium-blue sm:text-sm"
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-medium-blue text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                        disabled={createMutation.isPending || updateMutation.isPending}
                    >
                        {createMutation.isPending || updateMutation.isPending ? <LoadingSpinner /> : (editingRule ? "Salvar Alterações" : "Adicionar Regra")}
                    </button>
                </form>
            </Modal>

            {/* Modal de Histórico */}
            <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="Histórico de alterações de regras">
                <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-700">Filtrar período:</div>
                    <select value={period} onChange={(e)=>setPeriod(e.target.value as any)} className="border border-gray-200 rounded-md text-sm px-2 py-1">
                        <option value="all">Todo período</option>
                        <option value="24h">Últimas 24h</option>
                        <option value="7d">Últimos 7 dias</option>
                        <option value="30d">Últimos 30 dias</option>
                    </select>
                </div>
                <div className="max-h-[60vh] overflow-y-auto space-y-3">
                    {history.filter(ev => { const now = Date.now(); if (period==='all') return true; const t = new Date(ev.at).getTime(); const win = period==='24h'?24*3600*1000:period==='7d'?7*24*3600*1000:30*24*3600*1000; return Number.isFinite(t) && (now - t) <= win; }).map((ev) => (
                        <div key={ev.id} className="border rounded-md p-3">
                            <div className="text-xs text-gray-500 mb-1">{new Date(ev.at).toLocaleString()} — por {ev.actorUserId}</div>
                            <div className="text-sm font-medium">Ação: {ev.action}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                <div>
                                    <div className="text-xs text-gray-600">Antes</div>
                                    <pre className="text-[11px] bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(ev.ruleBefore ?? null, null, 2)}</pre>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-600">Depois</div>
                                    <pre className="text-[11px] bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(ev.ruleAfter ?? null, null, 2)}</pre>
                                </div>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <div className="text-sm text-gray-500">Nenhum evento ainda.</div>
                    )}
                </div>
                {cursor !== null && (
                    <div className="mt-4 text-right">
                        <button onClick={() => setCursor(cursor ?? 0)} className="text-medium-blue hover:underline">Carregar mais</button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PricingRulesPage;
