import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';

interface CustomerFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  userProfile: any;
}

export function CustomerForm({ onCancel, onSuccess, userProfile }: CustomerFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    whatsapp_number: '',
    email: '',
    product_interest: '',
    stage: 'new',
    tags: [] as string[],
    notes: '',
    reminder_date: '',
    reminder_message: ''
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const availableTags = ['VIP', 'Lead Frio', 'Lead Quente', 'Interessado', 'Negociação'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) return;

    setLoading(true);

    try {
      // 1. Criar cliente
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          customer_name: formData.customer_name,
          whatsapp_number: formData.whatsapp_number,
          email: formData.email,
          product_interest: formData.product_interest,
          store_id: userProfile.id,
          total_points: 0
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // 2. Criar estágio no funil
      await supabase
        .from('customer_sales_funnel')
        .insert({
          customer_id: customer.id,
          store_id: userProfile.id,
          stage: formData.stage,
          notes: formData.notes
        });

      // 3. Adicionar tags
      if (selectedTags.length > 0) {
        const tagInserts = selectedTags.map(tag => ({
          customer_id: customer.id,
          store_id: userProfile.id,
          tag
        }));
        
        await supabase
          .from('customer_tags')
          .insert(tagInserts);
      }

      // 4. Criar lembrete se especificado
      if (formData.reminder_date) {
        await supabase
          .from('follow_up_reminders')
          .insert({
            customer_id: customer.id,
            store_id: userProfile.id,
            reminder_date: formData.reminder_date,
            message: formData.reminder_message || `Follow-up com ${formData.customer_name}`
          });
      }

      // 5. Adicionar nota inicial se especificada
      if (formData.notes) {
        await supabase
          .from('customer_notes')
          .insert({
            customer_id: customer.id,
            store_id: userProfile.id,
            note: formData.notes
          });
      }

      toast({
        title: "Cliente adicionado com sucesso!",
        description: `${formData.customer_name} foi cadastrado no sistema.`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar cliente",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={onCancel} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Cliente</CardTitle>
            <CardDescription>
              Preencha as informações básicas do cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Cliente *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product">Produto/Serviço de Interesse</Label>
                  <Input
                    id="product"
                    type="text"
                    value={formData.product_interest}
                    onChange={(e) => setFormData({ ...formData, product_interest: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Status no Funil</Label>
                <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Novo</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags de Segmentação</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <Button
                      key={tag}
                      type="button"
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas Iniciais</Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione observações sobre o cliente..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reminder-date">Data para Follow-up</Label>
                  <Input
                    id="reminder-date"
                    type="date"
                    value={formData.reminder_date}
                    onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder-message">Mensagem do Lembrete</Label>
                  <Input
                    id="reminder-message"
                    type="text"
                    placeholder="Lembrete personalizado..."
                    value={formData.reminder_message}
                    onChange={(e) => setFormData({ ...formData, reminder_message: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Salvando...' : 'Salvar Cliente'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}