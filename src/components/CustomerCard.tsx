import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Star, User } from 'lucide-react';

interface Customer {
  id: string;
  customer_name: string;
  whatsapp_number: string;
  email: string;
  product_interest: string;
  total_points: number;
  created_at: string;
  stage?: string;
  tags?: string[];
}

interface CustomerCardProps {
  customer: Customer;
  onClick: () => void;
}

export function CustomerCard({ customer, onClick }: CustomerCardProps) {
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageName = (stage: string) => {
    switch (stage) {
      case 'new':
        return 'Novo';
      case 'in_progress':
        return 'Em andamento';
      case 'completed':
        return 'Concluído';
      default:
        return 'Novo';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{customer.customer_name}</CardTitle>
              <Badge className={`text-xs ${getStageColor(customer.stage || 'new')}`}>
                {getStageName(customer.stage || 'new')}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-orange-600">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">{customer.total_points}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {customer.product_interest && (
            <p className="text-sm text-muted-foreground">
              <strong>Interesse:</strong> {customer.product_interest}
            </p>
          )}
          
          <div className="flex items-center space-x-4 text-sm">
            {customer.whatsapp_number && (
              <div className="flex items-center space-x-1 text-green-600">
                <Phone className="h-4 w-4" />
                <span>{customer.whatsapp_number}</span>
              </div>
            )}
            
            {customer.email && (
              <div className="flex items-center space-x-1 text-blue-600">
                <Mail className="h-4 w-4" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
          </div>

          {customer.tags && customer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {customer.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {customer.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{customer.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Cliente desde: {new Date(customer.created_at).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}