import {
  TrabajadorFicha,
  ParametrosMaestros,
  DetalleCalculoLiquidacion,
  MesDevengado,
} from '../types/settlement';
import { numeroALetras } from './numberToWords';

export const TASA_BCV_OFICIAL_DEFAULT = 904.4485;

/**
 * Redondeo financiero a 2 decimales evitando redondeos intermedios prematuros
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Formateo en Bolívares con estándar venezolano (punto para miles, coma para decimales)
 * Ej: 119035.8 -> "119.035,80"
 */
export function formatBs(num: number, decimals: number = 2): string {
  if (isNaN(num) || num === null || num === undefined) return '0,00';
  return num.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Cuenta los lunes calendario contenidos en el mes de egreso (o desde fechaIngreso si es el mismo mes)
 * hasta la fecha de egreso inclusive, según el Reglamento de la Ley del Seguro Social (IVSS / SPF).
 */
export function contarLunesMesEgreso(fechaIngresoStr: string, fechaEgresoStr: string): number {
  const dIngreso = new Date(fechaIngresoStr + 'T00:00:00');
  const dEgreso = new Date(fechaEgresoStr + 'T00:00:00');
  if (isNaN(dIngreso.getTime()) || isNaN(dEgreso.getTime()) || dEgreso < dIngreso) {
    return 4;
  }

  const inicioMesEgreso = new Date(dEgreso.getFullYear(), dEgreso.getMonth(), 1);
  const fechaInicioConteo = dIngreso > inicioMesEgreso ? dIngreso : inicioMesEgreso;

  let lunes = 0;
  const cursor = new Date(fechaInicioConteo.getTime());
  while (cursor <= dEgreso) {
    if (cursor.getDay() === 1) {
      lunes += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return Math.max(1, lunes);
}

/**
 * Cálculo exacto de tiempo de servicio en Años, Meses y Días
 */
export function calcularTiempoServicio(fechaIngresoStr: string, fechaEgresoStr: string) {
  const dIngreso = new Date(fechaIngresoStr + 'T00:00:00');
  const dEgreso = new Date(fechaEgresoStr + 'T00:00:00');

  if (isNaN(dIngreso.getTime()) || isNaN(dEgreso.getTime()) || dEgreso < dIngreso) {
    return {
      anos: 0,
      meses: 0,
      dias: 0,
      totalDias: 0,
      fraccionMayor6Meses: false,
      trimestresCompletos: 0,
      trimestresIniciados: 0,
      mesesComputablesFracciones: 0,
      mesesEstrictoFracciones: 0,
    };
  }

  const diffTime = Math.abs(dEgreso.getTime() - dIngreso.getTime());
  const totalDias = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive

  const y1 = dIngreso.getFullYear();
  const m1 = dIngreso.getMonth();
  const d1 = dIngreso.getDate();

  const y2 = dEgreso.getFullYear();
  const m2 = dEgreso.getMonth();
  const d2 = dEgreso.getDate();

  let dias = d2 - d1;
  let meses = m2 - m1;
  let anos = y2 - y1;

  if (dias < 0) {
    const prevMonthDays = new Date(y2, m2, 0).getDate();
    dias += prevMonthDays;
    meses -= 1;
  }

  if (meses < 0) {
    meses += 12;
    anos -= 1;
  }

  const mesesTotales = anos * 12 + meses;

  // Fracción superior a 15 días computa como mes completo en el criterio amplio CCP
  const mesesComputablesFracciones = Math.max(
    1,
    dias > 15 ? mesesTotales + 1 : mesesTotales
  );
  const mesesEstrictoFracciones = Math.max(1, mesesTotales);

  // Fracción superior a 6 meses para retroactividad (Art. 142 literal c)
  const fraccionMayor6Meses = meses > 6 || (meses === 6 && dias > 0);

  // Trimestres completos de garantía
  const trimestresCompletos = Math.floor(mesesTotales / 3);

  // Trimestres iniciados (Art. 142-a LOTTT / criterio amplio CCP: el inicio del trimestre genera derecho al depósito)
  const mesesRemanentes = mesesTotales % 3;
  const trimestreIniciadoExtra = mesesRemanentes > 0 || dias > 0 ? 1 : 0;
  const trimestresIniciados = trimestresCompletos + trimestreIniciadoExtra;

  return {
    anos,
    meses,
    dias,
    totalDias,
    fraccionMayor6Meses,
    trimestresCompletos,
    trimestresIniciados,
    mesesComputablesFracciones,
    mesesEstrictoFracciones,
  };
}

/**
 * Motor numérico principal de 4 capas para liquidación CCP & LOTTT
 */
export function calcularLiquidacion(
  trabajador: TrabajadorFicha,
  parametros: ParametrosMaestros
): DetalleCalculoLiquidacion {
  const tiempo = calcularTiempoServicio(trabajador.fechaIngreso, trabajador.fechaEgreso);
  const escenario = trabajador.escenarioCalculo || 'amplio_ccp';
  const tasaUSD = parametros.tasaCambioBCV_USD || TASA_BCV_OFICIAL_DEFAULT;

  // 1. Salario Básico y Salario Normal Diario
  // Si el salario está indexado en USD, siempre deriva del sueldo USD a la tasa oficial BCV vigente
  let salarioBasico = Number(trabajador.salarioBasicoDiario) || 0;
  if (trabajador.monedaEntrada === 'USD' && trabajador.salarioMensualUSD && trabajador.salarioMensualUSD > 0) {
    salarioBasico = round2((trabajador.salarioMensualUSD / 30) * tasaUSD);
  }

  const tiempoViaje = Number(trabajador.tiempoViajeDiario) || 0;
  const otrasPrimas = Number(trabajador.otrasPrimasRegularesDiarias) || 0;
  const salarioNormalDiario = round2(salarioBasico + tiempoViaje + otrasPrimas);

  // 2. Alícuotas Convención Colectiva Petrolera (CCP)
  // Alícuota Utilidades = (Días Utilidades * Salario Normal) / 360 (o Básico si TV=0)
  // Alícuota Bono Vacacional = (Días Bono Vacacional * Salario Normal) / 360
  const diasUtilidades = parametros.diasUtilidadesCCP || 120;
  const diasBonoVac = parametros.diasBonoVacacionalCCP || 55;

  const alicuotaUtilidadesDiaria = round2((diasUtilidades * salarioBasico) / 360);
  const alicuotaBonoVacacionalDiaria = round2((diasBonoVac * salarioBasico) / 360);

  // Salario Integral Diario Petrolero:
  // Salario Básico + Tiempo de Viaje + Primas + Alícuota Utilidades + Alícuota Bono Vacacional
  const salarioIntegralDiario = round2(
    salarioBasico + alicuotaUtilidadesDiaria + alicuotaBonoVacacionalDiaria + tiempoViaje + otrasPrimas
  );

  // 3. Garantía Trimestral de Prestaciones (Art. 142 literal A y B)
  const trimestresGarantia =
    escenario === 'amplio_ccp' ? tiempo.trimestresIniciados : tiempo.trimestresCompletos;
  const diasGarantiaTrimestres = trimestresGarantia * 15;

  // Días adicionales de antigüedad (Literal B): 2 días por año a partir del 2do año, máx 30 días
  let diasAdicionalesAntiguedad = 0;
  if (tiempo.anos >= 2) {
    diasAdicionalesAntiguedad = Math.min((tiempo.anos - 1) * 2, 30);
  }

  const diasTotalesGarantia = diasGarantiaTrimestres + diasAdicionalesAntiguedad;
  const montoGarantia = round2(diasTotalesGarantia * salarioIntegralDiario);

  // Generación de la tabla mensual de garantía e intereses (Art. 143 LOTTT)
  // Mapea los meses calendario reales desde fechaIngreso hasta fechaEgreso contra las tasas BCV
  const tablaMensual: MesDevengado[] = [];
  let saldoAcumulado = 0;
  let interesAcumulado = 0;

  const dIngreso = new Date(trabajador.fechaIngreso + 'T00:00:00');
  const mesesCompletosServicio = tiempo.anos * 12 + tiempo.meses;
  const numMesesTabla = Math.max(1, mesesCompletosServicio + (tiempo.dias > 0 ? 1 : 0));

  let diasAdicionalesRestantes = diasAdicionalesAntiguedad;

  for (let i = 0; i < numMesesTabla; i++) {
    const mesIndex = i + 1;
    let mesClave = `Mes ${mesIndex}`;
    if (!isNaN(dIngreso.getTime())) {
      const fechaMes = new Date(dIngreso.getFullYear(), dIngreso.getMonth() + i, 1);
      const yyyy = fechaMes.getFullYear();
      const mm = String(fechaMes.getMonth() + 1).padStart(2, '0');
      mesClave = `${yyyy}-${mm}`;
    }

    // En criterio amplio (Art. 142-a: "desde el momento de iniciar el trimestre"), se abona al inicio de c/trimestre (i % 3 === 0)
    // En criterio estricto, se abona al vencimiento de c/trimestre completo ((i + 1) % 3 === 0)
    let diasAbono = 0;
    if (escenario === 'amplio_ccp') {
      if (i % 3 === 0 && i / 3 < trimestresGarantia) {
        diasAbono = 15;
      }
    } else {
      if ((i + 1) % 3 === 0 && Math.floor((i + 1) / 3) <= trimestresGarantia) {
        diasAbono = 15;
      }
    }

    // Días adicionales por año a partir del 2do año
    let diasAdicMes = 0;
    if (diasAdicionalesRestantes > 0 && mesIndex >= 24 && mesIndex % 12 === 0) {
      diasAdicMes = Math.min(2, diasAdicionalesRestantes);
      diasAdicionalesRestantes -= diasAdicMes;
    }

    const totalDiasMes = diasAbono + diasAdicMes;
    const abonoMes = round2(totalDiasMes * salarioIntegralDiario);
    saldoAcumulado = round2(saldoAcumulado + abonoMes);

    const tasaObj = parametros.tasasBCV?.find((t) => t.mes === mesClave);
    const tasaAnual = tasaObj
      ? (tasaObj.tasaPromedio || tasaObj.tasaActiva)
      : parametros.tasasBCV && parametros.tasasBCV.length > 0
        ? (parametros.tasasBCV[parametros.tasasBCV.length - 1].tasaPromedio ||
            parametros.tasasBCV[parametros.tasasBCV.length - 1].tasaActiva)
        : 47.46;

    const esUltimoMesParcial = i === numMesesTabla - 1 && tiempo.dias > 0;
    const factorTiempoMes = esUltimoMesParcial ? tiempo.dias / 30 : 1;

    const tasaMensual = (tasaAnual / 100) / 12;
    const interesMes = round2(saldoAcumulado * tasaMensual * factorTiempoMes);
    interesAcumulado = round2(interesAcumulado + interesMes);

    tablaMensual.push({
      mesAno: mesClave,
      diasGarantiaAbonados: diasAbono,
      diasAdicionales: diasAdicMes,
      salarioIntegralDiario,
      abonoGarantiaMes: abonoMes,
      garantiaAcumulada: saldoAcumulado,
      tasaBCVAplicada: tasaAnual,
      interesMes,
      interesAcumulado,
    });
  }

  const interesesAcumuladosArt143 = round2(interesAcumulado);
  const totalGarantiaMasIntereses = round2(montoGarantia + interesesAcumuladosArt143);

  // 4. Retroactividad de Prestaciones Sociales (Art. 142 literal C)
  // 30 días de salario integral por cada año de servicio o fracción superior a 6 meses
  let anosComputablesRetroactividad = tiempo.anos;
  if (tiempo.fraccionMayor6Meses) {
    anosComputablesRetroactividad += 1;
  }
  const diasAntiguedadRetroactiva = anosComputablesRetroactividad * 30;
  const montoRetroactividad = round2(diasAntiguedadRetroactiva * salarioIntegralDiario);

  // 5. Comparativa y Selección Automática Favorable (Art. 142 literal D)
  const garantiaEsSuperior = totalGarantiaMasIntereses >= montoRetroactividad;

  let metodoAplicado: 'Garantía Trimestral (Literal A + B)' | 'Retroactividad (Literal C)';
  let montoPrestacionesAplicado: number;
  let incluyeInteresesEnTotal: boolean;
  let diferenciaFavorTrabajador: number;

  if (garantiaEsSuperior) {
    metodoAplicado = 'Garantía Trimestral (Literal A + B)';
    montoPrestacionesAplicado = montoGarantia;
    incluyeInteresesEnTotal = true;
    diferenciaFavorTrabajador = round2(totalGarantiaMasIntereses - montoRetroactividad);
  } else {
    metodoAplicado = 'Retroactividad (Literal C)';
    montoPrestacionesAplicado = montoRetroactividad;
    incluyeInteresesEnTotal = false;
    diferenciaFavorTrabajador = round2(montoRetroactividad - totalGarantiaMasIntereses);
  }

  // 6. Haberes Fraccionados (Sobre Salario Normal Diario)
  // En criterio amplio CCP, fracción > 15 días computa como mes completo (ej: 3m 21d = 4 meses)
  // En criterio estricto, solo meses enteros cumplidos (ej: 3m 21d = 3 meses)
  const mesesFracciones =
    escenario === 'amplio_ccp'
      ? tiempo.mesesComputablesFracciones
      : tiempo.mesesEstrictoFracciones;

  // Vacaciones Fraccionadas: CCP prevé 34 días anuales convencionales (Art. 190 LOTTT mínimo 15d)
  const baseDiasVacacionesAnuales = parametros.diasVacacionesAnualesCCP || 34;
  const diasVacaciones = round2((baseDiasVacacionesAnuales / 12) * mesesFracciones);
  const totalVacaciones = round2(diasVacaciones * salarioNormalDiario);

  // Bono Vacacional Fraccionado: Días de bono CCP (habitual 55 días) / 12 * meses
  const diasBonoVacacional = round2((diasBonoVac / 12) * mesesFracciones);
  const totalBonoVacacional = round2(diasBonoVacacional * salarioNormalDiario);

  // Utilidades Fraccionadas: 120 días CCP / 12 * meses
  const diasUtilidadesFrac = round2((diasUtilidades / 12) * mesesFracciones);
  const totalUtilidades = round2(diasUtilidadesFrac * salarioNormalDiario);

  // Bonificación Especial por Culminación de Contrato CCP (Arts. 83 y 87 LOTTT / Cláusula Finiquito Obra)
  const diasBonifFiniquito = parametros.diasBonificacionFiniquitoCCP || 15;
  const totalBonifFiniquito = round2(diasBonifFiniquito * salarioNormalDiario);

  // 7. Indemnización por Despido Injustificado (Art. 92 LOTTT "Doblete")
  const aplicaArt92 =
    Boolean(trabajador.aplicaIndemnizacionArt92) ||
    trabajador.causaEgreso === 'Despido Injustificado';

  const montoIndemnizacionArt92 = aplicaArt92 ? montoPrestacionesAplicado : 0;

  // Total Asignaciones Brutas
  const totalAsignaciones = round2(
    montoPrestacionesAplicado +
      (incluyeInteresesEnTotal ? interesesAcumuladosArt143 : 0) +
      totalVacaciones +
      totalBonoVacacional +
      totalUtilidades +
      totalBonifFiniquito +
      montoIndemnizacionArt92
  );

  // 8. Deducciones Legales Obligatorias
  // Fórmula oficial IVSS / SPF (Tope 5 Salarios Mínimos Nacionales = 650,00 Bs/mes -> 150,00 Bs/semana):
  // Se cotizan los lunes calendario correspondientes al mes de egreso (4 lunes en Nov 2026 al 24/11/2026)
  const salarioMinimo = parametros.salarioMinimoUrbano || 130;
  const tope5SM = 5 * salarioMinimo; // 650,00 Bs. mensual
  const salarioMensualReal = salarioNormalDiario * 30;
  const topeAplicado = salarioMensualReal >= tope5SM;
  const baseMensualCotizable = Math.min(salarioMensualReal, tope5SM);
  const baseSemanalReal = round2((baseMensualCotizable * 12) / 52); // 150,00 Bs./semana cuando aplica el tope
  const lunesMesEgreso = contarLunesMesEgreso(trabajador.fechaIngreso, trabajador.fechaEgreso);

  const ivssTotal = round2(baseSemanalReal * 0.04 * lunesMesEgreso); // 150 * 4% = 6,00 Bs/semana
  const spfTotal = round2(baseSemanalReal * 0.005 * lunesMesEgreso); // 150 * 0.5% = 0,75 Bs/semana

  // FAOV (1% sobre devengos salariales de liquidación: vacaciones, bono vacacional, utilidades, finiquito)
  const baseFaov = round2(totalVacaciones + totalBonoVacacional + totalUtilidades + totalBonifFiniquito);
  const faovTotal = round2(baseFaov * 0.01);

  // INCES: 0.5% EXCLUSIVAMENTE sobre Utilidades Fraccionadas (Art. 14 Ley del INCES)
  const incesTotal = round2(totalUtilidades * 0.005);

  // ISLR: Exención expresa de prestaciones sociales e intereses (Art. 143)
  const porcentajeISLR = Number(trabajador.porcentajeISLR) || 0;
  const baseGravableISLR = totalUtilidades + totalBonoVacacional;
  const islrTotal = round2(baseGravableISLR * (porcentajeISLR / 100));

  const anticipos = Number(trabajador.anticiposOtorgados) || 0;

  const totalDeducciones = round2(
    ivssTotal + spfTotal + faovTotal + incesTotal + islrTotal + anticipos
  );

  const netoAPagar = round2(totalAsignaciones - totalDeducciones);
  const netoEnLetras = numeroALetras(netoAPagar, 'BOLÍVARES');
  const netoEquivalenteUSD = round2(netoAPagar / tasaUSD);

  // Control de Anticipos Art. 144 LOTTT (Límite legal del 75%)
  const limiteMaximo75 = round2(montoGarantia * 0.75);
  const saldoRestanteFondo = Math.max(0, round2(montoGarantia - anticipos));

  // 9. Módulo de Auditoría de Mora (Jurisprudencia Sandrea Pozo 2017)
  let diasMora = 0;
  let interesMoratorioLegalLOTTT = 0;
  let observacionJuridica = 'Pago dentro del lapso legal o fecha de disposición formal.';

  if (trabajador.fechaPuestaDisposicion && trabajador.fechaEgreso) {
    const dEgreso = new Date(trabajador.fechaEgreso + 'T00:00:00');
    const dDisp = new Date(trabajador.fechaPuestaDisposicion + 'T00:00:00');
    if (dDisp > dEgreso) {
      const diffDays = Math.floor((dDisp.getTime() - dEgreso.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 5) {
        diasMora = diffDays - 5;
        const mesEgresoClave = trabajador.fechaEgreso.slice(0, 7);
        const tasaEgresoObj = parametros.tasasBCV?.find((t) => t.mes === mesEgresoClave);
        const tasaMoraAnual = tasaEgresoObj
          ? (tasaEgresoObj.tasaActiva || tasaEgresoObj.tasaPromedio)
          : 47.46;
        const tasaDiariaMora = tasaMoraAnual / 100 / 360;
        interesMoratorioLegalLOTTT = round2(netoAPagar * tasaDiariaMora * diasMora);
        observacionJuridica = `Transcurrieron ${diasMora} días hábiles/continuos en mora. Según la doctrina de Sandrea Pozo (2017), a las contratistas NO les aplica la sanción punitiva de 3 salarios diarios de la nómina directa PDVSA, sino los intereses moratorios de ley (Art. 143 LOTTT y Art. 92 CRBV), blindando a la empresa ante demandas infladas.`;
      }
    }
  }

  return {
    tiempoServicio: {
      anos: tiempo.anos,
      meses: tiempo.meses,
      dias: tiempo.dias,
      totalDias: tiempo.totalDias,
      fraccionMayor6Meses: tiempo.fraccionMayor6Meses,
      trimestresCompletos: tiempo.trimestresCompletos,
    },
    salarioBasicoDiario: salarioBasico,
    salarioNormalDiario,
    alicuotaUtilidadesDiaria,
    alicuotaBonoVacacionalDiaria,
    salarioIntegralDiario,
    garantiaTrimestral: {
      diasTotalesGarantia,
      diasAdicionalesAntiguedad,
      montoGarantia,
      interesesAcumuladosArt143,
      totalGarantiaMasIntereses,
      tablaMensual,
    },
    retroactividad: {
      diasAntiguedad: diasAntiguedadRetroactiva,
      montoRetroactividad,
    },
    seleccionFavorable: {
      metodoAplicado,
      montoPrestacionesAplicado,
      diferenciaFavorTrabajador,
      incluyeInteresesEnTotal,
    },
    vacacionesFraccionadas: {
      dias: diasVacaciones,
      valorUnitario: salarioNormalDiario,
      total: totalVacaciones,
    },
    bonoVacacionalFraccionado: {
      dias: diasBonoVacacional,
      valorUnitario: salarioNormalDiario,
      total: totalBonoVacacional,
    },
    utilidadesFraccionadas: {
      dias: diasUtilidadesFrac,
      valorUnitario: salarioNormalDiario,
      total: totalUtilidades,
    },
    bonificacionEspecialFiniquitoCCP: {
      dias: diasBonifFiniquito,
      valorUnitario: salarioNormalDiario,
      total: totalBonifFiniquito,
    },
    indemnizacionDespidoArt92: {
      aplica: aplicaArt92,
      monto: montoIndemnizacionArt92,
      fundamentoLegal:
        'Indemnización equivalente a las prestaciones sociales por terminación injustificada (Art. 92 LOTTT)',
    },
    controlAnticiposArt144: {
      montoFondoAcumulado: montoGarantia,
      limiteMaximo75Porciento: limiteMaximo75,
      anticiposDeducidos: anticipos,
      saldoRestanteFondo,
    },
    escenarioAplicado: escenario,
    clausula70Aplicada: Boolean(trabajador.clausula70Contratistas ?? true),
    totalAsignaciones,
    deducciones: {
      ivss: {
        porcentaje: 4,
        base: salarioNormalDiario,
        topeAplicado,
        semanasCotizadas: lunesMesEgreso,
        baseSemanal: baseSemanalReal,
        total: ivssTotal,
      },
      spf: {
        porcentaje: 0.5,
        base: salarioNormalDiario,
        topeAplicado,
        semanasCotizadas: lunesMesEgreso,
        baseSemanal: baseSemanalReal,
        total: spfTotal,
      },
      faov: {
        porcentaje: 1,
        base: baseFaov,
        total: faovTotal,
      },
      inces: {
        porcentaje: 0.5,
        baseUtilidades: totalUtilidades,
        total: incesTotal,
      },
      islr: {
        porcentaje: porcentajeISLR,
        baseGravable: baseGravableISLR,
        total: islrTotal,
      },
      anticipos,
      totalDeducciones,
    },
    netoAPagar,
    netoEnLetras,
    netoEquivalenteUSD,
    auditoriaMora: {
      diasMora,
      interesMoratorioLegalLOTTT,
      aplicaSancion3SalariosPDVSA: false,
      observacionJuridica,
    },
  };
}
