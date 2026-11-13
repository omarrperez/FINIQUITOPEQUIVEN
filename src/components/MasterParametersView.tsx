import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Scale,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { ParametrosMaestros, TabuladorCargo, TasaBCV } from '../types/settlement';
import { formatBs } from '../utils/calculator';
import { secureStorage } from '../db/secureStorage';
import { BCVSyncState } from '../utils/bcvService';

interface MasterParametersViewProps {
  parametros: ParametrosMaestros;
  onUpdateParametros: (params: ParametrosMaestros) => void;
  onSyncLiveBCV: () => Promise<ParametrosMaestros | null>;
  bcvSyncState: BCVSyncState;
}

export const MasterParametersView: React.FC<MasterParametersViewProps> = ({
  parametros,
  onUpdateParametros,
  onSyncLiveBCV,
  bcvSyncState,
}) => {
  const [salarioMinimo, setSalarioMinimo] = useState(parametros.salarioMinimoUrbano);
  const [diasUtilidades, setDiasUtilidades] = useState(parametros.diasUtilidadesCCP);
  const [diasBonoVacacional, setDiasBonoVacacional] = useState(parametros.diasBonoVacacionalCCP);
  const [diasVacacionesAnuales, setDiasVacacionesAnuales] = useState(parametros.diasVacacionesAnualesCCP || 34);
  const [diasFiniquito, setDiasFiniquito] = useState(parametros.diasBonificacionFiniquitoCCP);
  const [tasaUSD, setTasaUSD] = useState(parametros.tasaCambioBCV_USD);
  const [tabulador, setTabulador] = useState<TabuladorCargo[]>(parametros.tabuladorCargos);
  const [tasasBCV, setTasasBCV] = useState<TasaBCV[]>(parametros.tasasBCV);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setSalarioMinimo(parametros.salarioMinimoUrbano);
    setDiasUtilidades(parametros.diasUtilidadesCCP);
    setDiasBonoVacacional(parametros.diasBonoVacacionalCCP);
    setDiasVacacionesAnuales(parametros.diasVacacionesAnualesCCP || 34);
    setDiasFiniquito(parametros.diasBonificacionFiniquitoCCP);
    setTasaUSD(parametros.tasaCambioBCV_USD);
    setTabulador(parametros.tabuladorCargos);
    setTasasBCV(parametros.tasasBCV);
  }, [parametros]);

  // New Cargo form state
  const [newCodigo, setNewCodigo] = useState('');
  const [newDenominacion, setNewDenominacion] = useState('');
  const [newNivel, setNewNivel] = useState(1);
  const [newSalario, setNewSalario] = useState(300);

  const handleSaveAll = () => {
    const nuevaTasa = Number(tasaUSD) || parametros.tasaCambioBCV_USD;
    const tasaAnterior = parametros.tasaCambioBCV_USD || 904.4485;
    const tabuladorActualizado =
      Math.abs(nuevaTasa - tasaAnterior) > 0.00001
        ? tabulador.map((cargo) => {
            if (cargo.id === 'cargo-sisdem-obrero') {
              return { ...cargo, salarioBasicoDiario: Number((14.0 * nuevaTasa).toFixed(2)) };
            }
            if (cargo.id === 'cargo-inspector-siho') {
              return { ...cargo, salarioBasicoDiario: Number((20.0 * nuevaTasa).toFixed(2)) };
            }
            const usdDiario = cargo.salarioBasicoDiario / tasaAnterior;
            return { ...cargo, salarioBasicoDiario: Number((usdDiario * nuevaTasa).toFixed(2)) };
          })
        : tabulador;

    const updated: ParametrosMaestros = {
      salarioMinimoUrbano: Number(salarioMinimo),
      diasUtilidadesCCP: Number(diasUtilidades),
      diasBonoVacacionalCCP: Number(diasBonoVacacional),
      diasVacacionesAnualesCCP: Number(diasVacacionesAnuales),
      diasBonificacionFiniquitoCCP: Number(diasFiniquito),
      tasaCambioBCV_USD: nuevaTasa,
      tabuladorCargos: tabuladorActualizado,
      tasasBCV: tasasBCV,
    };
    secureStorage.saveParametros(updated);
    secureStorage.recalcularTodosExpedientes(updated);
    onUpdateParametros(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Restaurar los parámetros, tabuladores y expedientes a los valores oficiales por defecto (Tasa BCV 911,6243 Bs/USD)?')) {
      secureStorage.resetToDefault();
      const def = secureStorage.getParametros();
      setSalarioMinimo(def.salarioMinimoUrbano);
      setDiasUtilidades(def.diasUtilidadesCCP);
      setDiasBonoVacacional(def.diasBonoVacacionalCCP);
      setDiasVacacionesAnuales(def.diasVacacionesAnualesCCP);
      setDiasFiniquito(def.diasBonificacionFiniquitoCCP);
      setTasaUSD(def.tasaCambioBCV_USD);
      setTabulador(def.tabuladorCargos);
      setTasasBCV(def.tasasBCV);
      onUpdateParametros(def);
    }
  };

  const handleSyncBCV = async () => {
    const updatedParams = await onSyncLiveBCV();
    if (updatedParams) {
      setTasaUSD(updatedParams.tasaCambioBCV_USD);
      setTabulador(updatedParams.tabuladorCargos);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const handleUpdateSalarioCargo = (id: string, val: number) => {
    setTabulador((prev) =>
      prev.map((c) => (c.id === id ? { ...c, salarioBasicoDiario: val } : c))
    );
  };

  const handleAddCargo = () => {
    if (!newDenominacion.trim()) return;
    const item: TabuladorCargo = {
      id: `cargo-${Date.now()}`,
      codigo: newCodigo.trim() || `CCP-N${newNivel}`,
      denominacion: newDenominacion.trim().toUpperCase(),
      nivel: Number(newNivel),
      salarioBasicoDiario: Number(newSalario),
      categoria: 'Mantenimiento',
    };
    setTabulador([...tabulador, item]);
    setNewCodigo('');
    setNewDenominacion('');
    setNewSalario(350);
  };

  const handleDeleteCargo = (id: string) => {
    setTabulador(tabulador.filter((c) => c.id !== id));
  };

  const handleUpdateTasaBCV = (id: string, field: 'tasaActiva' | 'tasaPromedio', val: number) => {
    setTasasBCV((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: val } : t))
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header and save bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Parámetros Maestros y Tabuladores (Capa 1)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Configuración global de tasas del BCV, tabulador petrolero CCP y topes de ley
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restaurar Valores Oficiales</span>
          </button>

          <button
            type="button"
            onClick={handleSyncBCV}
            disabled={bcvSyncState.loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:bg-amber-400 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${bcvSyncState.loading ? 'animate-spin' : ''}`} />
            <span>{bcvSyncState.loading ? 'Actualizando BCV...' : 'Actualizar Tasa BCV (API)'}</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Parámetros</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Parámetros maestros actualizados (Tasa BCV: Bs. {formatBs(tasaUSD, 4)} / USD) y todos los expedientes recalculados satisfactoriamente.
            </span>
          </div>
          {bcvSyncState.lastSource && (
            <span className="text-2xs font-mono text-emerald-700">
              Fuente: {bcvSyncState.lastSource}
            </span>
          )}
        </div>
      )}

      {bcvSyncState.error && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg flex items-center gap-2 text-xs font-semibold text-red-900">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{bcvSyncState.error}</span>
        </div>
      )}

      {/* Global Macro Variables */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Scale className="w-4 h-4 text-blue-700" />
          <span>Variables Macro y Convención Colectiva Petrolera (CCP)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Salario Mínimo Urbano (Bs.):
            </label>
            <input
              type="number"
              step="0.01"
              value={salarioMinimo}
              onChange={(e) => setSalarioMinimo(parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
            <span className="text-2xs text-slate-500 mt-1 block font-mono">
              Tope 5 SM: Bs. {formatBs(salarioMinimo * 5)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Días Utilidades CCP:
            </label>
            <input
              type="number"
              value={diasUtilidades}
              onChange={(e) => setDiasUtilidades(parseInt(e.target.value) || 120)}
              className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
            <span className="text-2xs text-slate-500 mt-1 block">
              120 a 180 días garantizados
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Días Bono Vacacional CCP:
            </label>
            <input
              type="number"
              value={diasBonoVacacional}
              onChange={(e) => setDiasBonoVacacional(parseInt(e.target.value) || 55)}
              className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
            <span className="text-2xs text-slate-500 mt-1 block">
              45 a 60 días (55 habitual CCP)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vacaciones Anuales CCP (Días):
            </label>
            <input
              type="number"
              value={diasVacacionesAnuales}
              onChange={(e) => setDiasVacacionesAnuales(parseInt(e.target.value) || 34)}
              className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
            <span className="text-2xs text-slate-500 mt-1 block">
              34 días anuales según CCP
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bonif. Finiquito Obra (Días):
            </label>
            <input
              type="number"
              value={diasFiniquito}
              onChange={(e) => setDiasFiniquito(parseInt(e.target.value) || 15)}
              className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
            <span className="text-2xs text-slate-500 mt-1 block">
              Arts. 83 y 87 LOTTT / CCP
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tasa Oficial BCV (USD/Bs.):
            </label>
            <input
              type="number"
              step="0.0001"
              value={tasaUSD}
              onChange={(e) => setTasaUSD(parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-mono font-bold text-blue-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
            <span className="text-2xs text-slate-500 mt-1 block">
              Para visualización bimonetaria
            </span>
          </div>
        </div>
      </div>

      {/* Tabulador Petrolero CCP Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Tabulador Salarial Petrolero Homologado (Niveles y Cargos CCP)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Escala de salarios básicos diarios según niveles de calificación técnica y operativa
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-2xs">
              <tr>
                <th className="py-2.5 px-4 w-24">Código</th>
                <th className="py-2.5 px-4">Denominación del Cargo</th>
                <th className="py-2.5 px-4 text-center w-20">Nivel</th>
                <th className="py-2.5 px-4 text-center w-32">Categoría</th>
                <th className="py-2.5 px-4 text-right w-44">Salario Básico Diario (Bs.)</th>
                <th className="py-2.5 px-4 text-right w-16">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {tabulador.map((cargo) => (
                <tr key={cargo.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 text-slate-700 font-semibold">{cargo.codigo}</td>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                    {cargo.denominacion}
                  </td>
                  <td className="py-2.5 px-4 text-center text-slate-800">
                    Nivel {cargo.nivel}
                  </td>
                  <td className="py-2.5 px-4 text-center font-sans text-2xs text-slate-600">
                    {cargo.categoria}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={cargo.salarioBasicoDiario}
                      onChange={(e) => handleUpdateSalarioCargo(cargo.id, parseFloat(e.target.value) || 0)}
                      className="w-32 text-right border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-blue-900 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteCargo(cargo.id)}
                      title="Eliminar Cargo"
                      className="text-slate-400 hover:text-red-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add new cargo form row */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="text-2xs font-bold text-slate-700 uppercase mb-2">
            Agregar Nuevo Cargo al Tabulador:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Código (ej. CCP-N9)"
              value={newCodigo}
              onChange={(e) => setNewCodigo(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2.5 py-1.5 uppercase font-mono"
            />
            <input
              type="text"
              placeholder="Denominación del Cargo"
              value={newDenominacion}
              onChange={(e) => setNewDenominacion(e.target.value)}
              className="sm:col-span-2 text-xs border border-slate-300 rounded px-2.5 py-1.5 uppercase"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Nivel"
                min={1}
                max={10}
                value={newNivel}
                onChange={(e) => setNewNivel(parseInt(e.target.value) || 1)}
                className="w-20 text-xs border border-slate-300 rounded px-2 py-1.5 font-mono"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Salario Bs."
                value={newSalario}
                onChange={(e) => setNewSalario(parseFloat(e.target.value) || 0)}
                className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5 font-mono"
              />
            </div>
            <button
              onClick={handleAddCargo}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </div>
        </div>
      </div>

      {/* BCV Rates Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            Matriz Histórica de Tasas de Interés del Banco Central de Venezuela (BCV)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tasas fijadas mensualmente por el BCV para el cómputo de intereses de prestaciones sociales (Art. 143 LOTTT)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-2xs">
              <tr>
                <th className="py-2.5 px-4 w-56">Mes / Gaceta Oficial</th>
                <th className="py-2.5 px-4 text-right">Promedio Activa/Pasiva BCV (Art. 143 %)</th>
                <th className="py-2.5 px-4 text-right">Tasa Activa Ref. Mora (%)</th>
                <th className="py-2.5 px-4 text-center">Tasa Mensual Efectiva Art. 143</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {tasasBCV.map((tasa) => (
                <tr key={tasa.id} className="hover:bg-slate-50/70">
                  <td className="py-2 px-4 font-sans font-medium text-slate-800">
                    {tasa.mesNombre} ({tasa.mes})
                  </td>
                  <td className="py-2 px-4 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={tasa.tasaPromedio}
                      onChange={(e) =>
                        handleUpdateTasaBCV(tasa.id, 'tasaPromedio', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 text-right border border-slate-300 rounded px-2 py-0.5 text-xs font-mono font-bold text-blue-900 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                    />
                    <span className="text-slate-500 ml-1">%</span>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={tasa.tasaActiva}
                      onChange={(e) =>
                        handleUpdateTasaBCV(tasa.id, 'tasaActiva', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 text-right border border-slate-300 rounded px-2 py-0.5 text-xs font-mono text-slate-700 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                    />
                    <span className="text-slate-500 ml-1">%</span>
                  </td>
                  <td className="py-2 px-4 text-center text-emerald-700 font-semibold">
                    {(((tasa.tasaPromedio || tasa.tasaActiva) / 12)).toFixed(3)}% mensual
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
