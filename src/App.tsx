import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { WizardLayout } from './components/Wizard/WizardLayout';
import { SettlementReceipt } from './components/SettlementReceipt';
import { DatabaseView } from './components/DatabaseView';
import { MasterParametersView } from './components/MasterParametersView';
import { MoraAuditView } from './components/MoraAuditView';
import { secureStorage } from './db/secureStorage';
import {
  ExpedienteLiquidacion,
  Contratista,
  ParametrosMaestros,
} from './types/settlement';
import { Scale, ShieldCheck, Database, Award, ExternalLink } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'wizard' | 'database' | 'parameters' | 'mora' | 'receipt'>('wizard');
  const [expedientes, setExpedientes] = useState<ExpedienteLiquidacion[]>([]);
  const [contratistas, setContratistas] = useState<Contratista[]>([]);
  const [parametros, setParametros] = useState<ParametrosMaestros>(secureStorage.getParametros());
  const [activeExpediente, setActiveExpediente] = useState<ExpedienteLiquidacion | null>(null);
  const [expedienteParaEditar, setExpedienteParaEditar] = useState<ExpedienteLiquidacion | null>(null);

  // Load from secure storage on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    const exps = secureStorage.getExpedientes();
    const conts = secureStorage.getContratistas();
    const params = secureStorage.getParametros();
    setExpedientes(exps);
    setContratistas(conts);
    setParametros(params);
    if (!activeExpediente && exps.length > 0) {
      setActiveExpediente(exps[0]);
    }
  };

  const handleNewSettlement = () => {
    setExpedienteParaEditar(null);
    setCurrentTab('wizard');
  };

  const handleSelectExpediente = (exp: ExpedienteLiquidacion) => {
    setActiveExpediente(exp);
    setCurrentTab('receipt');
  };

  const handleEditExpediente = (exp: ExpedienteLiquidacion) => {
    setExpedienteParaEditar(exp);
    setActiveExpediente(exp);
    setCurrentTab('wizard');
  };

  const handleSaveExpediente = (nuevoExpediente: ExpedienteLiquidacion) => {
    secureStorage.saveExpediente(nuevoExpediente);
    loadAllData();
    setActiveExpediente(nuevoExpediente);
  };

  const handleViewReceipt = (exp: ExpedienteLiquidacion) => {
    setActiveExpediente(exp);
    setCurrentTab('receipt');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Bar adhering to strict Top Bar Contract */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'wizard' && currentTab !== 'wizard') {
            setExpedienteParaEditar(null);
          }
          setCurrentTab(tab);
        }}
        onNewSettlement={handleNewSettlement}
        expedientesCount={expedientes.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'wizard' && (
          <WizardLayout
            contratistas={contratistas}
            parametros={parametros}
            onSaveExpediente={handleSaveExpediente}
            onViewReceipt={handleViewReceipt}
            expedienteParaEditar={expedienteParaEditar}
          />
        )}

        {currentTab === 'receipt' && activeExpediente && (
          <SettlementReceipt
            expediente={activeExpediente}
            onBack={() => setCurrentTab('database')}
            onEdit={() => {
              setExpedienteParaEditar(activeExpediente);
              setCurrentTab('wizard');
            }}
          />
        )}

        {currentTab === 'database' && (
          <DatabaseView
            expedientes={expedientes}
            onSelectExpediente={handleSelectExpediente}
            onEditExpediente={handleEditExpediente}
            onNewSettlement={handleNewSettlement}
            onReload={loadAllData}
          />
        )}

        {currentTab === 'parameters' && (
          <MasterParametersView
            parametros={parametros}
            onUpdateParametros={(params) => {
              setParametros(params);
              loadAllData();
            }}
          />
        )}

        {currentTab === 'mora' && (
          <MoraAuditView
            expedientes={expedientes}
            parametros={parametros}
          />
        )}
      </main>

      {/* Institutional Legal Footer - Hidden during print */}
      <footer className="bg-white border-t border-slate-200 py-6 print-hide text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-blue-700 flex items-center justify-center text-white text-xs font-bold">
              P
            </div>
            <span>
              PetroFiniquito Pequiven · Sistema Automatizado de Liquidación Laboral Petrolera
            </span>
          </div>

          <div className="flex items-center gap-4 text-2xs text-slate-400">
            <span>LOTTT Arts. 141, 142, 143</span>
            <span aria-hidden="true">·</span>
            <span>CCP Petrolera FUPTV</span>
            <span aria-hidden="true">·</span>
            <span>Doctrina Sandrea Pozo (2017)</span>
            <span aria-hidden="true">·</span>
            <span>Seguridad Local Cifrada</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
