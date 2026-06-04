import Sidebar from '../components/Sidebar';

interface StatCard {
  label: string;
  value: string;
  color: string;
}

interface Transaction {
  id: number;
  description: string;
  date: string;
  value: string;
  type: 'income' | 'expense';
  status: 'completed' | 'pending';
}

export default function Dashboard() {
  const stats: StatCard[] = [
    { label: 'Saldo Atual', value: 'R$ 45.230,00', color: 'text-brand-green' },
    { label: 'Receitas', value: 'R$ 12.800,00', color: 'text-blue-600' },
    { label: 'Despesas', value: 'R$ 4.200,00', color: 'text-red-500' },
  ];

  const transactions: Transaction[] = [
    { id: 1, description: 'Venda SaaS', date: '24 Mai 2026', value: '+ R$ 2.500,00', type: 'income', status: 'completed' },
    { id: 2, description: 'Hospedagem Cloud', date: '22 Mai 2026', value: '- R$ 450,00', type: 'expense', status: 'completed' },
    { id: 3, description: 'Consultoria UI', date: '20 Mai 2026', value: '+ R$ 1.800,00', type: 'income', status: 'pending' },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Olá, João Silva 👋</h1>
            <p className="text-sm text-gray-500">Aqui está o resumo das suas finanças.</p>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-full border-2 border-brand-green cursor-pointer"></div>
        </header>

        {/* MÓDULO DE MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className="p-6 rounded-2xl border border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <h3 className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* MÓDULO FINANCEIRO (TABELA CLEAN) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-lg text-gray-900">Últimas Transações</h2>
            <button className="text-brand-green text-sm font-bold hover:underline cursor-pointer">Ver tudo</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-bold">
                <tr>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{tx.description}</td>
                    <td className="px-6 py-4 text-gray-500">{tx.date}</td>
                    <td className={`px-6 py-4 font-bold ${tx.type === 'income' ? 'text-brand-green' : 'text-red-500'}`}>
                      {tx.value}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        tx.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {tx.status === 'completed' ? 'Concluído' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}