import { ExpedienteLiquidacion } from '../types/settlement';
import { formatBs } from './calculator';

function escapeHtml(value: string | number | undefined | null): string {
  const str = String(value ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Genera y descarga un documento compatible con Microsoft Word (.doc)
 * formateado con diseño corporativo de finiquito laboral LOTTT / CCP.
 */
export function exportOfficialWord(expediente: ExpedienteLiquidacion): boolean {
  try {
    const { contratista, trabajador, calculo, parametrosSnapshot } = expediente;
    const direccion = contratista.direccion || 'AV. VIA HOSPITAL RASETTI, BARCELONA, ANZOATEGUI';
    const semanasIVSS = calculo.deducciones.ivss.semanasCotizadas || 4;
    const baseSemanalIVSS = calculo.deducciones.ivss.baseSemanal || 150;
    const semanasSPF = calculo.deducciones.spf.semanasCotizadas || 4;
    const baseSemanalSPF = calculo.deducciones.spf.baseSemanal || 150;

    const art92Row = calculo.indemnizacionDespidoArt92?.aplica
      ? `
        <tr style="background-color:#fffbeb;">
          <td style="padding:5px 6px;border-bottom:1px solid #e2e8f0;font-weight:bold;">107</td>
          <td style="padding:5px 6px;border-bottom:1px solid #e2e8f0;">
            <strong>Indemnización Despido Injustificado (Art. 92 LOTTT)</strong><br/>
            <span style="font-size:8pt;color:#92400e;">100% adicional sobre las prestaciones sociales</span>
          </td>
          <td style="padding:5px 6px;border-bottom:1px solid #e2e8f0;text-align:center;">100% Prest.</td>
          <td style="padding:5px 6px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatBs(calculo.seleccionFavorable.montoPrestacionesAplicado)}</td>
          <td style="padding:5px 6px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">${formatBs(calculo.indemnizacionDespidoArt92.monto)}</td>
        </tr>
      `
      : '';

    const tablaInteresesRows = (calculo.garantiaTrimestral.tablaMensual || [])
      .map(
        (row) => `
          <tr>
            <td style="padding:3px 6px;border-bottom:1px solid #f1f5f9;">${escapeHtml(row.mesAno)}</td>
            <td style="padding:3px 6px;border-bottom:1px solid #f1f5f9;text-align:center;">${row.diasGarantiaAbonados + row.diasAdicionales}d</td>
            <td style="padding:3px 6px;border-bottom:1px solid #f1f5f9;text-align:right;">${formatBs(row.abonoGarantiaMes)}</td>
            <td style="padding:3px 6px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:bold;">${formatBs(row.garantiaAcumulada)}</td>
            <td style="padding:3px 6px;border-bottom:1px solid #f1f5f9;text-align:right;">${formatBs(row.tasaBCVAplicada)}%</td>
            <td style="padding:3px 6px;border-bottom:1px solid #f1f5f9;text-align:right;color:#047857;font-weight:bold;">${formatBs(row.interesMes)}</td>
          </tr>
        `
      )
      .join('');

    const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>Finiquito Laboral - ${escapeHtml(trabajador.nombres)} ${escapeHtml(trabajador.apellidos)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page WordSection1 {
      size: 8.5in 11.0in;
      margin: 0.5in 0.55in 0.5in 0.55in;
      mso-header-margin: 0.25in;
      mso-footer-margin: 0.25in;
    }
    div.WordSection1 {
      page: WordSection1;
    }
    body {
      font-family: Calibri, Arial, Helvetica, sans-serif;
      font-size: 9.5pt;
      color: #0f172a;
      line-height: 1.3;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
  </style>
</head>
<body>
<div class="WordSection1">

  <!-- Encabezado Institucional -->
  <table style="border-bottom:2px solid #0f172a;margin-bottom:8px;">
    <tr>
      <td style="font-size:8pt;color:#475569;padding-bottom:4px;">
        <strong>N° Expediente:</strong> ${escapeHtml(expediente.numeroExpediente)}<br/>
        Regulado: LOTTT / Convención Colectiva Petrolera (CCP)
      </td>
      <td style="font-size:8pt;color:#065f46;text-align:right;padding-bottom:4px;">
        <strong>[ DOCUMENTO AUDITADO Y HOMOLOGADO ]</strong><br/>
        Emisión: ${escapeHtml(new Date(expediente.fechaCreacion).toLocaleDateString('es-VE'))}
      </td>
    </tr>
    <tr>
      <td colspan="2" style="text-align:center;padding:6px 0 8px 0;">
        <div style="font-size:15pt;font-weight:bold;text-transform:uppercase;color:#0f172a;">
          ${escapeHtml(contratista.razonSocial)}
        </div>
        <div style="font-size:9.5pt;font-weight:bold;color:#334155;">
          RIF: ${escapeHtml(contratista.rif)}
        </div>
        <div style="font-size:8.5pt;color:#475569;text-transform:uppercase;">
          ${escapeHtml(direccion)}
        </div>
        <div style="font-size:8.5pt;color:#1e293b;margin-top:3px;">
          <strong>CONTRATO / ENTE:</strong> ${escapeHtml(contratista.numeroContrato)} · ${escapeHtml(contratista.clientePrincipal)}<br/>
          <strong>OBRA:</strong> ${escapeHtml(contratista.obraServicio)} (${escapeHtml(contratista.complejo)})
        </div>
      </td>
    </tr>
    <tr>
      <td colspan="2" style="text-align:center;border-top:1px solid #cbd5e1;padding:6px 0 8px 0;">
        <div style="font-size:11.5pt;font-weight:bold;color:#1e3a8a;text-transform:uppercase;">
          LIQUIDACIÓN DE PRESTACIONES SOCIALES POR CULMINACIÓN DE CONTRATO LABORAL
        </div>
        <div style="font-size:8pt;color:#64748b;">
          Conforme a los Artículos 83, 87, 141, 142 y 143 de la LOTTT y Convención Colectiva Petrolera Vigente
        </div>
      </td>
    </tr>
  </table>

  <!-- Datos del Trabajador -->
  <table style="background-color:#f8fafc;border:1px solid #cbd5e1;margin-bottom:8px;">
    <tr>
      <td style="padding:5px 8px;width:55%;border-bottom:1px solid #e2e8f0;">
        <span style="font-size:7.5pt;color:#64748b;">TRABAJADOR:</span><br/>
        <strong style="font-size:10pt;text-transform:uppercase;">${escapeHtml(trabajador.nombres)} ${escapeHtml(trabajador.apellidos)}</strong>
      </td>
      <td style="padding:5px 8px;width:45%;border-bottom:1px solid #e2e8f0;">
        <span style="font-size:7.5pt;color:#64748b;">CÉDULA DE IDENTIDAD:</span><br/>
        <strong style="font-size:10pt;">${escapeHtml(trabajador.cedula)}</strong>
      </td>
    </tr>
    <tr>
      <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">
        <span style="font-size:7.5pt;color:#64748b;">CARGO Y NIVEL CCP:</span><br/>
        ${escapeHtml(trabajador.cargoNombre)} (Nivel ${trabajador.nivelCCP})
      </td>
      <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">
        <span style="font-size:7.5pt;color:#64748b;">RÉGIMEN DE GUARDIA:</span><br/>
        Turno ${escapeHtml(trabajador.turnoGuardia)}
      </td>
    </tr>
    <tr>
      <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">
        <span style="font-size:7.5pt;color:#64748b;">FECHA DE INGRESO / EGRESO:</span><br/>
        ${escapeHtml(trabajador.fechaIngreso)} al ${escapeHtml(trabajador.fechaEgreso)}
      </td>
      <td style="padding:5px 8px;border-bottom:1px solid #e2e8f0;">
        <span style="font-size:7.5pt;color:#64748b;">TIEMPO DE SERVICIO COMPUTABLE:</span><br/>
        <strong>${calculo.tiempoServicio.anos} Años, ${calculo.tiempoServicio.meses} Meses, ${calculo.tiempoServicio.dias} Días</strong> (${calculo.tiempoServicio.totalDias} días)
      </td>
    </tr>
    <tr>
      <td colspan="2" style="padding:5px 8px;">
        <span style="font-size:7.5pt;color:#64748b;">CAUSA DE EGRESO:</span>
        <strong>${escapeHtml(trabajador.causaEgreso)}</strong>
        ${calculo.indemnizacionDespidoArt92?.aplica ? ' (Con indemnización Art. 92 LOTTT)' : ' (Sin indemnización por despido Art. 92 LOTTT conforme a derecho)'}
      </td>
    </tr>
  </table>

  <!-- Bases Salariales -->
  <table style="background-color:#f1f5f9;border:1px solid #cbd5e1;margin-bottom:8px;">
    <tr>
      <td colspan="4" style="padding:4px 8px;font-size:8pt;font-weight:bold;color:#1e293b;border-bottom:1px solid #cbd5e1;text-transform:uppercase;">
        Bases Salariales de Cálculo (Salario Integral Petrolero)
      </td>
    </tr>
    <tr>
      <td style="padding:4px 8px;font-size:8pt;">
        <span style="color:#64748b;">Salario Básico Diario:</span><br/>
        <strong>Bs. ${formatBs(calculo.salarioBasicoDiario)}</strong>
      </td>
      <td style="padding:4px 8px;font-size:8pt;">
        <span style="color:#64748b;">Salario Normal Diario:</span><br/>
        <strong>Bs. ${formatBs(calculo.salarioNormalDiario)}</strong>
      </td>
      <td style="padding:4px 8px;font-size:8pt;">
        <span style="color:#64748b;">Alíc. Utilidades (${parametrosSnapshot.diasUtilidadesCCP}d):</span><br/>
        <strong>Bs. ${formatBs(calculo.alicuotaUtilidadesDiaria)}</strong>
      </td>
      <td style="padding:4px 8px;font-size:8pt;">
        <span style="color:#64748b;">Alíc. Bono Vac. (${parametrosSnapshot.diasBonoVacacionalCCP}d):</span><br/>
        <strong>Bs. ${formatBs(calculo.alicuotaBonoVacacionalDiaria)}</strong>
      </td>
    </tr>
    <tr>
      <td colspan="4" style="padding:4px 8px;border-top:1px solid #cbd5e1;font-size:8.5pt;">
        <strong>Salario Integral Diario para Prestaciones de Antigüedad:</strong>
        <span style="color:#1e3a8a;font-weight:bold;"> Bs. ${formatBs(calculo.salarioIntegralDiario)}</span>
      </td>
    </tr>
  </table>

  <!-- Tabla de Asignaciones -->
  <table style="border:1px solid #cbd5e1;margin-bottom:8px;">
    <thead>
      <tr style="background-color:#e0e7ff;color:#1e293b;font-size:8pt;text-transform:uppercase;">
        <th style="padding:5px 6px;text-align:left;width:8%;">Cód.</th>
        <th style="padding:5px 6px;text-align:left;width:48%;">Concepto de Asignaciones (Haberes Brutos)</th>
        <th style="padding:5px 6px;text-align:center;width:14%;">Base / Días</th>
        <th style="padding:5px 6px;text-align:right;width:14%;">Valor Unit.</th>
        <th style="padding:5px 6px;text-align:right;width:16%;">Total (Bs.)</th>
      </tr>
    </thead>
    <tbody style="font-size:8.5pt;">
      <tr>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">101</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">
          <strong>Prestaciones Sociales (${escapeHtml(calculo.seleccionFavorable.metodoAplicado)})</strong><br/>
          <span style="font-size:7.5pt;color:#64748b;">Comparativa Art. 142-c: ${calculo.retroactividad.diasAntiguedad}d × Bs. ${formatBs(calculo.salarioIntegralDiario)} = Bs. ${formatBs(calculo.retroactividad.montoRetroactividad)}</span>
        </td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:center;">${formatBs(calculo.garantiaTrimestral.diasTotalesGarantia)} Días</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatBs(calculo.salarioIntegralDiario)}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">${formatBs(calculo.seleccionFavorable.montoPrestacionesAplicado)}</td>
      </tr>
      <tr>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">102</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">Intereses s/ Prestaciones Sociales (Art. 143 LOTTT)</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:center;">Saldo Acum.</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;">Tasas BCV</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">${formatBs(calculo.garantiaTrimestral.interesesAcumuladosArt143)}</td>
      </tr>
      <tr>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">103</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">Vacaciones Fraccionadas (Art. 190 LOTTT / CCP)</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:center;">${formatBs(calculo.vacacionesFraccionadas.dias)} Días</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatBs(calculo.vacacionesFraccionadas.valorUnitario)}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">${formatBs(calculo.vacacionesFraccionadas.total)}</td>
      </tr>
      <tr>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">104</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">Bono Vacacional Fraccionado (Art. 192 LOTTT / CCP)</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:center;">${formatBs(calculo.bonoVacacionalFraccionado.dias)} Días</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatBs(calculo.bonoVacacionalFraccionado.valorUnitario)}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">${formatBs(calculo.bonoVacacionalFraccionado.total)}</td>
      </tr>
      <tr>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">105</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">Utilidades Fraccionadas (Art. 131 LOTTT / CCP)</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:center;">${formatBs(calculo.utilidadesFraccionadas.dias)} Días</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatBs(calculo.utilidadesFraccionadas.valorUnitario)}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">${formatBs(calculo.utilidadesFraccionadas.total)}</td>
      </tr>
      <tr>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">106</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">Bonificación Especial Culminación Contrato CCP</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:center;">${formatBs(calculo.bonificacionEspecialFiniquitoCCP.dias)} Días</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatBs(calculo.bonificacionEspecialFiniquitoCCP.valorUnitario)}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">${formatBs(calculo.bonificacionEspecialFiniquitoCCP.total)}</td>
      </tr>
      ${art92Row}
    </tbody>
    <tfoot>
      <tr style="background-color:#f8fafc;font-weight:bold;font-size:9pt;">
        <td colspan="4" style="padding:5px 6px;text-align:right;border-top:2px solid #0f172a;">TOTAL ASIGNACIONES:</td>
        <td style="padding:5px 6px;text-align:right;border-top:2px solid #0f172a;">Bs. ${formatBs(calculo.totalAsignaciones)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Tabla de Deducciones -->
  <table style="border:1px solid #cbd5e1;margin-bottom:8px;">
    <thead>
      <tr style="background-color:#fee2e2;color:#7f1d1d;font-size:8pt;text-transform:uppercase;">
        <th style="padding:5px 6px;text-align:left;width:8%;">Cód.</th>
        <th style="padding:5px 6px;text-align:left;width:50%;">Conceptos de Retenciones y Deducciones de Ley</th>
        <th style="padding:5px 6px;text-align:center;width:26%;">Base / Porcentaje</th>
        <th style="padding:5px 6px;text-align:right;width:16%;">Total (Bs.)</th>
      </tr>
    </thead>
    <tbody style="font-size:8.5pt;">
      <tr>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">501</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">Retención IVSS Seguro Social (4% · Tope 5 SM = Bs. 650,00)</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:center;">4,00% (${semanasIVSS} lun × Bs. ${formatBs(baseSemanalIVSS * 0.04)})</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">${formatBs(calculo.deducciones.ivss.total)}</td>
      </tr>
      <tr>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">502</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">Retención Régimen Prestacional Empleo (0,5% SPF · Tope 5 SM)</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:center;">0,50% (${semanasSPF} lun × Bs. ${formatBs(baseSemanalSPF * 0.005)})</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">${formatBs(calculo.deducciones.spf.total)}</td>
      </tr>
      <tr>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">503</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">Retención FAOV / BANAVIH (1% s/ Asignaciones Base)</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:center;">1,00% s/ Bs. ${formatBs(calculo.deducciones.faov.base)}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">${formatBs(calculo.deducciones.faov.total)}</td>
      </tr>
      <tr>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">504</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">Retención INCES s/ Utilidades Fraccionadas (0,5% Art. 14)</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:center;">0,50% s/ Bs. ${formatBs(calculo.deducciones.inces.baseUtilidades)}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">${formatBs(calculo.deducciones.inces.total)}</td>
      </tr>
      <tr>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">505</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;">Anticipos de Prestaciones Sociales Otorgados</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:center;">Monto anticipado</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:bold;">${formatBs(calculo.deducciones.anticipos)}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr style="background-color:#f8fafc;font-weight:bold;font-size:9pt;">
        <td colspan="3" style="padding:5px 6px;text-align:right;border-top:2px solid #0f172a;">TOTAL DEDUCCIONES:</td>
        <td style="padding:5px 6px;text-align:right;color:#b91c1c;border-top:2px solid #0f172a;">Bs. ${formatBs(calculo.deducciones.totalDeducciones)}</td>
      </tr>
    </tfoot>
  </table>

  ${
    tablaInteresesRows
      ? `
  <!-- Detalle de Intereses Art. 143 -->
  <table style="border:1px solid #cbd5e1;margin-bottom:8px;">
    <thead>
      <tr style="background-color:#f8fafc;font-size:7.5pt;color:#475569;text-transform:uppercase;">
        <th colspan="6" style="padding:4px 6px;text-align:left;border-bottom:1px solid #cbd5e1;">
          Detalle Fideicomiso / Garantía e Intereses Mensuales BCV (Art. 143 LOTTT)
        </th>
      </tr>
      <tr style="background-color:#f1f5f9;font-size:7.5pt;color:#475569;">
        <th style="padding:3px 6px;text-align:left;">Mes</th>
        <th style="padding:3px 6px;text-align:center;">Días Abono</th>
        <th style="padding:3px 6px;text-align:right;">Abono Mes (Bs.)</th>
        <th style="padding:3px 6px;text-align:right;">Saldo Garantía (Bs.)</th>
        <th style="padding:3px 6px;text-align:right;">Tasa BCV (%)</th>
        <th style="padding:3px 6px;text-align:right;">Interés Mes (Bs.)</th>
      </tr>
    </thead>
    <tbody style="font-size:8pt;">
      ${tablaInteresesRows}
    </tbody>
  </table>
  `
      : ''
  }

  <!-- Neto Total a Pagar -->
  <table style="background-color:#1e3a8a;color:#ffffff;margin-bottom:6px;">
    <tr>
      <td style="padding:8px 10px;">
        <div style="font-size:9.5pt;font-weight:bold;text-transform:uppercase;">
          NETO TOTAL A LIQUIDAR Y PAGAR AL TRABAJADOR:
        </div>
        <div style="font-size:8pt;color:#dbeafe;margin-top:2px;">
          Ref. BCV: USD $${formatBs(calculo.netoEquivalenteUSD)} @ ${formatBs(parametrosSnapshot.tasaCambioBCV_USD, 4)} Bs/USD
        </div>
      </td>
      <td style="padding:8px 10px;text-align:right;font-size:14pt;font-weight:bold;">
        Bs. ${formatBs(calculo.netoAPagar)}
      </td>
    </tr>
  </table>

  <div style="background-color:#f8fafc;border:1px solid #cbd5e1;padding:5px 8px;font-size:8pt;font-weight:bold;margin-bottom:8px;">
    SON: ${escapeHtml(calculo.netoEnLetras)}
  </div>

  <!-- Declaración de Finiquito -->
  <div style="font-size:7.8pt;color:#334155;text-align:justify;border-top:1px solid #cbd5e1;padding-top:6px;margin-bottom:18px;">
    <strong>DECLARACIÓN DE FINIQUITO Y CONFORMIDAD:</strong><br/>
    Yo, <strong>${escapeHtml(trabajador.nombres)} ${escapeHtml(trabajador.apellidos)}</strong>, titular de la Cédula de Identidad N° <strong>${escapeHtml(trabajador.cedula)}</strong>, declaro que he recibido de la empresa <strong>${escapeHtml(contratista.razonSocial)}</strong> (RIF <strong>${escapeHtml(contratista.rif)}</strong>, con domicilio en <strong>${escapeHtml(direccion)}</strong>), a mi entera satisfacción, la cantidad de <strong>Bs. ${formatBs(calculo.netoAPagar)}</strong> (${escapeHtml(calculo.netoEnLetras)}), por concepto de pago total y definitivo de mis Prestaciones Sociales, Intereses de Prestaciones Sociales acumulados, Vacaciones Fraccionadas, Bono Vacacional Fraccionado, Utilidades Fraccionadas, Bonificación Especial de Finiquito por Culminación de Contrato y demás beneficios legales y contractuales derivados de la terminación de mi relación de trabajo por obra determinada, conforme a la LOTTT y la Convención Colectiva Petrolera. Declaro que nada se me adeuda por concepto salarial ni indemnizatorio alguno, otorgando formal y definitivo finiquito y constancia de solvencia laboral a la empresa contratista y a ${escapeHtml(contratista.clientePrincipal)}.
  </div>

  <!-- Bloque de Firmas -->
  <table style="margin-top:22px;">
    <tr>
      <td style="width:36%;text-align:center;vertical-align:bottom;padding:0 10px;">
        <div style="border-top:1px solid #0f172a;padding-top:4px;font-size:8pt;">
          <strong>POR LA EMPRESA CONTRATISTA</strong><br/>
          ${escapeHtml(contratista.razonSocial)}<br/>
          RIF: ${escapeHtml(contratista.rif)}
        </div>
      </td>
      <td style="width:36%;text-align:center;vertical-align:bottom;padding:0 10px;">
        <div style="border-top:1px solid #0f172a;padding-top:4px;font-size:8pt;">
          <strong>EL TRABAJADOR</strong><br/>
          ${escapeHtml(trabajador.nombres)} ${escapeHtml(trabajador.apellidos)}<br/>
          C.I. ${escapeHtml(trabajador.cedula)}
        </div>
      </td>
      <td style="width:28%;text-align:center;vertical-align:bottom;">
        <table style="width:82px;height:86px;border:1px dashed #64748b;margin:0 auto;">
          <tr>
            <td style="text-align:center;vertical-align:middle;font-size:7pt;color:#64748b;">
              Huella Dactilar<br/>[Pulgar Der.]
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

</div>
</body>
</html>`;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Finiquito_${expediente.numeroExpediente}_${trabajador.cedula}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (err) {
    console.error('Error generating Word document:', err);
    return false;
  }
}
