import React, { useState } from 'react';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  Info,
  Calendar,
  DollarSign,
  Printer,
  FileCheck,
  Download,
  Loader2,
} from 'lucide-react';
import { ExpedienteLiquidacion, ParametrosMaestros } from '../types/settlement';
import { formatBs, round2 } from '../utils/calculator';
import { generateCanvasPDF, openPrintableWindow } from '../utils/pdfExport';

interface MoraAuditViewProps {
  expedientes: ExpedienteLiquidacion[];
  parametros: ParametrosMaestros;
}

export const MoraAuditView: React.FC<MoraAuditViewProps> = ({
  expedientes,
  parametros,
}) => {
  const [selectedExpId, setSelectedExpId] = useState<string>(
    expedientes[0]?.id || ''
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const selectedExp = expedientes.find((e) => e.id === selectedExpId) || expedientes[0];

  const [fechaEgreso, setFechaEgreso] = useState<string>(
    selectedExp?.trabajador.fechaEgreso || '2026-11-11'
  );
  const [fechaPago, setFechaPago] = useState<string>(
    selectedExp?.trabajador.fechaPuestaDisposicion || '2026-11-20'
  );

  // When selected expediente changes, update dates
  const handleSelectExpediente = (id: string) => {
    setSelectedExpId(id);
    const exp = expedientes.find((e) => e.id === id);
    if (exp) {
      setFechaEgreso(exp.trabajador.fechaEgreso);
      setFechaPago(exp.trabajador.fechaPuestaDisposicion || exp.trabajador.fechaEgreso);
    }
  };

  // Compute mora metrics
  const dEgreso = new Date(fechaEgreso + 'T00:00:00');
  const dPago = new Date(fechaPago + 'T00:00:00');
  const diasTranscurridos = isNaN(dEgreso.getTime()) || isNaN(dPago.getTime()) || dPago <= dEgreso
    ? 0
    : Math.floor((dPago.getTime() - dEgreso.getTime()) / (1000 * 60 * 60 * 24));

  // LOTTT grants 5 continuous days to pay
  const diasGracia = 5;
  const diasMoraEfectiva = Math.max(0, diasTranscurridos - diasGracia);

  const netoBase = selectedExp?.calculo.netoAPagar || 119035.80;
  const salarioNormalDiario = selectedExp?.calculo.salarioNormalDiario || 520.0;

  // 1. Legal Contractor Moratory Interest (LOTTT Art. 143 / CRBV Art. 92)
  const tasaActivaBCV = 35.90;
  const tasaDiaria = (tasaActivaBCV / 100) / 360;
  const interesMoratorioLegal = round2(netoBase * tasaDiaria * diasMoraEfectiva);

  // 2. Punitive Sanction for direct PDVSA employees (3 daily salaries per day of delay)
  const reclamoErroneo3SalariosPDVSA = round2(3 * salarioNormalDiario * diasMoraEfectiva);

  // Difference / Contratista Protection Amount
  const contingenciaPrevenida = round2(reclamoErroneo3SalariosPDVSA - interesMoratorioLegal);

  const handleDownloadAuditPDF = async () => {
    setIsGeneratingPDF(true);
    await generateCanvasPDF(
      'printable-audit-container',
      `Dictamen_Mora_${selectedExp?.numeroExpediente || 'Audit'}.pdf`
    );
    setIsGeneratingPDF(false);
  };

  const handlePrintAudit = () => {
    openPrintableWindow('printable-audit-container');
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Módulo de Auditoría Temporal de Mora (Doctrina Sandrea Pozo 2017)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Trazabilidad jurídica y blindaje de contratistas ante exigencias improcedentes de penas convencionales
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAuditPDF}
            disabled={isGeneratingPDF}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors shadow-2xs"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isGeneratingPDF ? 'Generando PDF...' : 'Exportar Dictamen PDF'}</span>
          </button>

          <button
            onClick={handlePrintAudit}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Dictamen</span>
          </button>
        </div>
      </div>

      {/* Doctrinal Context Card */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 text-xs text-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
          <Info className="w-4 h-4 text-blue-700 shrink-0" />
          <span>Fundamento Jurídico e Investigaciones de Sandrea Pozo (2017)</span>
        </div>
        <p className="leading-relaxed">
          Las investigaciones doctrinales de <strong>Sandrea Pozo (2017)</strong> analizan la bifurcación procedimental en la Convención Colectiva Petrolera (CCP): mientras para la <em>nómina directa de PDVSA</em> se estatuye una penalización de <strong>3 salarios normales diarios</strong> por cada día de mora, para el personal de <strong>empresas contratistas y subcontratistas</strong> la mora se rige de forma estricta por los <strong>intereses moratorios de la LOTTT (Art. 143) y el Art. 92 de la Constitución de la República Bolivariana de Venezuela</strong>.
        </p>
        <p className="leading-relaxed text-slate-600">
          Este módulo audita la fecha exacta de culminación del contrato frente a la fecha de consignación de fondos, emitiendo un cálculo que previene reclamos judiciales inflados o sanciones no estipuladas contractualmente.
        </p>
      </div>

      {/* Selector of Expediente & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
          Parámetros de Evaluación del Caso
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Seleccionar Expediente:
            </label>
            <select
              value={selectedExpId}
              onChange={(e) => handleSelectExpediente(e.target.value)}
              className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            >
              {expedientes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.numeroExpediente} · {e.trabajador.nombres} {e.trabajador.apellidos} ({e.trabajador.cedula})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha de Egreso (Fin de Obra):
            </label>
            <input
              type="date"
              value={fechaEgreso}
              onChange={(e) => setFechaEgreso(e.target.value)}
              className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha de Puesta a Disposición de Fondos:
            </label>
            <input
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Audit Metrics Output Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Trazabilidad Cronológica</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {diasTranscurridos} Días
          </div>
          <div className="text-xs text-slate-600 mt-2 space-y-0.5">
            <div>Lapso de gracia legal (LOTTT): <span className="font-mono font-semibold">5 días</span></div>
            <div>Días computables en mora: <span className="font-mono font-bold text-red-600">{diasMoraEfectiva} días</span></div>
          </div>
        </div>

        <div className="bg-white border-2 border-emerald-500 rounded-xl p-5 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900 uppercase">
              Régimen Legal Contratista (LOTTT 143)
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            Bs. {formatBs(interesMoratorioLegal)}
          </div>
          <div className="text-2xs text-slate-600 mt-2">
            Interés moratorio tasado al {tasaActivaBCV}% anual del BCV sobre el neto de finiquito. Este es el pasivo legal exigible.
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Riesgo Nómina Directa PDVSA (3 salarios)
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-700 mt-1">
            Bs. {formatBs(reclamoErroneo3SalariosPDVSA)}
          </div>
          <div className="text-2xs text-slate-500 mt-2">
            Pretensión improcedente en contratistas según Sandrea Pozo (2017). Contingencia neutralizada: <strong className="text-emerald-700 font-mono">Bs. {formatBs(contingenciaPrevenida)}</strong>.
          </div>
        </div>
      </div>

      {/* Official Audit Certificate Container for Printing */}
      <div
        id="printable-audit-container"
        className="bg-white border border-slate-300 rounded-xl p-8 shadow-xs space-y-4 printable-area"
      >
        <div className="border-b-2 border-slate-900 pb-3 text-center">
          <span className="text-xs font-mono text-slate-500 block uppercase">
            Dictamen Laboral de Trazabilidad Cronológica de Pagos
          </span>
          <h3 className="text-lg font-bold uppercase text-slate-900 mt-0.5">
            Certificación de Inaplicabilidad de Sanción Punitiva PDVSA y Liquidación de Intereses de Mora
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Expediente: <span className="font-mono font-semibold">{selectedExp?.numeroExpediente}</span> · Contrato N° {selectedExp?.contratista.numeroContrato}
          </p>
        </div>

        <div className="text-xs leading-relaxed text-slate-800 space-y-3">
          <p>
            En la ciudad de Caracas / Maracaibo / Morón, a los efectos de ser presentado ante la <strong>Gerencia de Relaciones Laborales de Pequiven / PDVSA</strong> y la <strong>Inspectoría del Trabajo (MINTRA)</strong>, se deja constancia técnica y jurídica de lo siguiente:
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs font-mono">
            <div>
              <span className="text-slate-500 block">Trabajador:</span>
              <span className="font-bold text-slate-900">{selectedExp?.trabajador.nombres} {selectedExp?.trabajador.apellidos}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Cédula:</span>
              <span className="font-bold text-slate-900">{selectedExp?.trabajador.cedula}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Fecha de Egreso:</span>
              <span className="font-bold text-slate-900">{fechaEgreso}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Puesta a Disposición:</span>
              <span className="font-bold text-slate-900">{fechaPago}</span>
            </div>
          </div>

          <p>
            1. <strong>Cómputo de Plazos:</strong> Entre la fecha de egreso y la puesta a disposición formal de la liquidación transcurrieron <strong>{diasTranscurridos} días continuos</strong>. Descontado el término legal de 5 días de gracia conforme a la LOTTT, se configuran <strong>{diasMoraEfectiva} días de mora efectiva</strong>.
          </p>

          <p>
            2. <strong>Régimen Aplicable a Contratistas:</strong> Conforme al criterio doctrinal unánime sustentado en las investigaciones de <em>Sandrea Pozo (2017)</em> y la jurisprudencia de la Sala de Casación Social del Tribunal Supremo de Justicia, la sanción de tres (3) salarios normales diarios por cada día de mora corresponde con exclusividad al personal directo de la casa matriz petrolera (PDVSA) y no resulta extrapolable al personal de empresas contratistas independientes salvo pacto expreso en el contrato de obra.
          </p>

          <p>
            3. <strong>Determinación del Pasivo Moratorio:</strong> El único pasivo legal exigible a la empresa contratista corresponde a los intereses moratorios calculados a la tasa activa fijada por el Banco Central de Venezuela (BCV), equivalente a la cantidad de <strong>Bs. {formatBs(interesMoratorioLegal)}</strong>, quedando plenamente salvaguardada la responsabilidad patronal y extinguidas las contingencias litigiosas.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="border-b border-slate-900 pb-1 mb-2"></div>
            <span className="font-bold text-slate-900 uppercase block">Auditoría de Relaciones Laborales</span>
            <span className="text-2xs text-slate-500">Contratista Petrolera Pequiven</span>
          </div>
          <div>
            <div className="border-b border-slate-900 pb-1 mb-2"></div>
            <span className="font-bold text-slate-900 uppercase block">Consultoría Jurídica Laboral</span>
            <span className="text-2xs text-slate-500">Dictamen Conforme Sandrea Pozo (2017)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
