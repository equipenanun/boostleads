import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Phone, Mail, Star, Calendar, Plus, MessageSquare, Gift } from 'lucide-react';

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

interface CustomerDetailsProps {
  customer: Customer;
  onBack: () => void;
  onUpdate: () => void;
  userProfile: any;
}

interface Note {
  id: string;
  note: string;
  created_at: string;
}

interface Purchase {
  id: string;
  purchase_value: number;
  points_earned: number;
  description: string;
  created_at: string;
}

interface Reminder {
  id: string;
  reminder_date: string;
  message: string;
  is_sent: boolean;
  created_at: string;
}

export function CustomerDetails({ customer, onBack, onUpdate, userProfile }: CustomerDetailsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newPurchase, setNewPurchase] = useState({
    purchase_value: '',
    description: '',
    points_per_real: 1
  });
  const [newReminder, setNewReminder] = useState({
    reminder_date: '',
    message: ''
  });
  const [currentStage, setCurrentStage] = useState(customer.stage || 'new');

  useEffect(() => {
    fetchCustomerData();
  }, [customer.id]);

  const fetchCustomerData = async () => {
    // Buscar notas
    const { data: notesData } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    // Buscar compras
    const { data: purchasesData } = await supabase
      .from('purchases')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    // Buscar lembretes
    const { data: remindersData } = await supabase
      .from('follow_up_reminders')
      .select('*')
      .eq('customer_id', customer.id)
      .order('reminder_date', { ascending: false });

    setNotes(notesData || []);
    setPurchases(purchasesData || []);
    setReminders(remindersData || []);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('customer_notes')
      .insert({
        customer_id: customer.id,
        store_id: userProfile.id,
        note: newNote
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar nota",
        description: error.message,
      });
    } else {
      setNewNote('');
      fetchCustomerData();
      toast({
        title: "Nota adicionada com sucesso!",
      });
    }
    setLoading(false);
  };

  const addPurchase = async () => {
    if (!newPurchase.purchase_value) return;

    setLoading(true);
    const purchaseValue = parseFloat(newPurchase.purchase_value);
    const pointsEarned = Math.floor(purchaseValue * newPurchase.points_per_real);

    const { error } = await supabase
      .from('purchases')
      .insert({
        customer_id: customer.id,
        store_id: userProfile.id,
        purchase_value: purchaseValue,
        points_earned: pointsEarned,
        description: newPurchase.description
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar compra",
        description: error.message,
      });
    } else {
      setNewPurchase({ purchase_value: '', description: '', points_per_real: 1 });
      fetchCustomerData();
      onUpdate(); // Atualizar lista principal
      toast({
        title: "Compra registrada com sucesso!",
        description: `${pointsEarned} pontos adicionados ao cliente.`,
      });
    }
    setLoading(false);
  };

  const addReminder = async () => {
    if (!newReminder.reminder_date) return;

    setLoading(true);
    const { error } = await supabase
      .from('follow_up_reminders')
      .insert({
        customer_id: customer.id,
        store_id: userProfile.id,
        reminder_date: newReminder.reminder_date,
        message: newReminder.message || `Follow-up com ${customer.customer_name}`
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar lembrete",
        description: error.message,
      });
    } else {
      setNewReminder({ reminder_date: '', message: '' });
      fetchCustomerData();
      toast({
        title: "Lembrete criado com sucesso!",
      });
    }
    setLoading(false);
  };

  const updateStage = async (newStage: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('customer_sales_funnel')
      .upsert({
        customer_id: customer.id,
        store_id: userProfile.id,
        stage: newStage
      }, {
        onConflict: 'customer_id,store_id'
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: error.message,
      });
    } else {
      setCurrentStage(newStage);
      onUpdate();
      toast({
        title: "Status atualizado com sucesso!",
      });
    }
    setLoading(false);
  };

  const getStageName = (stage: string) => {
    switch (stage) {
      case 'new': return 'Novo';
      case 'in_progress': return 'Em andamento';
      case 'completed': return 'Concluído';
      default: return 'Novo';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Dashboard
          </Button>
        </div>

        {/* Header do Cliente */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{customer.customer_name}</CardTitle>
                <CardDescription>
                  Cliente desde {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-orange-500 fill-current" />
                  <span className="text-xl font-bold">{customer.total_points} pontos</span>
                </div>
                <Select value={currentStage} onValueChange={updateStage}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Novo</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                {customer.whatsapp_number && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span>{customer.whatsapp_number}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span>{customer.email}</span>
                  </div>
                )}
              </div>
              <div>
                {customer.product_interest && (
                  <p><strong>Interesse:</strong> {customer.product_interest}</p>
                )}
                {customer.tags && customer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {customer.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Funcionalidades */}
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes">Histórico & Notas</TabsTrigger>
            <TabsTrigger value="purchases">Compras & Pontos</TabsTrigger>
            <TabsTrigger value="reminders">Follow-ups</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Adicionar Nova Nota</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Digite uma nova nota sobre o cliente..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={addNote} disabled={loading || !newNote.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Nota
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Interações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="border-l-4 border-primary pl-4">
                      <p className="text-sm">{note.note}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(note.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma nota registrada ainda
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-5 w-5" />
                  <span>Registrar Nova Compra</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchase-value">Valor da Compra</Label>
                      <Input
                        id="purchase-value"
                        type="number"
                        step="0.01"
                        placeholder="100.00"
                        value={newPurchase.purchase_value}
                        onChange={(e) => setNewPurchase({ ...newPurchase, purchase_value: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="points-rate">Pontos por R$</Label>
                      <Input
                        id="points-rate"
                        type="number"
                        value={newPurchase.points_per_real}
                        onChange={(e) => setNewPurchase({ ...newPurchase, points_per_real: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pontos a Ganhar</Label>
                      <div className="py-2 px-3 border rounded-md bg-muted">
                        {newPurchase.purchase_value ? Math.floor(parseFloat(newPurchase.purchase_value) * newPurchase.points_per_real) : 0}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase-description">Descrição</Label>
                    <Input
                      id="purchase-description"
                      placeholder="Produto comprado..."
                      value={newPurchase.description}
                      onChange={(e) => setNewPurchase({ ...newPurchase, description: e.target.value })}
                    />
                  </div>
                  <Button onClick={addPurchase} disabled={loading || !newPurchase.purchase_value}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Compra
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Compras</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">R$ {purchase.purchase_value.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{purchase.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(purchase.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-orange-600">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="font-medium">+{purchase.points_earned}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {purchases.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma compra registrada ainda
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reminders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Agendar Follow-up</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reminder-date">Data do Lembrete</Label>
                      <Input
                        id="reminder-date"
                        type="date"
                        value={newReminder.reminder_date}
                        onChange={(e) => setNewReminder({ ...newReminder, reminder_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reminder-message">Mensagem</Label>
                      <Input
                        id="reminder-message"
                        placeholder="Lembrete personalizado..."
                        value={newReminder.message}
                        onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={addReminder} disabled={loading || !newReminder.reminder_date}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agendar Lembrete
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lembretes Agendados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reminders.map((reminder) => (
                    <div key={reminder.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{reminder.message}</p>
                        <p className="text-sm text-muted-foreground">
                          Data: {new Date(reminder.reminder_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant={reminder.is_sent ? "default" : "secondary"}>
                        {reminder.is_sent ? "Enviado" : "Pendente"}
                      </Badge>
                    </div>
                  ))}
                  {reminders.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum lembrete agendado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}