import { useMemo, useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { MessageSquare, Clock, User, ShieldCheck } from "lucide-react";

type ChatMessage = {
  id: string;
  sender: "admin" | "client" | "provider";
  text: string;
  timestamp: string;
};

type Conversation = {
  id: string;
  name: string;
  role: "Cliente" | "Prestador";
  status: "Aguardando" | "Em Atendimento";
  unread: number;
  lastMessage: string;
  lastUpdate: string;
  pixKey: string;
  messages: ChatMessage[];
};

const sampleChats: Conversation[] = [
  {
    id: "c-101",
    name: "Marcela Reis",
    role: "Cliente",
    status: "Em Atendimento",
    unread: 2,
    lastMessage: "Tem previsão de retorno?",
    lastUpdate: "11:32",
    pixKey: "marcela.cpf@limpeja",
    messages: [
      { id: "m1", sender: "client", text: "Boa tarde, ainda não recebi o time?", timestamp: "11:28" },
      { id: "m2", sender: "admin", text: "Estamos reencaminhando agora.", timestamp: "11:30" },
      { id: "m3", sender: "client", text: "Tem previsão de retorno?", timestamp: "11:32" },
    ],
  },
  {
    id: "c-102",
    name: "Luciano Gomes",
    role: "Prestador",
    status: "Aguardando",
    unread: 0,
    lastMessage: "Checklist enviado.",
    lastUpdate: "09:17",
    pixKey: "luciano.pix@limpeja",
    messages: [
      { id: "m4", sender: "provider", text: "Checklist enviado, aguardo liberação.", timestamp: "09:15" },
      { id: "m5", sender: "admin", text: "Recebido, aguardando cliente responder.", timestamp: "09:17" },
    ],
  },
  {
    id: "c-103",
    name: "Bruna Ferreira",
    role: "Cliente",
    status: "Em Atendimento",
    unread: 1,
    lastMessage: "Obrigada!",
    lastUpdate: "08:42",
    pixKey: "bruna.ferreira@limpeja",
    messages: [
      { id: "m6", sender: "client", text: "Obrigada pelo apoio!", timestamp: "08:40" },
      { id: "m7", sender: "provider", text: "Estamos a caminho.", timestamp: "08:42" },
    ],
  },
];

export default function SupportCenter() {
  const [selectedChatId, setSelectedChatId] = useState(sampleChats[0].id);
  const [quickResponse, setQuickResponse] = useState("");

  const selectedConversation = useMemo(() => {
    return sampleChats.find((conv) => conv.id === selectedChatId) ?? sampleChats[0];
  }, [selectedChatId]);

  const handleSendQuickResponse = () => {
    if (!quickResponse.trim()) return;
    // implementação simulada; no futuro call backend
    setQuickResponse("");
  };

  return (
    <div className="flex h-screen bg-admin-bg">
      <Sidebar />
      <div className="flex-1 ml-72 overflow-hidden">
        <Header title="Central de Suporte" subtitle="Chat híbrido com clientes e prestadores" />
        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
            <Card className="border-0 shadow-floating">
              <CardHeader>
                <CardTitle>Conversas Ativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sampleChats.map((conversation) => (
                  <motion.button
                    key={conversation.id}
                    onClick={() => setSelectedChatId(conversation.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className={`w-full text-left p-3 rounded-xl border ${
                      selectedChatId === conversation.id ? "border-medium-blue bg-gray-50" : "border-gray-200 bg-white"
                    } flex flex-col gap-1`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{conversation.name}</span>
                      <Badge variant={conversation.status === "Em Atendimento" ? "outline" : "ghost"}>{conversation.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={14} />
                      <span>{conversation.lastUpdate}</span>
                      <ShieldCheck size={14} />
                      <span>{conversation.role}</span>
                    </div>
                    <p className="text-sm text-gray-600">{conversation.lastMessage}</p>
                  </motion.button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-floating flex flex-col h-full">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare size={20} />
                  Conversa com {selectedConversation.name}
                </CardTitle>
                <span className="text-xs text-gray-500">Chave PIX: {selectedConversation.pixKey}</span>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 gap-4">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {selectedConversation.messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-2xl max-w-[80%] ${message.sender === "admin" ? "bg-medium-blue/10 self-end text-gray-900" : "bg-gray-100 self-start text-gray-800"}`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <span className="text-[11px] text-gray-500">{message.timestamp}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="Resposta rápida..."
                    value={quickResponse}
                    onChange={(event) => setQuickResponse(event.target.value)}
                  />
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setQuickResponse("")}>
                      Limpar
                    </Button>
                    <Button className="bg-medium-blue hover:bg-blue-700 text-white" onClick={handleSendQuickResponse}>
                      Enviar resposta rápida
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
