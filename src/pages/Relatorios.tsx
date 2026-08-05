import { useState } from 'react';
import { FileBarChart2, Presentation } from 'lucide-react';

import { VisibilityToggle } from '../components/VisibilityToggle';
import { ReportBuilder } from '../components/Relatorios/ReportBuilder';
import { PresentationWizard, PresentationConfig } from '../components/Relatorios/PresentationWizard';
import { PresentationView } from '../components/Relatorios/PresentationView';

type Tab = 'relatorios' | 'apresentacao';

export default function Relatorios() {
  const [tab, setTab] = useState<Tab>('relatorios');
  const [presentationConfig, setPresentationConfig] = useState<PresentationConfig | null>(null);

  if (presentationConfig) {
    return <PresentationView config={presentationConfig} onExit={() => setPresentationConfig(null)} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-slate-950">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Apresentação &amp; Relatórios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Relatórios financeiros detalhados e apresentações prontas para compartilhar.</p>
        </div>
        <VisibilityToggle />
      </div>

      <div className="flex border border-gray-200 w-fit text-xs font-bold overflow-hidden">
        <button
          onClick={() => setTab('relatorios')}
          className={`px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-colors ${tab === 'relatorios' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          <FileBarChart2 className="w-4 h-4" /> Relatórios
        </button>
        <button
          onClick={() => setTab('apresentacao')}
          className={`px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-colors border-l border-gray-200 ${tab === 'apresentacao' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          <Presentation className="w-4 h-4" /> Apresentação
        </button>
      </div>

      {tab === 'relatorios' ? (
        <ReportBuilder />
      ) : (
        <PresentationWizard onStart={setPresentationConfig} />
      )}
    </div>
  );
}
