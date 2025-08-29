import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { CustomerForm } from './CustomerForm';
import { CustomerCard } from './CustomerCard';
import { CustomerDetails } from './CustomerDetails';
import { Navbar } from './Navbar';
import { Users, Calendar, TrendingUp, Star } from 'lucide-react';

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

interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  upcomingReminders: number;
  totalPoints: number;
}

const motivationalMessages = [
  "Não esqueça de ligar para seus clientes hoje! 📞",
  "Cada cliente satisfeito é um embaixador da sua marca! ⭐",
  "Mantenha seus follow-ups em dia para não perder oportunidades! 🎯",
  "Lembre-se: relacionamento é a chave do sucesso! 🤝",
  "Seus clientes valorizam a atenção pessoal! 💫"
];

export function Dashboard() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    upcomingReminders: 0,
    totalPoints: 0
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  const todaysMessage = motivationalMessages[new Date().getDay() % motivationalMessages.length];

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    if (userProfile?.id) {
      fetchCustomers();
      fetchStats();
    }
  }, [userProfile]);

  const fetchUserProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    
    setUserProfile(data);
  };

  const fetchCustomers = async () => {
    if (!userProfile?.id) return;

    const { data: customersData } = await supabase
      .from('customers')
      .select('*')
      .eq('store_id', userProfile.id)
      .order('created_at', { ascending: false });

    if (customersData) {
      // Fetch additional data for each customer
      const customersWithDetails = await Promise.all(
        customersData.map(async (customer) => {
          // Get sales funnel stage
          const { data: funnelData } = await supabase
            .from('customer_sales_funnel')
            .select('stage')
            .eq('customer_id', customer.id)
            .single();

          // Get tags
          const { data: tagsData } = await supabase
            .from('customer_tags')
            .select('tag')
            .eq('customer_id', customer.id);

          return {
            ...customer,
            stage: funnelData?.stage || 'new',
            tags: tagsData?.map((t) => t.tag) || []
          };
        })
      );
      
      setCustomers(customersWithDetails);
    }
  };

  const fetchStats = async () => {
    if (!userProfile?.id) return;

    const { data: customersData } = await supabase
      .from('customers')
      .select('total_points')
      .eq('store_id', userProfile.id);

    const { data: reminders } = await supabase
      .from('follow_up_reminders')
      .select('id')
      .eq('store_id', userProfile.id)
      .gte('reminder_date', new Date().toISOString().split('T')[0])
      .lte('reminder_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    const totalCustomers = customersData?.length || 0;
    const totalPoints = customersData?.reduce((sum, c) => sum + (c.total_points || 0), 0) || 0;
    
    setStats({
      totalCustomers,
      activeCustomers: Math.floor(totalCustomers * 0.7), // Estimativa
      upcomingReminders: reminders?.length || 0,
      totalPoints
    });
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.whatsapp_number?.includes(searchTerm) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !tagFilter || customer.tags?.includes(tagFilter);
    const matchesStage = !stageFilter || customer.stage === stageFilter;
    
    return matchesSearch && matchesTag && matchesStage;
  });

  if (selectedCustomer) {
    return (
      <CustomerDetails 
        customer={selectedCustomer} 
        onBack={() => setSelectedCustomer(null)}
        onUpdate={fetchCustomers}
        userProfile={userProfile}
      />
    );
  }

  if (showCustomerForm) {
    return (
      <CustomerForm 
        onCancel={() => setShowCustomerForm(false)}
        onSuccess={() => {
          setShowCustomerForm(false);
          fetchCustomers();
          fetchStats();
        }}
        userProfile={userProfile}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onAddCustomer={() => setShowCustomerForm(true)} />
      
      <div className="container mx-auto px-4 py-6">
        {/* Mensagem motivacional */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-lg text-center font-medium text-foreground">
              {todaysMessage}
            </p>
          </CardContent>
        </Card>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Follow-ups esta semana</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingReminders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pontos</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPoints}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e busca */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="px-3 py-2 border rounded-md min-w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <select
                className="px-3 py-2 border rounded-md"
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="new">Novo</option>
                <option value="in_progress">Em andamento</option>
                <option value="completed">Concluído</option>
              </select>

              <select
                className="px-3 py-2 border rounded-md"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
              >
                <option value="">Todas as tags</option>
                <option value="VIP">VIP</option>
                <option value="Lead Frio">Lead Frio</option>
                <option value="Lead Quente">Lead Quente</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de clientes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(customer => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onClick={() => setSelectedCustomer(customer)}
            />
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-medium mb-2">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {customers.length === 0 
                  ? "Comece adicionando seu primeiro cliente!"
                  : "Tente ajustar os filtros de busca."
                }
              </p>
              {customers.length === 0 && (
                <Button onClick={() => setShowCustomerForm(true)}>
                  Adicionar Primeiro Cliente
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}