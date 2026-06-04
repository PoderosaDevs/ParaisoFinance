import React, { useRef, useState, useEffect } from "react";
import { CalendarIcon, ChevronDown, X, Settings2, ChevronLeft, ChevronRight } from "lucide-react";

interface DateRangePickerProps {
  startDate: string; // Espera e emite "YYYY-MM-DD"
  endDate: string;   // Espera e emite "YYYY-MM-DD"
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  formatDateDisplay?: (date: string) => string;
  renderCustomFields?: () => React.ReactNode;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  formatDateDisplay,
  renderCustomFields,
}) => {
  // Gera as datas padrão do mês atual (Primeiro e último dia cheios)
  const getDefaultMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDayNum = new Date(year, month + 1, 0).getDate();
    const lastDay = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDayNum).padStart(2, "0")}`;
    return { firstDay, lastDay };
  };

  const [isOpen, setIsOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  
  // Controla qual ano está sendo navegado na lista de cards
  const [currentYearView, setCurrentYearView] = useState<number>(() => {
    if (startDate) return parseInt(startDate.split("-")[0], 10);
    return new Date().getFullYear();
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const monthsLabels = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  // Garante que o componente inicie populado caso o pai mande vazio
  useEffect(() => {
    if (!startDate && !endDate) {
      const { firstDay, lastDay } = getDefaultMonthRange();
      onStartDateChange(firstDay);
      onEndDateChange(lastDay);
      setIsCustom(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lógica principal solicitada: Ao clicar no mês, define o dia 01 e o último dia correspondente
  const handleSelectMonthCard = (monthIndex: number) => {
    const formattedMonth = String(monthIndex + 1).padStart(2, "0");
    const targetStartDate = `${currentYearView}-${formattedMonth}-01`;
    
    const lastDayNumber = new Date(currentYearView, monthIndex + 1, 0).getDate();
    const targetEndDate = `${currentYearView}-${formattedMonth}-${String(lastDayNumber).padStart(2, "0")}`;

    onStartDateChange(targetStartDate);
    onEndDateChange(targetEndDate);
    setIsOpen(false); // Fecha o modal após a escolha
  };

  const handleToggleMode = () => {
    if (isCustom) {
      setIsCustom(false);
      const { firstDay, lastDay } = getDefaultMonthRange();
      onStartDateChange(firstDay);
      onEndDateChange(lastDay);
    } else {
      setIsCustom(true);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCustom(false);
    const { firstDay, lastDay } = getDefaultMonthRange();
    onStartDateChange(firstDay);
    onEndDateChange(lastDay);
  };

  // Formata o texto exibido no botão principal para "Mês/Ano" (Ex: Jun/2026)
  const getTriggerLabel = () => {
    if (!startDate || !endDate) return "Selecione o período";

    const startParts = startDate.split("-");
    const endParts = endDate.split("-");

    if (startParts.length !== 3) return startDate;

    // Se não for customizado (for período de mês cheio), mostra "Mês/Ano" bonitinho
    if (!isCustom && startParts[2] === "01") {
      const monthIndex = parseInt(startParts[1], 10) - 1;
      const currentMonthLabel = monthsLabels[monthIndex] || startParts[1];
      return `${currentMonthLabel}/${startParts[0]}`;
    }

    // Se for customizado por input de data, usa a formatação padrão DD/MM/YYYY
    if (formatDateDisplay) {
      return `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`;
    }

    return `${startParts[2]}/${startParts[1]}/${startParts[0]} - ${endParts[2]}/${endParts[1]}/${endParts[0]}`;
  };

  const isMonthCardSelected = (monthIndex: number) => {
    if (isCustom || !startDate) return false;
    const startParts = startDate.split("-");
    return parseInt(startParts[0], 10) === currentYearView && parseInt(startParts[1], 10) === (monthIndex + 1);
  };

  return (
    <div ref={containerRef} className="relative w-full lg:w-auto font-sans text-gray-900">
      {/* Gatilho principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full lg:w-[190px] h-9 px-3 flex items-center justify-between gap-2 bg-white border text-xs font-semibold transition-all rounded-md cursor-pointer select-none ${
          isOpen ? "border-black ring-1 ring-black" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className={`w-3.5 h-3.5 ${isOpen ? "text-black" : "text-gray-400"}`} />
          <span className="text-gray-700 tabular-nums">{getTriggerLabel()}</span>
        </div>
        
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-gray-150">
          {(isCustom || startDate !== getDefaultMonthRange().firstDay) && (
            <div
              onClick={handleClear}
              className="p-0.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </div>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Caixa Suspensa com estilo arredondado e borda preta marcante */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-full lg:w-[310px] bg-white border-2 border-black rounded-2xl shadow-xl z-50 p-4 flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-1 duration-150 origin-top-right">
          
          {!isCustom ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mês de Referência</span>
                
                {/* Seleção do ano vigente */}
                <div className="flex items-center gap-1 bg-gray-50 rounded-md p-0.5 border border-gray-200">
                  <button 
                    type="button"
                    onClick={() => setCurrentYearView(prev => prev - 1)}
                    className="p-1 hover:bg-white rounded-md text-gray-600 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-[11px] font-bold px-1.5 text-gray-700 tabular-nums">{currentYearView}</span>
                  <button 
                    type="button"
                    onClick={() => setCurrentYearView(prev => prev + 1)}
                    className="p-1 hover:bg-white rounded-md text-gray-600 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Cards dos Meses */}
              <div className="grid grid-cols-3 gap-1.5">
                {monthsLabels.map((monthLabel, index) => {
                  const isSelected = isMonthCardSelected(index);

                  return (
                    <div
                      key={monthLabel}
                      onClick={() => handleSelectMonthCard(index)}
                      className={`h-10 flex items-center justify-center rounded-lg border text-xs font-semibold transition-all cursor-pointer select-none ${
                        isSelected
                          ? "bg-brand-green border-brand-green text-white shadow-sm font-bold scale-[1.02]"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {monthLabel}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Modo Intervalo Customizado */
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Período Customizado</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-medium text-gray-400 uppercase">Início</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="h-9 px-2 border-2 border-gray-200 focus:border-black rounded-lg text-xs font-medium outline-none bg-gray-50/50 focus:bg-white transition-all [color-scheme:light]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-medium text-gray-400 uppercase">Fim</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="h-9 px-2 border-2 border-gray-200 focus:border-black rounded-lg text-xs font-medium outline-none bg-gray-50/50 focus:bg-white transition-all [color-scheme:light]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botão de Alternância */}
          <div className="pt-1.5 border-t border-gray-100">
            <button
              type="button"
              onClick={handleToggleMode}
              className="w-full h-9 px-3 flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-black text-gray-500 hover:text-black transition-colors rounded-xl text-xs font-semibold bg-gray-50/40 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              {isCustom ? "Voltar para Mês Único" : "Ativar período personalizado"}
            </button>
          </div>

          {renderCustomFields && (
            <div className="pt-1 border-t border-gray-100 flex flex-col gap-2">
              {renderCustomFields()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};