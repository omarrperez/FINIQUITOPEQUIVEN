import React, { useState } from 'react';
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
  AlertCircle,
} from 'lucide-react';
import { ExpedienteLiquidacion } from '../types/settlement';
import { formatBs } from '../utils/calculator';
import { secureStorage } from '../db/secureStorage';

interface DatabaseViewProps {
  expedientes: ExpedienteLiquidacion[];
  onSelectExpediente: (expediente: ExpedienteLiquidacion) => void;
  onEditExpediente: (expediente: ExpedienteLiquidacion) => void;
  onNewSettlement: () => void;
  onReload: () => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  expedientes,
  onSelectExpediente,
  onEditExpediente,
  onNewSettlement,
  onReload,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

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
    link.setAttribute('download', `Liquidaciones_Pequiven_${new Date().toISOString().split('T')[0]}.csv`);
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Banner and Stats Strip */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Expedientes de Liquidación y Base de Datos
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Registro auditable de finiquitos homologados para contratistas de Pequiven y PDVSA
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
          <span className="text-2xs text-slate-400 mt-0.5 block">Conversión según tasa oficial</span>
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
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectExpediente(exp)}
                          title="Ver Recibo Oficial"
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          <FileText className="w-4 h-4" />
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
