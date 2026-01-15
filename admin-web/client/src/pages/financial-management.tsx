import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Calendar, DollarSign, ClipboardList, CheckCircle2 } from "lucide-react";

type PayoutRecord = {
  id: string;
  providerName: string;
  pixKey: string;
  amount: number;
  completedAt: string;
  reference: string;
};

const summaryCards = [
  {
    title: "Total Recebido (PIX)",
    value: "R$ 184.450,00",
    icon: <DollarSign size={22} className="text-emerald-600" />,
    description: "Entradas confirmadas este mês",
  },
  {
    title: "Total a Repassar (Prestadores)",
    value: "R$ 157.320,00",
    icon: <ClipboardList size={22} className="text-blue-600" />,
    description: "Pagamentos pendentes",
  },
  {
    title: "Lucro Líquido Limpejá",
    value: "R$ 27.130,00",
    icon: <CheckCircle2 size={22} className="text-violet-600" />,
    description: "Entradas - Repasses",
  },
];

const payoutSeed: PayoutRecord[] = [
  {
    id: "p-001",
    providerName: "Clara Souza",
    pixKey: "cpf@limpeja",
    amount: 980.5,
    completedAt: "2026-01-12",
    reference: "Agendamento #441",
  },
  {
    id: "p-002",
    providerName: "Miguel Lima",
    pixKey: "celular:+5511995001212",
    amount: 1260.0,
    completedAt: "2026-01-11",
    reference: "Agendamento #398",
  },
  {
    id: "p-003",
    providerName: "Larissa Nogueira",
    pixKey: "email@limpeja",
    amount: 742.15,
    completedAt: "2026-01-10",
    reference: "Agendamento #373",
  },
];

export default function FinancialManagement() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paidIds, setPaidIds] = useState<string[]>([]);

  const filteredRecords = useMemo(() => {
    return payoutSeed.filter((record) => {
      if (!startDate && !endDate) return true;
      const completed = new Date(record.completedAt);
      const from = startDate ? new Date(startDate) : null;
      const to = endDate ? new Date(endDate) : null;
      if (from && completed < from) return false;
      if (to && completed > to) return false;
      return true;
    });
  }, [startDate, endDate]);

  const handleMarkPaid = (id: string) => {
    setPaidIds((prev) => [...prev, id]);
  };

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      <div className="flex-1 ml-72 overflow-hidden">
        <Header title="Gestão Financeira" subtitle="Controle de repasses e lucros" />
        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            {summaryCards.map((card) => (
              <Card key={card.title} className="border-0 shadow-floating">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">{card.title}</p>
                      <p className="text-2xl font-semibold text-gray-900 mt-1">{card.value}</p>
                    </div>
                    <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center">
                      {card.icon}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          <Card className="border-0 shadow-floating">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg">Tabela de Repasses</CardTitle>
                <p className="text-sm text-gray-500">Verifique os prestadores que ainda aguardam pagamento.</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="text-gray-400" size={16} />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="border-gray-300"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="text-gray-400" size={16} />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="border-gray-300"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <Table className="w-full">
                  <TableHead>
                    <TableRow>
                      <TableCell>Prestador</TableCell>
                      <TableCell>Chave PIX</TableCell>
                      <TableCell>Valor (R$)</TableCell>
                      <TableCell>Concluído em</TableCell>
                      <TableCell>Referência</TableCell>
                      <TableCell>Ação</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-800">{record.providerName}</TableCell>
                        <TableCell>{record.pixKey}</TableCell>
                        <TableCell className="font-semibold text-emerald-600">
                          {record.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>{record.completedAt}</TableCell>
                        <TableCell>{record.reference}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={paidIds.includes(record.id)}
                            onClick={() => handleMarkPaid(record.id)}
                          >
                            {paidIds.includes(record.id) ? "Pago" : "Marcar como Pago"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
