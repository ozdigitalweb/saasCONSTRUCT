import React from 'react';
import { Home, ClipboardList, CheckSquare, FileText, Server } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingChecklistCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  pendingChecklistCount = 0,
}) => {
  const tabs = [
    { id: 'imoveis', label: 'Imóveis', icon: Home },
    { id: 'planos', label: 'Planos', icon: ClipboardList },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare, badge: pendingChecklistCount > 0 ? pendingChecklistCount : undefined },
    { id: 'relatorios', label: 'PDFs', icon: FileText },
    { id: 'vps', label: 'VPS/DB', icon: Server },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-lg"
      aria-label="Navegação Principal Móvel"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-colors relative ${
                isActive ? 'text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-amber-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium tracking-tight mt-1 leading-none">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-slate-950" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
