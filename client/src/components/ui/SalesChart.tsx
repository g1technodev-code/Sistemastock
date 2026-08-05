import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader } from './Card';
import { formatCurrency } from '../../lib/formatters';

const mockData = [
  { name: 'Lun', ingresos: 12000 },
  { name: 'Mar', ingresos: 19000 },
  { name: 'Mié', ingresos: 15000 },
  { name: 'Jue', ingresos: 25000 },
  { name: 'Vie', ingresos: 32000 },
  { name: 'Sáb', ingresos: 45000 },
  { name: 'Dom', ingresos: 30000 },
];

export function SalesChart() {
  return (
    <Card className="col-span-full mb-6 dark:bg-neutral-900/60 dark:backdrop-blur-md dark:border-white/10">
      <CardHeader title="Evolución de Ingresos" description="Últimos 7 días (Simulado)" />
      <div className="h-[300px] w-full p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#525252" opacity={0.2} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `$${val/1000}k`} />
            <Tooltip 
              cursor={{ fill: '#888', opacity: 0.1 }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value: any) => [formatCurrency(value as number), "Ingresos"]}
            />
            <Bar dataKey="ingresos" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
