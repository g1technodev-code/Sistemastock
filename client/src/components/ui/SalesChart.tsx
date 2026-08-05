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
    <Card className="col-span-full shadow-float dark:bg-neutral-900/60 dark:backdrop-blur-md dark:border-white/10 relative z-0">
      <CardHeader title="Evolución de Ingresos" description="Últimos 7 días (Simulado)" />
      <div className="h-[320px] w-full p-4 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#a3a3a3" opacity={0.15} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373', fontWeight: 500 }} dy={12} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373', fontWeight: 500 }} tickFormatter={(val) => `$${val/1000}k`} />
            <Tooltip 
              cursor={{ fill: '#737373', opacity: 0.05 }}
              contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', padding: '12px 16px', fontWeight: 600 }}
              formatter={(value: any) => [formatCurrency(Number(value)), "Ingresos"] as any}
            />
            <Bar dataKey="ingresos" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={48} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
