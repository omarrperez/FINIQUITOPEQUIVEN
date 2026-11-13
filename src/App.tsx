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
import { fetchLiveBCVRate, BCVSyncState } from './utils/bcvService';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'wizard' | 'database' | 'parameters' | 'mora' | 'receipt'>('database');
  const [expedientes, setExpedientes] = useState<ExpedienteLiquidacion[]>([]);
  const [contratistas, setContratistas] = useState<Contratista[]>([]);
  const [parametros, setParametros] = useState<ParametrosMaestros>(secureStorage.getParametros());
  const [activeExpediente, setActiveExpediente] = useState<ExpedienteLiquidacion | null>(null);
  const [expedienteParaEditar, setExpedienteParaEditar] = useState<ExpedienteLiquidacion | null>(null);
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  const [bcvSyncState, setBcvSyncState] = useState<BCVSyncState>({
    loading: false,
    lastSyncedRate: null,
    lastSource: null,
    lastDate: null,
    error: null,
  });

  // Load from secure storage on mount & silently sync live BCV rate if online
  useEffect(() => {
    loadAllData();
    let active = true;
    fetchLiveBCVRate()
      .then((liveData) => {
        if (!active) return;
        const { parametros: updatedParams, expedientes: updatedExps } =
          secureStorage.applyNewBCVRate(liveData.rate);
        setParametros(updatedParams);
        setExpedientes(updatedExps);
        setActiveExpediente((prev) => {
          if (!prev) return updatedExps[0] || null;
          return updatedExps.find((e) => e.id === prev.id) || updatedExps[0] || null;
        });
        setBcvSyncState({
          loading: false,
          lastSyncedRate: liveData.rate,
          lastSource: liveData.fuente,
          lastDate: liveData.fechaActualizacion,
          error: null,
        });
      })
      .catch(() => {
        // Offline or blocked: keep local stored BCV rate silently until user requests manual/API update
      });
    return () => {
      active = false;
    };
  }, []);

  const loadAllData = () => {
    const exps = secureStorage.getExpedientes();
    const conts = secureStorage.getContratistas();
    const params = secureStorage.getParametros();
    setExpedientes(exps);
    setContratistas(conts);
    setParametros(params);
    if (exps.length > 0) {
      setActiveExpediente((prev) => {
        if (!prev) return exps[0];
        return exps.find((e) => e.id === prev.id) || exps[0];
      });
    }
  };

  const handleSyncLiveBCV = async (): Promise<ParametrosMaestros | null> => {
    setBcvSyncState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const liveData = await fetchLiveBCVRate();
      const { parametros: updatedParams, expedientes: updatedExps } = secureStorage.applyNewBCVRate(
        liveData.rate
      );
      setParametros(updatedParams);
      setExpedientes(updatedExps);
      setActiveExpediente((prev) => {
        if (!prev) return updatedExps[0] || null;
        return updatedExps.find((e) => e.id === prev.id) || updatedExps[0] || null;
      });
      setBcvSyncState({
        loading: false,
        lastSyncedRate: liveData.rate,
        lastSource: liveData.fuente,
        lastDate: liveData.fechaActualizacion,
        error: null,
      });
      return updatedParams;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo consultar la tasa del dólar BCV en este momento.';
      setBcvSyncState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
      return null;
    }
  };

  const handleApplyManualBCV = (nuevaTasa: number): ParametrosMaestros | null => {
    if (!Number.isFinite(nuevaTasa) || nuevaTasa <= 0) return null;
    const tasaNormalizada = Number(nuevaTasa.toFixed(4));
    const { parametros: updatedParams, expedientes: updatedExps } =
      secureStorage.applyNewBCVRate(tasaNormalizada);
    setParametros(updatedParams);
    setExpedientes(updatedExps);
    setActiveExpediente((prev) => {
      if (!prev) return updatedExps[0] || null;
      return updatedExps.find((e) => e.id === prev.id) || updatedExps[0] || null;
    });
    setBcvSyncState({
      loading: false,
      lastSyncedRate: tasaNormalizada,
      lastSource: 'Tasa BCV ingresada manualmente',
      lastDate: new Date().toISOString(),
      error: null,
    });
    return updatedParams;
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

  const hideChrome = currentTab === 'receipt' && isPrintPreview;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white ${
        hideChrome ? 'bg-slate-200/70 print:bg-white' : 'bg-slate-50'
      }`}
    >
      {/* Top Bar adhering to strict Top Bar Contract */}
      {!hideChrome && (
        <Navigation
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setIsPrintPreview(false);
            if (tab === 'wizard' && currentTab !== 'wizard') {
              setExpedienteParaEditar(null);
            }
            setCurrentTab(tab);
          }}
          onNewSettlement={() => {
            setIsPrintPreview(false);
            handleNewSettlement();
          }}
          expedientesCount={expedientes.length}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'wizard' && (
          <WizardLayout
            contratistas={contratistas}
            parametros={parametros}
            onSaveExpediente={handleSaveExpediente}
            onViewReceipt={handleViewReceipt}
            expedienteParaEditar={expedienteParaEditar}
            onSyncLiveBCV={handleSyncLiveBCV}
            bcvSyncState={bcvSyncState}
          />
        )}

        {currentTab === 'receipt' && activeExpediente && (
          <SettlementReceipt
            expediente={activeExpediente}
            onBack={() => {
              setIsPrintPreview(false);
              setCurrentTab('database');
            }}
            onEdit={() => {
              setIsPrintPreview(false);
              setExpedienteParaEditar(activeExpediente);
              setCurrentTab('wizard');
            }}
            onSyncLiveBCV={handleSyncLiveBCV}
            bcvSyncState={bcvSyncState}
            isPreviewMode={isPrintPreview}
            onTogglePreviewMode={() => setIsPrintPreview((prev) => !prev)}
          />
        )}

        {currentTab === 'database' && (
          <DatabaseView
            expedientes={expedientes}
            parametros={parametros}
            onSelectExpediente={handleSelectExpediente}
            onEditExpediente={handleEditExpediente}
            onNewSettlement={handleNewSettlement}
            onReload={loadAllData}
            onSyncLiveBCV={handleSyncLiveBCV}
            onApplyManualBCV={handleApplyManualBCV}
            bcvSyncState={bcvSyncState}
          />
        )}

        {currentTab === 'parameters' && (
          <MasterParametersView
            parametros={parametros}
            onUpdateParametros={(params) => {
              setParametros(params);
              loadAllData();
            }}
            onSyncLiveBCV={handleSyncLiveBCV}
            bcvSyncState={bcvSyncState}
          />
        )}

        {currentTab === 'mora' && (
          <MoraAuditView
            expedientes={expedientes}
            parametros={parametros}
          />
        )}
      </main>

      {/* Institutional Legal Footer - Hidden during print & Vista Previa */}
      {!hideChrome && (
        <footer className="bg-white border-t border-slate-200 py-6 print-hide text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-blue-700 flex items-center justify-center text-white text-xs font-bold">
                C
              </div>
              <span>
                CRISBAORCA 2009, C.A. · Sistema de Liquidación Laboral LOTTT / CCP
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
      )}
    </div>
  );
}
