import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CreditCard,
  LayoutDashboard,
  PackageCheck,
  Plus,
  Search,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const products = [
  { sku: 'CAM-BASIC-P', name: 'Camiseta Basic Preta', category: 'Moda', stock: 148, reserved: 32, price: 79.9, cost: 32.4, status: 'Ativo' },
  { sku: 'TEN-RUN-42', name: 'Tênis Runner Pro 42', category: 'Calçados', stock: 24, reserved: 8, price: 349.9, cost: 188.0, status: 'Reposição' },
  { sku: 'FON-BT-X1', name: 'Fone Bluetooth X1', category: 'Eletrônicos', stock: 12, reserved: 5, price: 189.9, cost: 91.5, status: 'Crítico' },
  { sku: 'MOCH-URB', name: 'Mochila Urbana', category: 'Acessórios', stock: 76, reserved: 11, price: 159.9, cost: 72.2, status: 'Ativo' },
];

const orders = [
  { id: '#10294', customer: 'Ana Martins', channel: 'Shopify', value: 529.7, status: 'Pago', fulfillment: 'Separando' },
  { id: '#10293', customer: 'Rafael Costa', channel: 'Mercado Livre', value: 189.9, status: 'Pago', fulfillment: 'Enviado' },
  { id: '#10292', customer: 'Loja Norte B2B', channel: 'B2B', value: 3420.5, status: 'Faturado', fulfillment: 'Coleta hoje' },
  { id: '#10291', customer: 'Beatriz Lima', channel: 'WooCommerce', value: 239.8, status: 'Pendente', fulfillment: 'Aguardando pagamento' },
];

const customers = [
  { name: 'Ana Martins', segment: 'VIP', orders: 18, ltv: 6420.1 },
  { name: 'Rafael Costa', segment: 'Recorrente', orders: 7, ltv: 1848.3 },
  { name: 'Loja Norte B2B', segment: 'Atacado', orders: 42, ltv: 92810.0 },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
  { id: 'products', label: 'Produtos', icon: PackageCheck },
  { id: 'inventory', label: 'Estoque', icon: Boxes },
  { id: 'customers', label: 'Clientes', icon: Users },
  { id: 'finance', label: 'Financeiro', icon: CreditCard },
];

function MetricCard({ title, value, description, icon: Icon, tone }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
          <div className={`rounded-2xl p-3 ${tone}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ children }) {
  const styles = {
    Ativo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Reposição: 'bg-amber-50 text-amber-700 border-amber-200',
    Crítico: 'bg-rose-50 text-rose-700 border-rose-200',
    Pago: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Faturado: 'bg-blue-50 text-blue-700 border-blue-200',
    Pendente: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return <Badge className={`${styles[children] || 'bg-slate-50 text-slate-700'} border`}>{children}</Badge>;
}

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [query, setQuery] = useState('');

  const totals = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + order.value, 0);
    const stockUnits = products.reduce((sum, product) => sum + product.stock, 0);
    const margin = products.reduce((sum, product) => sum + (product.price - product.cost) * product.stock, 0);

    return { revenue, stockUnits, margin, openOrders: orders.length };
  }, []);

  const filteredProducts = products.filter((product) =>
    [product.name, product.sku, product.category].some((field) => field.toLowerCase().includes(query.toLowerCase())),
  );

  const renderMainPanel = () => {
    if (activeView === 'orders') {
      return <OrdersPanel />;
    }

    if (activeView === 'customers') {
      return <CustomersPanel />;
    }

    if (activeView === 'finance') {
      return <FinancePanel totals={totals} />;
    }

    return <OperationsPanel products={filteredProducts} showInventory={activeView === 'inventory'} />;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-slate-950 p-6 text-white lg:block">
        <div className="mb-10">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-400 p-3 text-slate-950">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">CommerceERP</h1>
              <p className="text-xs text-slate-400">Gestão integrada ecommerce</p>
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                activeView === item.id ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">ERP para ecommerce</p>
              <h2 className="text-3xl font-bold">Operação unificada de vendas, estoque e finanças</h2>
            </div>
            <div className="flex gap-3">
              <div className="relative w-full min-w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar SKU, produto ou categoria" className="pl-9" />
              </div>
              <Button><Plus className="mr-2 h-4 w-4" />Novo</Button>
            </div>
          </div>
        </header>

        <section className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Receita de hoje" value={formatCurrency(totals.revenue)} description="+18% vs. ontem" icon={ShoppingCart} tone="bg-cyan-50 text-cyan-700" />
            <MetricCard title="Pedidos abertos" value={totals.openOrders} description="2 pedidos aguardam ação" icon={Truck} tone="bg-blue-50 text-blue-700" />
            <MetricCard title="Unidades em estoque" value={totals.stockUnits} description="17 itens reservados" icon={Boxes} tone="bg-emerald-50 text-emerald-700" />
            <MetricCard title="Margem potencial" value={formatCurrency(totals.margin)} description="Baseada no estoque atual" icon={CreditCard} tone="bg-violet-50 text-violet-700" />
          </div>

          {renderMainPanel()}
        </section>
      </main>
    </div>
  );
}

function OperationsPanel({ products, showInventory }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{showInventory ? 'Controle de estoque' : 'Catálogo de produtos'}</CardTitle>
          <CardDescription>Produtos, disponibilidade, reservas e margem por SKU.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr><th className="pb-3">SKU</th><th>Produto</th><th>Estoque</th><th>Preço</th><th>Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.sku} className="align-middle">
                  <td className="py-4 font-mono text-xs text-slate-500">{product.sku}</td>
                  <td className="py-4"><div className="font-medium">{product.name}</div><div className="text-xs text-slate-500">{product.category}</div></td>
                  <td className="py-4">{product.stock} <span className="text-xs text-slate-500">({product.reserved} reserv.)</span></td>
                  <td className="py-4">{formatCurrency(product.price)}</td>
                  <td className="py-4"><StatusBadge>{product.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Alertas</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <p>• Fone Bluetooth X1 abaixo do estoque mínimo.</p>
          <p>• Tênis Runner Pro 42 precisa de compra em até 5 dias.</p>
          <p>• 1 pedido pendente de pagamento há mais de 24h.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function OrdersPanel() {
  return (
    <Card>
      <CardHeader><CardTitle>Gestão de pedidos</CardTitle><CardDescription>Funil operacional da captura ao envio.</CardDescription></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {orders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between"><strong>{order.id}</strong><StatusBadge>{order.status}</StatusBadge></div>
            <p className="mt-3 text-sm text-slate-600">{order.customer} • {order.channel}</p>
            <p className="mt-2 text-xl font-bold">{formatCurrency(order.value)}</p>
            <p className="mt-2 text-sm text-slate-500">Fulfillment: {order.fulfillment}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CustomersPanel() {
  return (
    <Card>
      <CardHeader><CardTitle>CRM ecommerce</CardTitle><CardDescription>Clientes por segmento, frequência e valor vitalício.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {customers.map((customer) => (
          <div key={customer.name} className="flex items-center justify-between rounded-2xl border p-4">
            <div><p className="font-semibold">{customer.name}</p><p className="text-sm text-slate-500">{customer.segment} • {customer.orders} pedidos</p></div>
            <p className="font-bold">{formatCurrency(customer.ltv)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FinancePanel({ totals }) {
  return (
    <Card>
      <CardHeader><CardTitle>Financeiro e conciliação</CardTitle><CardDescription>Resumo de recebíveis, custos e margem estimada.</CardDescription></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Recebíveis" value={formatCurrency(totals.revenue * 0.94)} description="Taxas já descontadas" icon={CreditCard} tone="bg-emerald-50 text-emerald-700" />
        <MetricCard title="CMV estimado" value={formatCurrency(totals.revenue * 0.47)} description="Custo das mercadorias" icon={Boxes} tone="bg-amber-50 text-amber-700" />
        <MetricCard title="Lucro bruto" value={formatCurrency(totals.revenue * 0.47)} description="Antes de despesas fixas" icon={BarChart3} tone="bg-cyan-50 text-cyan-700" />
      </CardContent>
    </Card>
  );
}

export default App;
