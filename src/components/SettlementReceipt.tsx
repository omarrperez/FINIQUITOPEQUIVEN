import React, { useState, useEffect } from 'react';
import {
  Printer,
  Copy,
  Check,
  ArrowLeft,
  ShieldCheck,
  FileText,
  DollarSign,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ExpedienteLiquidacion, ParametrosMaestros } from '../types/settlement';
import { formatBs } from '../utils/calculator';
import {
  exportOfficialPDF,
  openPrintableWindow,
  generateCanvasPDF,
} from '../utils/pdfExport';
import { exportOfficialWord } from '../utils/wordExport';
import { BCVSyncState } from '../utils/bcvService';

interface SettlementReceiptProps {
  expediente: ExpedienteLiquidacion;
  onBack: () => void;
  onEdit: () => void;
  onSyncLiveBCV: () => Promise<ParametrosMaestros | null>;
  bcvSyncState: BCVSyncState;
  isPreviewMode: boolean;
  onTogglePreviewMode: () => void;
}

export const SettlementReceipt: React.FC<SettlementReceiptProps> = ({
  expediente,
  onBack,
  onEdit,
  onSyncLiveBCV,
  bcvSyncState,
  isPreviewMode,
  onTogglePreviewMode,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const { contratista, trabajador, calculo } = expediente;

  useEffect(() => {
    if (!isPreviewMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onTogglePreviewMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewMode, onTogglePreviewMode]);

  const pdfFilename = `Recibo_${expediente.numeroExpediente}_${trabajador.cedula}.pdf`;

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const ok = exportOfficialPDF(expediente);
      if (!ok) {
        await generateCanvasPDF('printable-receipt-container', pdfFilename);
      }
    } catch (e) {
      console.error('PDF export error:', e);
      await generateCanvasPDF('printable-receipt-container', pdfFilename);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadWord = () => {
    setIsGeneratingWord(true);
    try {
      exportOfficialWord(expediente);
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const handlePrint = () => {
    openPrintableWindow('printable-receipt-container');
  };

  const getPlainTextReceipt = () => {
    return `===================================================================================================
                             ${contratista.razonSocial}
                                        RIF: ${contratista.rif}
                         DIRECCIÓN: ${contratista.direccion || 'AV. VIA HOSPITAL RASETTI, BARCELONA, ANZOATEGUI'}
                             CONTRATO / OBRA: ${contratista.numeroContrato}
                       OBRA: ${contratista.obraServicio}
===================================================================================================
                                LIQUIDACIÓN DE PRESTACIONES SOCIALES
                                POR CULMINACIÓN DE CONTRATO LABORAL
===================================================================================================
DATOS DEL TRABAJADOR:
Trabajador: ${trabajador.nombres} ${trabajador.apellidos}             C.I.: ${trabajador.cedula}
Cargo: ${trabajador.cargoNombre}
Fecha de Ingreso: ${trabajador.fechaIngreso}                        Fecha de Egreso: ${trabajador.fechaEgreso}
Tiempo de Servicio: ${calculo.tiempoServicio.anos} Años, ${calculo.tiempoServicio.meses} Meses, ${calculo.tiempoServicio.dias} Días        Causa de Egreso: ${trabajador.causaEgreso}

BASES SALARIALES DE CÁLCULO:
Salario Básico Diario: Bs. ${formatBs(calculo.salarioBasicoDiario)}                   Salario Normal Diario: Bs. ${formatBs(calculo.salarioNormalDiario)} (Inc. Tiempo Viaje)
Días de Utilidades Anuales CCP: ${expediente.parametrosSnapshot.diasUtilidadesCCP} días            Alícuota Diaria Utilidades: Bs. ${formatBs(calculo.alicuotaUtilidadesDiaria)}
Días Bono Vacacional CCP: ${expediente.parametrosSnapshot.diasBonoVacacionalCCP} días                   Alícuota Diaria Bono Vacacional: Bs. ${formatBs(calculo.alicuotaBonoVacacionalDiaria)}
Salario Integral Diario para Prestaciones: Bs. ${formatBs(calculo.salarioIntegralDiario)}
===================================================================================================
CÓD.  CONCEPTOS DE ASIGNACIONES (HABERES)                BASE / DÍAS        VALOR UNIT.      TOTAL (Bs.)
---------------------------------------------------------------------------------------------------
101   Prestaciones Sociales (${calculo.seleccionFavorable.metodoAplicado})   ${formatBs(calculo.garantiaTrimestral.diasTotalesGarantia)} Días         ${formatBs(calculo.salarioIntegralDiario)}         ${formatBs(calculo.seleccionFavorable.montoPrestacionesAplicado)}
      [Comparativa Retroactividad Art. 142-c: ${calculo.retroactividad.diasAntiguedad} Días x ${formatBs(calculo.salarioIntegralDiario)} = Bs. ${formatBs(calculo.retroactividad.montoRetroactividad)} -> Aplica ${calculo.seleccionFavorable.metodoAplicado}]
102   Intereses s/ Prestaciones Sociales (Art. 143 LOTTT) Saldo Acum.       Tasas BCV        ${formatBs(calculo.garantiaTrimestral.interesesAcumuladosArt143)}
103   Vacaciones Fraccionadas (Art. 190 LOTTT / CCP)      ${formatBs(calculo.vacacionesFraccionadas.dias)} Días         ${formatBs(calculo.vacacionesFraccionadas.valorUnitario)}          ${formatBs(calculo.vacacionesFraccionadas.total)}
104   Bono Vacacional Fraccionado (Art. 192 LOTTT / CCP)  ${formatBs(calculo.bonoVacacionalFraccionado.dias)} Días         ${formatBs(calculo.bonoVacacionalFraccionado.valorUnitario)}         ${formatBs(calculo.bonoVacacionalFraccionado.total)}
105   Utilidades Fraccionadas (Art. 131 LOTTT / CCP)     ${formatBs(calculo.utilidadesFraccionadas.dias)} Días         ${formatBs(calculo.utilidadesFraccionadas.valorUnitario)}         ${formatBs(calculo.utilidadesFraccionadas.total)}
106   Bonificación Especial Culminación Contrato CCP      ${formatBs(calculo.bonificacionEspecialFiniquitoCCP.dias)} Días         ${formatBs(calculo.bonificacionEspecialFiniquitoCCP.valorUnitario)}          ${formatBs(calculo.bonificacionEspecialFiniquitoCCP.total)}
${calculo.indemnizacionDespidoArt92?.aplica ? `107   Indemnización Despido Injustificado (Art. 92 LOTTT) 100% Prest.        ${formatBs(calculo.seleccionFavorable.montoPrestacionesAplicado)}         ${formatBs(calculo.indemnizacionDespidoArt92.monto)}\n` : ''}---------------------------------------------------------------------------------------------------
TOTAL ASIGNACIONES:                                                                   Bs. ${formatBs(calculo.totalAsignaciones)}
===================================================================================================
CÓD.  CONCEPTOS DE DEDUCCIONES DE LEY                     PORCENTAJE / BASE                  TOTAL (Bs.)
---------------------------------------------------------------------------------------------------
501   Retención IVSS Seguro Social (4% s/ Salario Normal) 4,00% (${calculo.deducciones.ivss.semanasCotizadas || 4} lun × Bs. ${formatBs((calculo.deducciones.ivss.baseSemanal || 150) * 0.04)})   ${formatBs(calculo.deducciones.ivss.total)}
502   Retención Régimen Prestacional Empleo (0.5% SPF)    0,50% (${calculo.deducciones.spf.semanasCotizadas || 4} lun × Bs. ${formatBs((calculo.deducciones.spf.baseSemanal || 150) * 0.005)})   ${formatBs(calculo.deducciones.spf.total)}
503   Retención FAOV / BANAVIH (1% s/ Asignaciones Base)  1,00%                              ${formatBs(calculo.deducciones.faov.total)}
504   Retención INCES s/ Utilidades Fraccionadas (0.5%)   0,50% s/ Bs. ${formatBs(calculo.deducciones.inces.baseUtilidades)}               ${formatBs(calculo.deducciones.inces.total)}
505   Anticipos de Prestaciones Sociales Otorgados        Monto pagado previamente               ${formatBs(calculo.deducciones.anticipos)}
---------------------------------------------------------------------------------------------------
TOTAL DEDUCCIONES:                                                                      Bs. ${formatBs(calculo.deducciones.totalDeducciones)}
===================================================================================================
NETO TOTAL A LIQUIDAR Y PAGAR AL TRABAJADOR:                                          Bs. ${formatBs(calculo.netoAPagar)}
REF. BCV: USD $${formatBs(calculo.netoEquivalenteUSD)} @ ${formatBs(expediente.parametrosSnapshot.tasaCambioBCV_USD, 4)} Bs/USD
===================================================================================================
SON: ${calculo.netoEnLetras}

DECLARACIÓN DE FINIQUITO Y CONFORMIDAD:
Yo, ${trabajador.nombres} ${trabajador.apellidos}, titular de la Cédula de Identidad N° ${trabajador.cedula}, declaro que he
recibido de la empresa ${contratista.razonSocial}, RIF ${contratista.rif}, con domicilio en ${contratista.direccion || 'AV. VIA HOSPITAL RASETTI, BARCELONA, ANZOATEGUI'}, a mi entera satisfacción, la cantidad
de Bs. ${formatBs(calculo.netoAPagar)} por concepto de pago total y definitivo de mis Prestaciones Sociales, Intereses,
Vacaciones Fraccionadas, Bono Vacacional Fraccionado, Utilidades Fraccionadas y demás beneficios
contractuales derivados de la culminación de mi contrato de trabajo por obra determinada al servicio de
la industria petrolera. Declaro que nada se me adeuda por concepto salarial ni indemnizatorio alguno.


____________________________________                  ____________________________________
    POR LA EMPRESA CONTRATISTA                                EL TRABAJADOR
           C.I. / Sello                                    C.I. ${trabajador.cedula}
                                                           Huella Dactilar: [  Pulgar Der.  ]`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getPlainTextReceipt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={isPreviewMode ? 'max-w-4xl mx-auto py-8 px-4 print:p-0 print:max-w-none' : 'max-w-5xl mx-auto py-6 px-4 sm:px-6'}>
      {/* Floating minimal controls shown ONLY in Vista Previa mode (hidden when printing) */}
      {isPreviewMode && (
        <div className="fixed bottom-5 right-5 z-50 print-hide flex flex-wrap items-center gap-2 bg-slate-900/95 text-white px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700">
          <button
            onClick={handleDownloadWord}
            disabled={isGeneratingWord}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-sky-700 hover:bg-sky-600 disabled:bg-sky-400 rounded-lg transition-colors cursor-pointer"
          >
            {isGeneratingWord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Word</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 rounded-lg transition-colors cursor-pointer"
          >
            {isGeneratingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={onTogglePreviewMode}
            title="Salir de Vista Previa (Esc)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors cursor-pointer"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Salir Vista Previa</span>
          </button>
        </div>
      )}

      {/* Top action toolbar - hidden in Vista Previa and during print */}
      {!isPreviewMode && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 print-hide">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la lista</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onSyncLiveBCV}
              disabled={bcvSyncState.loading}
              title="Consultar Dólar BCV del día (API) y recalcular este finiquito y todos los expedientes al instante"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:bg-amber-400 transition-colors shadow-xs"
            >
              {bcvSyncState.loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <DollarSign className="w-4 h-4" />
              )}
              <span>
                {bcvSyncState.loading
                  ? 'Actualizando BCV...'
                  : `Dólar BCV del Día (Bs. ${formatBs(expediente.parametrosSnapshot.tasaCambioBCV_USD, 4)})`}
              </span>
            </button>

            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Editar</span>
            </button>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              onClick={onTogglePreviewMode}
              title="Ocultar interfaz y mostrar solo el documento listo para imprimir o exportar"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors shadow-xs cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Vista Previa</span>
            </button>

            <button
              onClick={handleDownloadWord}
              disabled={isGeneratingWord}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 disabled:bg-sky-400 transition-colors shadow-xs"
            >
              {isGeneratingWord ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGeneratingWord ? 'Word...' : 'Word (.doc)'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors shadow-xs"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isGeneratingPDF ? 'PDF...' : 'PDF (.pdf)'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      )}

      {/* Live BCV feedback banner - hidden in Vista Previa and during print */}
      {!isPreviewMode && bcvSyncState.lastSyncedRate && !bcvSyncState.error && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-950 print-hide">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Finiquito actualizado a tasa BCV del día:</strong> Bs.{' '}
              <span className="font-mono font-bold">{formatBs(bcvSyncState.lastSyncedRate, 4)}</span> / USD (incluye todos los expedientes).
            </span>
          </div>
          <span className="text-2xs font-mono text-emerald-800 shrink-0">
            Fuente: {bcvSyncState.lastSource}
          </span>
        </div>
      )}

      {!isPreviewMode && bcvSyncState.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg flex items-center gap-2 text-xs text-red-900 print-hide">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{bcvSyncState.error}</span>
        </div>
      )}

      {/* Official Formatted Receipt Paper */}
      <div
        id="printable-receipt-container"
        className="printable-area bg-white border border-slate-300 rounded-xl shadow-md p-8 md:p-10 text-slate-900 font-sans relative overflow-hidden"
      >
        {/* Subtle Watermark on print */}
        <div className="absolute inset-0 pointer-events-none opacity-2 flex items-center justify-center -rotate-25">
          <span className="text-7xl font-black text-slate-900 tracking-widest uppercase">
            {contratista.razonSocial}
          </span>
        </div>

        {/* Header Institution */}
        <div className="border-b-2 border-slate-900 pb-5 text-center">
          <div className="flex items-center justify-between mb-2">
            <div className="text-left">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 block">
                N° Expediente: {expediente.numeroExpediente}
              </span>
              <span className="text-xs text-slate-600 block">
                Regulado: LOTTT / CCP Petrolera FUPTV
              </span>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Auditado y Homologado
              </span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-slate-900">
            {contratista.razonSocial}
          </h1>
          <p className="text-sm font-mono text-slate-700 font-semibold">RIF: {contratista.rif}</p>
          {contratista.direccion && (
            <p className="text-xs text-slate-600 uppercase tracking-wide mt-0.5">
              {contratista.direccion}
            </p>
          )}
          <p className="text-sm text-slate-800 font-medium mt-1">
            CONTRATO / ENTE: <span className="font-mono font-semibold">{contratista.numeroContrato}</span> · {contratista.clientePrincipal}
          </p>
          <p className="text-xs text-slate-600 mt-0.5 uppercase tracking-wide">
            OBRA: {contratista.obraServicio} ({contratista.complejo})
          </p>

          <div className="mt-4 pt-3 border-t border-slate-300">
            <h2 className="text-base sm:text-lg font-bold tracking-wide uppercase text-blue-900">
              Liquidación de Prestaciones Sociales por Culminación de Contrato Laboral
            </h2>
            <p className="text-xs text-slate-500">
              Conforme a los Artículos 83, 87, 141, 142 y 143 de la LOTTT y la Convención Colectiva Petrolera Vigente
            </p>
          </div>
        </div>

        {/* Section: Worker Data */}
        <div className="py-4 border-b border-slate-300 text-xs sm:text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <div>
              <span className="text-slate-500 text-xs block">Trabajador:</span>
              <span className="font-bold text-slate-900 text-sm uppercase">
                {trabajador.nombres} {trabajador.apellidos}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Cédula de Identidad:</span>
              <span className="font-mono font-semibold text-slate-900">
                {trabajador.cedula}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Cargo y Nivel CCP:</span>
              <span className="font-medium text-slate-800">
                {trabajador.cargoNombre} (Nivel {trabajador.nivelCCP})
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Régimen de Guardia:</span>
              <span className="font-medium text-slate-800">
                Turno {trabajador.turnoGuardia}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Fecha de Ingreso / Egreso:</span>
              <span className="font-medium text-slate-800">
                {trabajador.fechaIngreso} al {trabajador.fechaEgreso}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-xs block">Tiempo de Servicio Computable:</span>
              <span className="font-bold text-slate-900">
                {calculo.tiempoServicio.anos} Años, {calculo.tiempoServicio.meses} Meses, {calculo.tiempoServicio.dias} Días
              </span>
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-500 text-xs block">Causa de Egreso:</span>
              <span className="font-semibold text-slate-800">
                {trabajador.causaEgreso}{' '}
                {calculo.indemnizacionDespidoArt92?.aplica
                  ? '(Con indemnización por despido Art. 92 LOTTT "Doblete")'
                  : '(Sin indemnización por despido Art. 92 LOTTT conforme a derecho)'}
              </span>
            </div>
          </div>
        </div>

        {/* Section: Salary Basis */}
        <div className="py-4 border-b border-slate-300 bg-slate-50/70 -mx-8 md:-mx-10 px-8 md:px-10 text-xs">
          <div className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-2xs">
            Bases Salariales de Cálculo (Salario Integral Petrolero)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div>
              <span className="text-slate-500 text-2xs block">Salario Básico Diario:</span>
              <span className="font-semibold text-slate-900">Bs. {formatBs(calculo.salarioBasicoDiario)}</span>
            </div>
            <div>
              <span className="text-slate-500 text-2xs block">Salario Normal Diario (Inc. TV):</span>
              <span className="font-semibold text-slate-900">Bs. {formatBs(calculo.salarioNormalDiario)}</span>
            </div>
            <div>
              <span className="text-slate-500 text-2xs block">Alícuota Utilidades ({expediente.parametrosSnapshot.diasUtilidadesCCP}d):</span>
              <span className="font-semibold text-slate-900">Bs. {formatBs(calculo.alicuotaUtilidadesDiaria)}</span>
            </div>
            <div>
              <span className="text-slate-500 text-2xs block">Alícuota Vacaciones ({expediente.parametrosSnapshot.diasBonoVacacionalCCP}d):</span>
              <span className="font-semibold text-slate-900">Bs. {formatBs(calculo.alicuotaBonoVacacionalDiaria)}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="font-sans font-semibold text-slate-700">
              Salario Integral Diario para Prestaciones de Antigüedad:
            </span>
            <span className="font-mono font-bold text-blue-900 text-sm">
              Bs. {formatBs(calculo.salarioIntegralDiario)}
            </span>
          </div>
        </div>

        {/* Section: Asignaciones (Haberes) */}
        <div className="py-4 border-b border-slate-300">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Conceptos de Asignaciones (Haberes Brutos)
            </span>
            <span className="text-2xs text-slate-500 font-mono">
              Base: Salario Integral / Normal CCP
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold text-2xs uppercase">
                <th className="py-1.5 w-12">Cód.</th>
                <th className="py-1.5">Concepto Legal / Contractual</th>
                <th className="py-1.5 text-center w-28">Base / Días</th>
                <th className="py-1.5 text-right w-28">Valor Unit.</th>
                <th className="py-1.5 text-right w-32">Total (Bs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-2 text-slate-600">101</td>
                <td className="py-2 font-sans font-medium text-slate-900">
                  Prestaciones Sociales ({calculo.seleccionFavorable.metodoAplicado})
                  <div className="text-2xs text-slate-500 font-sans mt-0.5">
                    [Comparativa Retroactividad Art. 142-c: {calculo.retroactividad.diasAntiguedad} Días x Bs. {formatBs(calculo.salarioIntegralDiario)} = Bs. {formatBs(calculo.retroactividad.montoRetroactividad)} → Aplica {calculo.seleccionFavorable.metodoAplicado}]
                  </div>
                </td>
                <td className="py-2 text-center text-slate-700">
                  {formatBs(calculo.garantiaTrimestral.diasTotalesGarantia)} Días
                </td>
                <td className="py-2 text-right text-slate-700">
                  {formatBs(calculo.salarioIntegralDiario)}
                </td>
                <td className="py-2 text-right font-semibold text-slate-900">
                  {formatBs(calculo.seleccionFavorable.montoPrestacionesAplicado)}
                </td>
              </tr>

              <tr>
                <td className="py-2 text-slate-600">102</td>
                <td className="py-2 font-sans font-medium text-slate-900">
                  Intereses s/ Prestaciones Sociales (Art. 143 LOTTT)
                  <div className="text-2xs text-slate-500 font-sans mt-0.5">
                    Rendimientos mensuales calculados sobre saldos a Tasa Promedio BCV (Activa/Pasiva)
                  </div>
                </td>
                <td className="py-2 text-center text-slate-700">Saldo Acum.</td>
                <td className="py-2 text-right text-slate-700">Tasas BCV</td>
                <td className="py-2 text-right font-semibold text-slate-900">
                  {formatBs(calculo.garantiaTrimestral.interesesAcumuladosArt143)}
                </td>
              </tr>

              <tr>
                <td className="py-2 text-slate-600">103</td>
                <td className="py-2 font-sans font-medium text-slate-900">
                  Vacaciones Fraccionadas (Art. 190 LOTTT / CCP)
                </td>
                <td className="py-2 text-center text-slate-700">
                  {formatBs(calculo.vacacionesFraccionadas.dias)} Días
                </td>
                <td className="py-2 text-right text-slate-700">
                  {formatBs(calculo.vacacionesFraccionadas.valorUnitario)}
                </td>
                <td className="py-2 text-right font-semibold text-slate-900">
                  {formatBs(calculo.vacacionesFraccionadas.total)}
                </td>
              </tr>

              <tr>
                <td className="py-2 text-slate-600">104</td>
                <td className="py-2 font-sans font-medium text-slate-900">
                  Bono Vacacional Fraccionado (Art. 192 LOTTT / CCP)
                </td>
                <td className="py-2 text-center text-slate-700">
                  {formatBs(calculo.bonoVacacionalFraccionado.dias)} Días
                </td>
                <td className="py-2 text-right text-slate-700">
                  {formatBs(calculo.bonoVacacionalFraccionado.valorUnitario)}
                </td>
                <td className="py-2 text-right font-semibold text-slate-900">
                  {formatBs(calculo.bonoVacacionalFraccionado.total)}
                </td>
              </tr>

              <tr>
                <td className="py-2 text-slate-600">105</td>
                <td className="py-2 font-sans font-medium text-slate-900">
                  Utilidades Fraccionadas (Art. 131 LOTTT / CCP)
                </td>
                <td className="py-2 text-center text-slate-700">
                  {formatBs(calculo.utilidadesFraccionadas.dias)} Días
                </td>
                <td className="py-2 text-right text-slate-700">
                  {formatBs(calculo.utilidadesFraccionadas.valorUnitario)}
                </td>
                <td className="py-2 text-right font-semibold text-slate-900">
                  {formatBs(calculo.utilidadesFraccionadas.total)}
                </td>
              </tr>

              <tr>
                <td className="py-2 text-slate-600">106</td>
                <td className="py-2 font-sans font-medium text-slate-900">
                  Bonificación Especial Culminación Contrato CCP
                </td>
                <td className="py-2 text-center text-slate-700">
                  {formatBs(calculo.bonificacionEspecialFiniquitoCCP.dias)} Días
                </td>
                <td className="py-2 text-right text-slate-700">
                  {formatBs(calculo.bonificacionEspecialFiniquitoCCP.valorUnitario)}
                </td>
                <td className="py-2 text-right font-semibold text-slate-900">
                  {formatBs(calculo.bonificacionEspecialFiniquitoCCP.total)}
                </td>
              </tr>

              {calculo.indemnizacionDespidoArt92?.aplica && (
                <tr className="bg-amber-50/50">
                  <td className="py-2 text-slate-600 font-bold">107</td>
                  <td className="py-2 font-sans font-medium text-amber-950">
                    Indemnización Despido Injustificado (Art. 92 LOTTT "Doblete")
                    <div className="text-2xs text-amber-700 font-sans mt-0.5">
                      100% adicional del monto de las prestaciones sociales por terminación incausada
                    </div>
                  </td>
                  <td className="py-2 text-center text-slate-700 font-mono">100% Prest.</td>
                  <td className="py-2 text-right text-slate-700 font-mono">
                    {formatBs(calculo.seleccionFavorable.montoPrestacionesAplicado)}
                  </td>
                  <td className="py-2 text-right font-bold text-amber-900 font-mono">
                    {formatBs(calculo.indemnizacionDespidoArt92.monto)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 font-bold">
                <td colSpan={4} className="py-2 text-right font-sans text-xs uppercase">
                  Total Asignaciones:
                </td>
                <td className="py-2 text-right font-mono text-sm text-slate-900">
                  Bs. {formatBs(calculo.totalAsignaciones)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Section: Deducciones */}
        <div className="py-4 border-b border-slate-300">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Conceptos de Retenciones y Deducciones de Ley
            </span>
            <span className="text-2xs text-slate-500 font-mono">
              Tope 5 SM / INCES s/ Utilidades Art. 14
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold text-2xs uppercase">
                <th className="py-1.5 w-12">Cód.</th>
                <th className="py-1.5">Concepto de Deducción</th>
                <th className="py-1.5 text-center w-40">Porcentaje / Base</th>
                <th className="py-1.5 text-right w-32">Total (Bs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-2 text-slate-600">501</td>
                <td className="py-2 font-sans font-medium text-slate-900">
                  Retención IVSS Seguro Social (4% · Tope 5 SM = Bs. 650,00)
                  <div className="text-2xs text-slate-500 font-sans mt-0.5">
                    Base semanal Bs. {formatBs(calculo.deducciones.ivss.baseSemanal || 150)} × 4% = Bs. {formatBs((calculo.deducciones.ivss.baseSemanal || 150) * 0.04)}/sem × {calculo.deducciones.ivss.semanasCotizadas || 4} lunes (mes de egreso)
                  </div>
                </td>
                <td className="py-2 text-center text-slate-700 font-sans text-2xs">
                  4,00% ({calculo.deducciones.ivss.semanasCotizadas || 4} lunes)
                </td>
                <td className="py-2 text-right text-slate-900 font-semibold">
                  {formatBs(calculo.deducciones.ivss.total)}
                </td>
              </tr>

              <tr>
                <td className="py-2 text-slate-600">502</td>
                <td className="py-2 font-sans font-medium text-slate-900">
                  Retención Régimen Prestacional Empleo (0.5% SPF · Tope 5 SM)
                  <div className="text-2xs text-slate-500 font-sans mt-0.5">
                    Base semanal Bs. {formatBs(calculo.deducciones.spf.baseSemanal || 150)} × 0,5% = Bs. {formatBs((calculo.deducciones.spf.baseSemanal || 150) * 0.005)}/sem × {calculo.deducciones.spf.semanasCotizadas || 4} lunes (mes de egreso)
                  </div>
                </td>
                <td className="py-2 text-center text-slate-700 font-sans text-2xs">
                  0,50% ({calculo.deducciones.spf.semanasCotizadas || 4} lunes)
                </td>
                <td className="py-2 text-right text-slate-900 font-semibold">
                  {formatBs(calculo.deducciones.spf.total)}
                </td>
              </tr>

              <tr>
                <td className="py-2 text-slate-600">503</td>
                <td className="py-2 font-sans font-medium text-slate-900">
                  Retención FAOV / BANAVIH (1% s/ Asignaciones Base)
                </td>
                <td className="py-2 text-center text-slate-700 font-sans text-2xs">
                  1,00% s/ Bs. {formatBs(calculo.deducciones.faov.base)}
                </td>
                <td className="py-2 text-right text-slate-900 font-semibold">
                  {formatBs(calculo.deducciones.faov.total)}
                </td>
              </tr>

              <tr>
                <td className="py-2 text-slate-600">504</td>
                <td className="py-2 font-sans font-medium text-slate-900">
                  Retención INCES s/ Utilidades Fraccionadas (0.5%)
                  <div className="text-2xs text-slate-500 font-sans mt-0.5">
                    Estricto apego al Art. 14 Ley INCES (no grava vacaciones ni antigüedad)
                  </div>
                </td>
                <td className="py-2 text-center text-slate-700 font-sans text-2xs">
                  0,50% s/ Bs. {formatBs(calculo.deducciones.inces.baseUtilidades)}
                </td>
                <td className="py-2 text-right text-slate-900 font-semibold">
                  {formatBs(calculo.deducciones.inces.total)}
                </td>
              </tr>

              <tr>
                <td className="py-2 text-slate-600">505</td>
                <td className="py-2 font-sans font-medium text-slate-900">
                  Anticipos de Prestaciones Sociales Otorgados
                </td>
                <td className="py-2 text-center text-slate-700 font-sans text-2xs">
                  Monto pagado previamente
                </td>
                <td className="py-2 text-right text-slate-900 font-semibold">
                  {formatBs(calculo.deducciones.anticipos)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 font-bold">
                <td colSpan={3} className="py-2 text-right font-sans text-xs uppercase">
                  Total Deducciones:
                </td>
                <td className="py-2 text-right font-mono text-sm text-red-700">
                  Bs. {formatBs(calculo.deducciones.totalDeducciones)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Section: Art. 143 Monthly Interest & Fideicomiso Traceability */}
        {calculo.garantiaTrimestral.tablaMensual && calculo.garantiaTrimestral.tablaMensual.length > 0 && (
          <div className="py-3 border-b border-slate-300">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-2xs uppercase tracking-wider text-slate-700">
                Detalle Fideicomiso / Garantía e Intereses Mensuales BCV (Art. 143 LOTTT)
              </span>
              <span className="text-2xs text-slate-500 font-mono">
                Total Acumulado: Bs. {formatBs(calculo.garantiaTrimestral.interesesAcumuladosArt143)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-2xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase">
                    <th className="py-1">Mes</th>
                    <th className="py-1 text-center">Días Abono</th>
                    <th className="py-1 text-right">Abono Mes (Bs.)</th>
                    <th className="py-1 text-right">Saldo Garantía (Bs.)</th>
                    <th className="py-1 text-right">Tasa BCV (%)</th>
                    <th className="py-1 text-right">Interés Mes (Bs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calculo.garantiaTrimestral.tablaMensual.map((row) => (
                    <tr key={row.mesAno}>
                      <td className="py-1 text-slate-700 font-semibold">{row.mesAno}</td>
                      <td className="py-1 text-center text-slate-600">
                        {row.diasGarantiaAbonados + row.diasAdicionales}d
                      </td>
                      <td className="py-1 text-right text-slate-700">{formatBs(row.abonoGarantiaMes)}</td>
                      <td className="py-1 text-right text-slate-900 font-semibold">
                        {formatBs(row.garantiaAcumulada)}
                      </td>
                      <td className="py-1 text-right text-slate-600">{formatBs(row.tasaBCVAplicada)}%</td>
                      <td className="py-1 text-right text-emerald-700 font-semibold">
                        {formatBs(row.interesMes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section: Grand Total Net Pay */}
        <div className="my-5 p-4 bg-slate-100 rounded-lg border-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Neto Total a Liquidar y Pagar al Trabajador:
            </span>
            <span className="text-2xs text-slate-500 font-mono">
              Ref. BCV: USD ${formatBs(calculo.netoEquivalenteUSD)} @ {formatBs(expediente.parametrosSnapshot.tasaCambioBCV_USD, 4)} Bs/USD
            </span>
          </div>
          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-black font-mono text-blue-900 block">
              Bs. {formatBs(calculo.netoAPagar)}
            </span>
          </div>
        </div>

        {/* Son en letras */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-semibold uppercase tracking-wide">
          SON: {calculo.netoEnLetras}
        </div>

        {/* Section: Legal Conformity & Release Statement */}
        <div className="mt-6 pt-4 border-t border-slate-300 text-2xs leading-relaxed text-slate-700">
          <div className="font-bold uppercase text-slate-900 mb-1">
            Declaración de Finiquito y Conformidad:
          </div>
          <p>
            Yo, <strong className="text-slate-900">{trabajador.nombres} {trabajador.apellidos}</strong>, titular de la Cédula de Identidad N° <strong className="text-slate-900">{trabajador.cedula}</strong>, declaro que he recibido de la empresa <strong className="text-slate-900">{contratista.razonSocial}</strong> (RIF <strong className="text-slate-900">{contratista.rif}</strong>, con domicilio en <strong className="text-slate-900">{contratista.direccion || 'AV. VIA HOSPITAL RASETTI, BARCELONA, ANZOATEGUI'}</strong>), a mi entera satisfacción, la cantidad de <strong className="text-slate-900">Bs. {formatBs(calculo.netoAPagar)}</strong> ({calculo.netoEnLetras}), por concepto de pago total y definitivo de mis Prestaciones Sociales, Intereses de Prestaciones Sociales acumulados, Vacaciones Fraccionadas, Bono Vacacional Fraccionado, Utilidades Fraccionadas, Bonificación Especial de Finiquito por Culminación de Contrato y demás beneficios legales y contractuales derivados de la terminación de mi relación de trabajo por obra determinada en la industria petrolera y petroquímica, conforme a la LOTTT y la Convención Colectiva Petrolera. Declaro que nada se me adeuda por concepto de salarios ordinarios o extraordinarios, descansos compensatorios, tiempo de viaje, dotaciones ni indemnizaciones de ninguna naturaleza, otorgando formal y definitivo finiquito y constancia de solvencia laboral a la empresa contratista y a sus entes contratantes ({contratista.clientePrincipal}).
          </p>
        </div>

        {/* Signatures & Fingerprint Block */}
        <div className="mt-10 pt-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-end text-center text-xs">
          <div>
            <div className="border-b border-slate-900 pb-1 mb-2">
              <span className="text-2xs text-slate-400 block mb-8 font-mono">[Sello y Firma Digital]</span>
            </div>
            <span className="font-bold text-slate-900 uppercase block">Por la Empresa Contratista</span>
            <span className="text-2xs text-slate-500 font-mono">RIF: {contratista.rif}</span>
          </div>

          <div>
            <div className="border-b border-slate-900 pb-1 mb-2">
              <span className="text-2xs text-slate-400 block mb-8 font-mono">[Firma del Trabajador]</span>
            </div>
            <span className="font-bold text-slate-900 uppercase block">El Trabajador</span>
            <span className="text-2xs text-slate-500 font-mono">C.I. {trabajador.cedula}</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-24 h-28 border-2 border-dashed border-slate-400 rounded flex flex-col items-center justify-center p-2 bg-slate-50 text-2xs text-slate-500">
              <span className="text-3xl text-slate-300 mb-1">🖐️</span>
              <span className="font-semibold text-2xs leading-tight text-center">Huella Dactilar</span>
              <span className="text-3xs text-slate-400 text-center">[ Pulgar Der. ]</span>
            </div>
            <span className="text-2xs text-slate-500 mt-1">Conformidad Legal</span>
          </div>
        </div>

        {/* Verification Footer & QR code */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-2xs text-slate-400 font-mono gap-4">
          <div className="flex items-center gap-3">
            {/* Clean SVG Verification Seal / QR placeholder */}
            <div className="w-12 h-12 bg-slate-900 text-white rounded p-1 flex flex-col justify-between items-center shrink-0">
              <div className="grid grid-cols-3 gap-0.5 w-full h-full p-0.5">
                <div className="bg-white rounded-xs"></div>
                <div className="bg-white rounded-xs"></div>
                <div className="bg-white rounded-xs"></div>
                <div className="bg-white rounded-xs"></div>
                <div className="bg-blue-500 rounded-xs"></div>
                <div className="bg-white rounded-xs"></div>
                <div className="bg-white rounded-xs"></div>
                <div className="bg-transparent rounded-xs"></div>
                <div className="bg-white rounded-xs"></div>
              </div>
            </div>
            <div>
              <span className="block text-slate-600 font-semibold font-sans">
                Código Único de Validación: {expediente.id.toUpperCase()}
              </span>
              <span>Emisión Digital Segura · {contratista.razonSocial} · Verificable ante {contratista.clientePrincipal} / MINTRA</span>
            </div>
          </div>
          <div className="text-right">
            <span>Fecha de emisión: {new Date(expediente.fechaCreacion).toLocaleDateString('es-VE')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
