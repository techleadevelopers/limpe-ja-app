// admin-web/src/pages/login.tsx

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter"; // CORREÇÃO: useLocation para obter a função navigate
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Adicionando useToast para feedback de erro

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation(); // CORREÇÃO: Obtendo setLocation de useLocation
  const { toast } = useToast(); // Hook para exibir notificações

  // Redireciona se já estiver autenticado
  if (isAuthenticated && !isLoading) {
    setLocation('/');
    return null; // Não renderiza nada enquanto redireciona
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // CORREÇÃO: Chama a função login do AuthContext com as credenciais
      await login({ email, password });
    } catch (error: any) {
      // Exibe uma notificação de erro se o login falhar
      toast({
        title: "Erro de Login",
        description: error.message || "Credenciais inválidas. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-admin-bg">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-4"
      >
        <Card className="shadow-floating-lg border-0">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-light-blue to-medium-blue rounded-2xl flex items-center justify-center shadow-floating">
                <Sparkles className="text-white" size={32} />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo ao LimpeJá Admin
            </CardTitle>
            <p className="text-gray-600">
              Faça login para acessar o painel de administração
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="focus:ring-medium-blue focus:border-medium-blue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="focus:ring-medium-blue focus:border-medium-blue"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-medium-blue hover:bg-blue-700 text-white py-2"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}