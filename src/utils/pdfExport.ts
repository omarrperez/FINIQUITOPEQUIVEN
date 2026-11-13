import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ExpedienteLiquidacion } from '../types/settlement';
import { formatBs } from './calculator';

/**
 * Direct high-fidelity Vector PDF generator using jsPDF.
 * Guaranteed to generate instant, crisp PDF files without html2canvas/Tailwind CSS rendering crashes.
 */
export function exportOfficialPDF(expediente: ExpedienteLiquidacion): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    const { contratista, trabajador, calculo } = expediente;
    const pw = doc.internal.pageSize.getWidth(); // ~215.9 mm
    const margin = 12;
    let y = 14;

    // Header Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(contratista.razonSocial.toUpperCase(), pw / 2, y, { align: 'center' });
    y += 5;

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.text(
      `RIF: ${contratista.rif}   |   CONTRATO PEQUIVEN / PDVSA N°: ${contratista.numeroContrato}`,
      pw / 2,
      y,
      { align: 'center' }
    );
    y += 4;

    doc.setFontSize(7.5);
    doc.text(
      `OBRA: ${contratista.obraServicio.toUpperCase()} (${contratista.complejo})`,
      pw / 2,
      y,
      { align: 'center' }
    );
    y += 5;

    // Divider Line
    doc.setLineWidth(0.5);
    doc.setDrawColor(30, 41, 59);
    doc.line(margin, y, pw - margin, y);
    y += 5;

    // Document Title
    doc.setFontSize(10.5);
    doc.setFont('Helvetica', 'bold');
    doc.text(
      'LIQUIDACIÓN DE PRESTACIONES SOCIALES Y FINIQUITO LABORAL',
      pw / 2,
      y,
      { align: 'center' }
    );
    y += 4;
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'normal');
    doc.text(
      'Regulado por la Ley Orgánica del Trabajo (LOTTT) y Convención Colectiva Petrolera (CCP)',
      pw / 2,
      y,
      { align: 'center' }
    );
    y += 5;

    // Box: Worker Data
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, pw - margin * 2, 25, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, pw - margin * 2, 25, 'S');

    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.text(`TRABAJADOR: ${trabajador.nombres} ${trabajador.apellidos}`, margin + 3, y + 5);
    doc.text(`C.I.: ${trabajador.cedula}`, pw - margin - 45, y + 5);

    doc.setFont('Helvetica', 'normal');
    doc.text(`Cargo: ${trabajador.cargoNombre}`, margin + 3, y + 10);
    doc.text(`Guardia: Turno ${trabajador.turnoGuardia}`, pw - margin - 45, y + 10);

    doc.text(
      `Ingreso / Egreso: ${trabajador.fechaIngreso}  al  ${trabajador.fechaEgreso}`,
      margin + 3,
      y + 15
    );
    doc.text(
      `Tiempo Servicio: ${calculo.tiempoServicio.anos}A, ${calculo.tiempoServicio.meses}M, ${calculo.tiempoServicio.dias}D (${calculo.tiempoServicio.totalDias} días)`,
      pw - margin - 65,
      y + 15
    );

    doc.text(`Causa de Egreso: ${trabajador.causaEgreso}`, margin + 3, y + 20);

    y += 29;

    // Box: Salary Basis
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('BASES SALARIALES DE CÁLCULO (SALARIO INTEGRAL PETROLERO)', margin, y);
    y += 3.5;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    const basicoStr = `S. Básico: Bs. ${formatBs(calculo.salarioBasicoDiario)}`;
    const normalStr = `S. Normal (Inc. TV): Bs. ${formatBs(calculo.salarioNormalDiario)}`;
    const utilStr = `Alíc. Utilid. (${expediente.parametrosSnapshot.diasUtilidadesCCP}d): Bs. ${formatBs(calculo.alicuotaUtilidadesDiaria)}`;
    const vacStr = `Alíc. Vac. (${expediente.parametrosSnapshot.diasBonoVacacionalCCP}d): Bs. ${formatBs(calculo.alicuotaBonoVacacionalDiaria)}`;

    doc.text(`${basicoStr}    |    ${normalStr}    |    ${utilStr}    |    ${vacStr}`, margin, y);
    y += 4;

    doc.setFont('Helvetica', 'bold');
    doc.text(
      `Salario Integral Diario para Antigüedad: Bs. ${formatBs(calculo.salarioIntegralDiario)}`,
      margin,
      y
    );
    y += 6;

    // Table: Asignaciones Header
    doc.setFillColor(224, 231, 255);
    doc.rect(margin, y, pw - margin * 2, 5.5, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('CÓD.', margin + 2, y + 3.8);
    doc.text('CONCEPTOS DE ASIGNACIONES (HABERES BRUTOS)', margin + 14, y + 3.8);
    doc.text('BASE / DÍAS', pw - margin - 75, y + 3.8, { align: 'center' });
    doc.text('VALOR UNIT.', pw - margin - 40, y + 3.8, { align: 'right' });
    doc.text('TOTAL (Bs.)', pw - margin - 3, y + 3.8, { align: 'right' });

    y += 5.5;

    doc.setFont('Helvetica', 'normal');
    const itemsAsig = [
      {
        cod: '101',
        desc: `Prestaciones Sociales (${calculo.seleccionFavorable.metodoAplicado})`,
        dias: `${formatBs(calculo.garantiaTrimestral.diasTotalesGarantia)} Días`,
        unit: formatBs(calculo.salarioIntegralDiario),
        total: formatBs(calculo.seleccionFavorable.montoPrestacionesAplicado),
      },
      {
        cod: '102',
        desc: 'Intereses s/ Prestaciones Sociales (Art. 143 LOTTT)',
        dias: 'Saldo Acum.',
        unit: 'Tasas BCV',
        total: formatBs(calculo.garantiaTrimestral.interesesAcumuladosArt143),
      },
      {
        cod: '103',
        desc: 'Vacaciones Fraccionadas (Art. 190 LOTTT / CCP)',
        dias: `${formatBs(calculo.vacacionesFraccionadas.dias)} Días`,
        unit: formatBs(calculo.vacacionesFraccionadas.valorUnitario),
        total: formatBs(calculo.vacacionesFraccionadas.total),
      },
      {
        cod: '104',
        desc: 'Bono Vacacional Fraccionado (Art. 192 LOTTT / CCP)',
        dias: `${formatBs(calculo.bonoVacacionalFraccionado.dias)} Días`,
        unit: formatBs(calculo.bonoVacacionalFraccionado.valorUnitario),
        total: formatBs(calculo.bonoVacacionalFraccionado.total),
      },
      {
        cod: '105',
        desc: 'Utilidades Fraccionadas (Art. 131 LOTTT / CCP)',
        dias: `${formatBs(calculo.utilidadesFraccionadas.dias)} Días`,
        unit: formatBs(calculo.utilidadesFraccionadas.valorUnitario),
        total: formatBs(calculo.utilidadesFraccionadas.total),
      },
      {
        cod: '106',
        desc: 'Bonificación Especial Culminación Contrato CCP',
        dias: `${formatBs(calculo.bonificacionEspecialFiniquitoCCP.dias)} Días`,
        unit: formatBs(calculo.bonificacionEspecialFiniquitoCCP.valorUnitario),
        total: formatBs(calculo.bonificacionEspecialFiniquitoCCP.total),
      },
    ];

    if (calculo.indemnizacionDespidoArt92?.aplica) {
      itemsAsig.push({
        cod: '107',
        desc: 'Indemnización Despido Injustificado (Art. 92 LOTTT)',
        dias: '100% Prest.',
        unit: formatBs(calculo.seleccionFavorable.montoPrestacionesAplicado),
        total: formatBs(calculo.indemnizacionDespidoArt92.monto),
      });
    }

    itemsAsig.forEach((it) => {
      doc.text(it.cod, margin + 2, y + 3.8);
      doc.text(it.desc, margin + 14, y + 3.8);
      doc.text(it.dias, pw - margin - 75, y + 3.8, { align: 'center' });
      doc.text(it.unit, pw - margin - 40, y + 3.8, { align: 'right' });
      doc.setFont('Helvetica', 'bold');
      doc.text(it.total, pw - margin - 3, y + 3.8, { align: 'right' });
      doc.setFont('Helvetica', 'normal');
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 5, pw - margin, y + 5);
      y += 5.5;
    });

    // Total Asignaciones
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TOTAL ASIGNACIONES:', pw - margin - 50, y + 4, { align: 'right' });
    doc.text(`Bs. ${formatBs(calculo.totalAsignaciones)}`, pw - margin - 3, y + 4, {
      align: 'right',
    });
    y += 7.5;

    // Table: Deducciones Header
    doc.setFillColor(254, 226, 226);
    doc.rect(margin, y, pw - margin * 2, 5.5, 'F');
    doc.text('CÓD.', margin + 2, y + 3.8);
    doc.text('CONCEPTOS DE DEDUCCIONES DE LEY', margin + 14, y + 3.8);
    doc.text('BASE / PORCENTAJE', pw - margin - 55, y + 3.8, { align: 'center' });
    doc.text('TOTAL (Bs.)', pw - margin - 3, y + 3.8, { align: 'right' });

    y += 5.5;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    const itemsDeduc = [
      {
        cod: '501',
        desc: 'Retención IVSS Seguro Social (4% s/ Salario Normal)',
        base: '4,00% (Tope 5 SM)',
        total: formatBs(calculo.deducciones.ivss.total),
      },
      {
        cod: '502',
        desc: 'Retención Régimen Prestacional Empleo (0.5% SPF)',
        base: '0,50% (Tope 5 SM)',
        total: formatBs(calculo.deducciones.spf.total),
      },
      {
        cod: '503',
        desc: 'Retención FAOV / BANAVIH (1% s/ Asignaciones Base)',
        base: '1,00%',
        total: formatBs(calculo.deducciones.faov.total),
      },
      {
        cod: '504',
        desc: 'Retención INCES s/ Utilidades Fraccionadas (0.5% Art. 14)',
        base: `0,50% s/ Bs. ${formatBs(calculo.deducciones.inces.baseUtilidades)}`,
        total: formatBs(calculo.deducciones.inces.total),
      },
      {
        cod: '505',
        desc: 'Anticipos de Prestaciones Sociales Otorgados',
        base: 'Monto anticipado',
        total: formatBs(calculo.deducciones.anticipos),
      },
    ];

    itemsDeduc.forEach((it) => {
      doc.text(it.cod, margin + 2, y + 3.8);
      doc.text(it.desc, margin + 14, y + 3.8);
      doc.text(it.base, pw - margin - 55, y + 3.8, { align: 'center' });
      doc.setFont('Helvetica', 'bold');
      doc.text(it.total, pw - margin - 3, y + 3.8, { align: 'right' });
      doc.setFont('Helvetica', 'normal');
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 5, pw - margin, y + 5);
      y += 5.5;
    });

    // Total Deducciones
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TOTAL DEDUCCIONES:', pw - margin - 50, y + 4, { align: 'right' });
    doc.text(`Bs. ${formatBs(calculo.deducciones.totalDeducciones)}`, pw - margin - 3, y + 4, {
      align: 'right',
    });
    y += 8.5;

    // NET TO PAY HIGHLIGHT BOX
    doc.setFillColor(30, 58, 138); // Deep Navy Blue
    doc.rect(margin, y, pw - margin * 2, 10.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'bold');
    doc.text('NETO TOTAL A LIQUIDAR Y PAGAR AL TRABAJADOR:', margin + 4, y + 6.8);
    doc.setFontSize(12.5);
    doc.text(`Bs. ${formatBs(calculo.netoAPagar)}`, pw - margin - 4, y + 7.2, { align: 'right' });

    y += 13.5;
    doc.setTextColor(0, 0, 0);

    // Son en letras
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'bold');
    doc.text(`SON: ${calculo.netoEnLetras}`, margin, y);
    y += 5.5;

    // Statement text
    doc.setFontSize(6.2);
    doc.setFont('Helvetica', 'normal');
    const statementText = `Yo, ${trabajador.nombres} ${trabajador.apellidos}, titular de la C.I. N° ${trabajador.cedula}, declaro que he recibido de la empresa ${contratista.razonSocial}, a mi entera satisfacción, la cantidad de Bs. ${formatBs(calculo.netoAPagar)} por concepto de pago total y definitivo de mis Prestaciones Sociales, Intereses de Prestaciones Sociales acumulados, Vacaciones Fraccionadas, Bono Vacacional Fraccionado, Utilidades Fraccionadas y demás beneficios contractuales derivados de la culminación de mi contrato de trabajo por obra determinada en la industria petrolera y petroquímica, conforme a la LOTTT y la Convención Colectiva Petrolera, otorgando formal y definitivo finiquito y constancia de solvencia laboral.`;
    const lines = doc.splitTextToSize(statementText, pw - margin * 2);
    doc.text(lines, margin, y);

    y += lines.length * 2.8 + 7;

    // Signatures Block
    const colW = (pw - margin * 2) / 3;
    doc.setLineWidth(0.4);
    doc.setDrawColor(30, 41, 59);

    // Signature 1
    doc.line(margin + 4, y + 10, margin + colW - 4, y + 10);
    doc.setFontSize(6.8);
    doc.setFont('Helvetica', 'bold');
    doc.text('POR LA EMPRESA CONTRATISTA', margin + colW / 2, y + 13.5, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.text(`RIF: ${contratista.rif}`, margin + colW / 2, y + 16.5, { align: 'center' });

    // Signature 2
    const x2 = margin + colW;
    doc.line(x2 + 4, y + 10, x2 + colW - 4, y + 10);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.text('EL TRABAJADOR', x2 + colW / 2, y + 13.5, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.text(`C.I. ${trabajador.cedula}`, x2 + colW / 2, y + 16.5, { align: 'center' });

    // Fingerprint Box
    const x3 = margin + colW * 2 + 10;
    doc.rect(x3, y - 2, 22, 21, 'S');
    doc.setFontSize(5.8);
    doc.text('Huella Dactilar', x3 + 11, y + 7, { align: 'center' });
    doc.text('[Pulgar Der.]', x3 + 11, y + 12, { align: 'center' });

    const filename = `Recibo_${expediente.numeroExpediente}_${trabajador.cedula}.pdf`;
    doc.save(filename);
    return true;
  } catch (err) {
    console.error('Error generating direct vector PDF:', err);
    return false;
  }
}

/**
 * Universal print popup helper that opens a clean printable window with standard CSS styles
 */
export function openPrintableWindow(elementId: string): boolean {
  try {
    const el = document.getElementById(elementId);
    if (!el) {
      window.print();
      return true;
    }

    const printWin = window.open('', '_blank', 'width=900,height=1000');
    if (!printWin) {
      window.print();
      return true;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impresión de Finiquito Laboral</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #0f172a;
              background-color: #ffffff;
              padding: 20px;
              margin: 0;
            }
            .no-print, button, nav, header { display: none !important; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; }
            th, td { padding: 6px 8px; text-align: left; font-size: 11px; }
            th { border-bottom: 2px solid #0f172a; }
            .font-mono { font-family: monospace; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .border-b { border-bottom: 1px solid #cbd5e1; }
            .bg-slate-50 { background-color: #f8fafc; }
            .bg-slate-100 { background-color: #f1f5f9; }
            @page { size: letter portrait; margin: 15mm; }
          </style>
        </head>
        <body>
          ${el.outerHTML}
          <script>
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
    return true;
  } catch (err) {
    console.warn('Popup print window failed, falling back to window.print():', err);
    try {
      window.print();
    } catch (e) {
      console.error('window.print failed:', e);
    }
    return false;
  }
}

/**
 * Fallback html2canvas DOM export if vector export fails
 */
export async function generateCanvasPDF(
  elementOrId: HTMLElement | string,
  filename: string = 'Recibo_Liquidacion_Petrolera.pdf'
): Promise<boolean> {
  try {
    const targetElement =
      typeof elementOrId === 'string'
        ? document.getElementById(elementOrId)
        : elementOrId;

    if (!targetElement) return false;

    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const printWidth = pageWidth - margin * 2;
    const printHeight = (canvas.height * printWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, Math.min(printHeight, pageHeight - margin * 2));
    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('Canvas PDF export failed:', err);
    return false;
  }
}
