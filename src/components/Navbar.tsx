import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus, LogOut, User } from 'lucide-react';

interface NavbarProps {
  onAddCustomer: () => void;
}

export function Navbar({ onAddCustomer }: NavbarProps) {
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-card shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-primary">Mini-CRM</h1>
          </div>

          <div className="flex items-center space-x-4">
            <Button onClick={onAddCustomer} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
            
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>

            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}