import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  FileText,
  Trash2,
  Copy,
  Download,
  Upload,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  Briefcase,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
} from 'lucide-react';
import { ExpedienteLiquidacion, ParametrosMaestros } from '../types/settlement';
import { formatBs } from '../utils/calculator';
import { secureStorage } from '../db/secureStorage';
import { exportOfficialPDF } from '../utils/pdfExport';
import { exportOfficialWord } from '../utils/wordExport';
import { BCVSyncState } from '../utils/bcvService';

interface DatabaseViewProps {
  expedientes: ExpedienteLiquidacion[];
  parametros: ParametrosMaestros;
  onSelectExpediente: (expediente: ExpedienteLiquidacion) => void;
  onEditExpediente: (expediente: ExpedienteLiquidacion) => void;
  onNewSettlement: () => void;
  onReload: () => void;
  onSyncLiveBCV: () => Promise<ParametrosMaestros | null>;
  onApplyManualBCV: (nuevaTasa: number) => ParametrosMaestros | null;
  bcvSyncState: BCVSyncState;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  expedientes,
  parametros,
  onSelectExpediente,
  onEditExpediente,
  onNewSettlement,
  onReload,
  onSyncLiveBCV,
  onApplyManualBCV,
  bcvSyncState,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [recalcSuccess, setRecalcSuccess] = useState(false);
  const [downloadingHTML, setDownloadingHTML] = useState(false);
  const [htmlDownloadError, setHtmlDownloadError] = useState<string | null>(null);
  const [manualRateInput, setManualRateInput] = useState<string>(
    String(parametros.tasaCambioBCV_USD)
  );

  useEffect(() => {
    setManualRateInput(String(parametros.tasaCambioBCV_USD));
  }, [parametros.tasaCambioBCV_USD]);

  // Filtered expedientes
  const filtered = expedientes.filter((exp) => {
    const matchesSearch =
      exp.trabajador.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.trabajador.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.trabajador.cedula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.numeroExpediente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.contratista.razonSocial.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || exp.estado === statusFilter;
    const matchesCompany = companyFilter === 'all' || exp.contratista.id === companyFilter;

    return matchesSearch && matchesStatus && matchesCompany;
  });

  // Calculate totals
  const totalBs = expedientes.reduce((acc, curr) => acc + curr.calculo.netoAPagar, 0);
  const totalUSD = expedientes.reduce((acc, curr) => acc + curr.calculo.netoEquivalenteUSD, 0);

  // Get unique contractors
  const uniqueCompanies = Array.from(
    new Set(expedientes.map((e) => JSON.stringify({ id: e.contratista.id, name: e.contratista.razonSocial })))
  ).map((str) => JSON.parse(str));

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Está seguro de eliminar este expediente de liquidación de la base de datos segura?')) {
      secureStorage.deleteExpediente(id);
      onReload();
    }
  };

  const handleDuplicate = (exp: ExpedienteLiquidacion, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: ExpedienteLiquidacion = {
      ...exp,
      id: `exp-${Date.now()}`,
      numeroExpediente: `LIQ-PEQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
      estado: 'Borrador',
    };
    secureStorage.saveExpediente(duplicated);
    onReload();
  };

  const handleExportCSV = () => {
    const headers = [
      'N° Expediente',
      'Fecha Emisión',
      'Contratista',
      'RIF',
      'N° Contrato',
      'Cédula',
      'Trabajador',
      'Cargo CCP',
      'Fecha Ingreso',
      'Fecha Egreso',
      'Tiempo Servicio',
      'Régimen Aplicado Art 142',
      'Total Asignaciones (Bs)',
      'Total Deducciones (Bs)',
      'Neto Pagado (Bs)',
      'Equiv USD',
      'Estado',
    ];

    const rows = expedientes.map((e) => [
      e.numeroExpediente,
      e.fechaCreacion.split('T')[0],
      `"${e.contratista.razonSocial}"`,
      e.contratista.rif,
      e.contratista.numeroContrato,
      e.trabajador.cedula,
      `"${e.trabajador.nombres} ${e.trabajador.apellidos}"`,
      `"${e.trabajador.cargoNombre}"`,
      e.trabajador.fechaIngreso,
      e.trabajador.fechaEgreso,
      `"${e.calculo.tiempoServicio.anos}A ${e.calculo.tiempoServicio.meses}M ${e.calculo.tiempoServicio.dias}D"`,
      `"${e.calculo.seleccionFavorable.metodoAplicado}"`,
      e.calculo.totalAsignaciones,
      e.calculo.deducciones.totalDeducciones,
      e.calculo.netoAPagar,
      e.calculo.netoEquivalenteUSD,
      e.estado,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Liquidaciones_CRISBAORCA_2009_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const jsonStr = secureStorage.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PetroFiniquito_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) return;
    const ok = secureStorage.importBackup(importText);
    if (ok) {
      setImportStatus('success');
      setTimeout(() => {
        setShowBackupModal(false);
        setImportStatus(null);
        setImportText('');
        onReload();
      }, 1200);
    } else {
      setImportStatus('error');
    }
  };

  const handleApplyManualRate = () => {
    const parsed = parseFloat(manualRateInput.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onApplyManualBCV(parsed);
    setRecalcSuccess(true);
    setTimeout(() => setRecalcSuccess(false), 3500);
  };

  const handleRecalculateAll = () => {
    const parsed = parseFloat(manualRateInput.replace(',', '.'));
    if (
      Number.isFinite(parsed) &&
      parsed > 0 &&
      Math.abs(parsed - parametros.tasaCambioBCV_USD) > 0.00001
    ) {
      onApplyManualBCV(parsed);
    } else {
      secureStorage.recalcularTodosExpedientes(parametros);
      onReload();
    }
    setRecalcSuccess(true);
    setTimeout(() => setRecalcSuccess(false), 3500);
  };

  const handleDownloadPortableHTML = async () => {
    setDownloadingHTML(true);
    setHtmlDownloadError(null);
    try {
      const response = await fetch(`/PetroFiniquito_CRISBAORCA_2009.html?v=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('No se pudo obtener el archivo HTML portable del servidor.');
      }
      const htmlText = await response.text();
      const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'PetroFiniquito_CRISBAORCA_2009.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (err) {
      console.error('Error downloading portable HTML:', err);
      setHtmlDownloadError(
        'No se pudo iniciar la descarga automática. Puede abrir la URL de la app terminada en /PetroFiniquito_CRISBAORCA_2009.html y guardarla con Ctrl+S.'
      );
    } finally {
      setDownloadingHTML(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Banner and Stats Strip */}
      <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Expedientes de Liquidación y Base de Datos
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Registro auditable de finiquitos laborales de CRISBAORCA 2009, C.A. (RIF J-29711947-7)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {typeof window !== 'undefined' && window.location.protocol !== 'file:' && (
            <button
              onClick={handleDownloadPortableHTML}
              disabled={downloadingHTML}
              title="Descargar la aplicación completa en un solo archivo HTML portable para enviar por Gmail y abrir en Chrome, Edge u Opera"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 disabled:bg-indigo-400 transition-colors shadow-xs cursor-pointer"
            >
              {downloadingHTML ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
              <span>{downloadingHTML ? 'Descargando HTML...' : 'Descargar HTML Portable (Gmail)'}</span>
            </button>
          )}

          <button
            onClick={() => setShowBackupModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Copia de Seguridad / JSON</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onNewSettlement}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Liquidación</span>
          </button>
        </div>
      </div>

      {/* Prominent BCV & Mass Recalculation Control Bar */}
      <div className="mb-6 p-4 bg-white border-2 border-slate-200 rounded-xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Actualización de Tasa BCV y Recálculo Masivo de Finiquitos
            </h2>
            <p className="text-xs text-slate-600">
              Tasa BCV activa: <strong className="font-mono text-slate-900">Bs. {formatBs(parametros.tasaCambioBCV_USD, 4)} / USD</strong> · Recalcula automáticamente los {expedientes.length} expedientes con LOTTT, CCP, IVSS/SPF y Art. 143.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
            <span className="text-2xs font-semibold text-slate-600 whitespace-nowrap">
              Tasa BCV:
            </span>
            <input
              type="number"
              step="0.0001"
              value={manualRateInput}
              onChange={(e) => setManualRateInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyManualRate();
              }}
              aria-label="Tasa BCV manual en Bolívares por Dólar"
              className="w-24 text-sm font-mono font-bold text-blue-900 bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleApplyManualRate}
              title="Aplicar esta tasa manual y recalcular los 5 finiquitos al instante"
              className="px-2.5 py-1 text-xs font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 rounded transition-colors cursor-pointer"
            >
              Aplicar
            </button>
          </div>

          <button
            type="button"
            onClick={onSyncLiveBCV}
            disabled={bcvSyncState.loading}
            title="Consultar el precio oficial del Dólar BCV del día en tiempo real (API) y recalcular todos los finiquitos"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:bg-amber-400 transition-colors shadow-sm cursor-pointer"
          >
            {bcvSyncState.loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <DollarSign className="w-4 h-4" />
            )}
            <span>
              {bcvSyncState.loading
                ? 'Actualizando BCV...'
                : 'Actualizar Tasa BCV (API)'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleRecalculateAll}
            title="Recalcular todos los finiquitos de CRISBAORCA 2009, C.A. con los parámetros y tasa BCV vigentes"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-[0.99] transition-all shadow-sm ring-2 ring-emerald-600/20 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recalcular Todos ({expedientes.length})</span>
          </button>
        </div>
      </div>

      {/* Recalculation & Live BCV Sync Feedback Banners */}
      {recalcSuccess && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-950 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>¡Recálculo completado!</strong> Todos los finiquitos ({expedientes.length} expedientes de CRISBAORCA 2009, C.A.) fueron recalculados con la tasa oficial de{' '}
            <strong className="font-mono">Bs. {formatBs(parametros.tasaCambioBCV_USD, 4)} / USD</strong>.
          </span>
        </div>
      )}

      {bcvSyncState.lastSyncedRate && !bcvSyncState.error && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Tasa Dólar BCV del Día aplicada:</strong> Bs.{' '}
              <span className="font-mono font-bold">{formatBs(bcvSyncState.lastSyncedRate, 4)}</span> / USD ·{' '}
              Todos los finiquitos de CRISBAORCA 2009, C.A. ({expedientes.length} expedientes) fueron recalculados automáticamente.
            </span>
          </div>
          <span className="text-2xs font-mono text-emerald-800 shrink-0">
            Fuente: {bcvSyncState.lastSource} · Verificado: {new Date().toLocaleTimeString('es-VE')}
          </span>
        </div>
      )}

      {bcvSyncState.error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-300 rounded-xl flex items-center gap-2 text-xs text-red-900 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>
            <strong>Error al consultar API BCV:</strong> {bcvSyncState.error} Puede ajustar la tasa manualmente en Parámetros Maestros.
          </span>
        </div>
      )}

      {htmlDownloadError && (
        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2 text-xs text-amber-950 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{htmlDownloadError}</span>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Total Liquidaciones Procesadas</span>
          <span className="text-2xl font-bold text-slate-900 font-mono mt-1 block">
            {expedientes.length}
          </span>
          <span className="text-2xs text-slate-400 mt-0.5 block">Expedientes archivados</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Monto Total Liquidado (Bolívares)</span>
          <span className="text-2xl font-bold text-blue-900 font-mono mt-1 block">
            Bs. {formatBs(totalBs)}
          </span>
          <span className="text-2xs text-emerald-600 font-medium mt-0.5 block">
            Auditado bajo Art. 142 LOTTT
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Equivalente Divisas (Ref. BCV)</span>
          <span className="text-2xl font-bold text-slate-800 font-mono mt-1 block">
            USD ${formatBs(totalUSD)}
          </span>
          <span className="text-2xs text-slate-500 mt-0.5 block font-mono">
            Tasa oficial activa: {formatBs(parametros.tasaCambioBCV_USD, 4)} Bs./USD
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cédula, nombre o contrato..."
            className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          >
            <option value="all">Todas las Contratistas</option>
            {uniqueCompanies.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          >
            <option value="all">Todos los Estados</option>
            <option value="Auditado por Relaciones Laborales">Auditado</option>
            <option value="Finiquitado y Pagado">Finiquitado y Pagado</option>
            <option value="Borrador">Borrador</option>
          </select>
        </div>
      </div>

      {/* Table of Settlements */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-2xs tracking-wider">
              <tr>
                <th className="py-3 px-4">Expediente</th>
                <th className="py-3 px-4">Trabajador</th>
                <th className="py-3 px-4">Cargo CCP & Nivel</th>
                <th className="py-3 px-4">Empresa Contratista</th>
                <th className="py-3 px-4 text-center">Tiempo Servicio</th>
                <th className="py-3 px-4 text-right">Neto a Pagar</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No se encontraron expedientes que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filtered.map((exp) => (
                  <tr
                    key={exp.id}
                    onClick={() => onSelectExpediente(exp)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {exp.numeroExpediente}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block uppercase">
                        {exp.trabajador.nombres} {exp.trabajador.apellidos}
                      </span>
                      <span className="text-2xs font-mono text-slate-500">
                        {exp.trabajador.cedula}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-medium block">{exp.trabajador.cargoNombre}</span>
                      <span className="text-2xs text-slate-500">
                        Guardia {exp.trabajador.turnoGuardia} · Básico: Bs. {formatBs(exp.calculo.salarioBasicoDiario)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-semibold block truncate max-w-xs">
                        {exp.contratista.razonSocial}
                      </span>
                      <span className="text-2xs text-slate-500 font-mono">
                        Contrato: {exp.contratista.numeroContrato}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono">
                      <span className="font-semibold text-slate-800">
                        {exp.calculo.tiempoServicio.anos}A {exp.calculo.tiempoServicio.meses}M {exp.calculo.tiempoServicio.dias}D
                      </span>
                      <span className="text-3xs text-slate-400 block">
                        {exp.calculo.tiempoServicio.totalDias} días
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-900 text-sm">
                      Bs. {formatBs(exp.calculo.netoAPagar)}
                      <span className="text-3xs text-slate-400 font-normal block">
                        USD ${formatBs(exp.calculo.netoEquivalenteUSD)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded ${
                          exp.estado === 'Finiquitado y Pagado'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : exp.estado === 'Auditado por Relaciones Laborales'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {exp.estado}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectExpediente(exp)}
                          title="Ver Recibo Oficial"
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => exportOfficialWord(exp)}
                          title="Exportar Finiquito a Word (.doc)"
                          className="px-1.5 py-1 text-2xs font-bold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded transition-colors"
                        >
                          Word
                        </button>

                        <button
                          onClick={() => exportOfficialPDF(exp)}
                          title="Exportar Finiquito a PDF (.pdf)"
                          className="px-1.5 py-1 text-2xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded transition-colors"
                        >
                          PDF
                        </button>

                        <button
                          onClick={() => onEditExpediente(exp)}
                          title="Editar en Asistente"
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Briefcase className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => handleDuplicate(exp, e)}
                          title="Duplicar Caso"
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => handleDelete(exp.id, e)}
                          title="Eliminar Expediente"
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backup and Restore Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Copia de Seguridad y Restauración Segura
              </h3>
              <button
                onClick={() => setShowBackupModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Descargue un respaldo completo en formato JSON cifrado/estructurado con todas las contratistas, tabuladores, tasas y expedientes calculados para archivado o auditorías externas.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDownloadJSON}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Archivo JSON</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Restaurar o Importar Respaldo JSON:
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Pegue aquí el contenido del archivo JSON de respaldo..."
                rows={4}
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />

              {importStatus === 'success' && (
                <div className="mt-2 text-xs text-emerald-700 font-semibold">
                  ✓ Base de datos restaurada satisfactoriamente.
                </div>
              )}
              {importStatus === 'error' && (
                <div className="mt-2 text-xs text-red-700 font-semibold">
                  ✗ Formato JSON no válido o corrupto.
                </div>
              )}

              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => setShowBackupModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImportSubmit}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Procesar Importación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
