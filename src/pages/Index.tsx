import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/Dashboard';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-4 text-foreground">Mini-CRM</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Gerencie seus clientes com facilidade
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Sistema completo de gestão de relacionamento com clientes
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 max-w-md mx-auto">
              <li>✅ Cadastro e gestão de clientes</li>
              <li>✅ Sistema de pontos de fidelidade</li>
              <li>✅ Funil de vendas organizado</li>
              <li>✅ Follow-ups automatizados</li>
              <li>✅ Tags para segmentação</li>
            </ul>
            <div className="pt-4">
              <Button asChild size="lg">
                <a href="/auth">Começar Agora</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
};

export default Index;
