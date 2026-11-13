/**
 * Tipos de datos para el Sistema de Liquidación de Prestaciones Sociales
 * de Contratistas Petroleras y Petroquímicas (Pequiven / PDVSA)
 * Regulado por LOTTT y Convención Colectiva Petrolera (CCP - FUPTV)
 */

export type TurnoGuardia = '5x2' | '1x1' | '7x7' | '2x4' | '3x6' | '5x10';
export type EscenarioCalculoCCP = 'estricto' | 'amplio_ccp';
export type MonedaEntrada = 'BS' | 'USD';

export interface TabuladorCargo {
  id: string;
  codigo: string;
  denominacion: string;
  nivel: number;
  salarioBasicoDiario: number;
  categoria: 'Operativa' | 'Mantenimiento' | 'Técnica' | 'Supervisión' | 'Ingeniería';
}

export interface Contratista {
  id: string;
  razonSocial: string;
  rif: string;
  numeroContrato: string;
  obraServicio: string;
  complejo: string; // Ej: Complejo Petroquímico Hugo Chávez (Morón) / Ana María Campos (El Tablazo) / Jose / Planta Superoctanos C.A.
  clientePrincipal: 'Pequiven' | 'PDVSA' | 'Empresa Mixta' | 'Superoctanos C.A.';
}

export interface TasaBCV {
  id: string;
  mes: string; // YYYY-MM
  mesNombre: string;
  tasaActiva: number; // Porcentaje anual (ej. 34.50)
  tasaPromedio: number; // Porcentaje anual (ej. 28.20)
}

export interface ParametrosMaestros {
  salarioMinimoUrbano: number; // Para tope de 5 SM (ej. 130 Bs.)
  diasUtilidadesCCP: number; // 120 a 180 días
  diasBonoVacacionalCCP: number; // 45 a 60 días (habitual 55 días en CCP)
  diasVacacionesAnualesCCP: number; // 34 días según CCP (frente a 15 min LOTTT)
  diasBonificacionFiniquitoCCP: number; // 15 a 30 días según cese de obra
  tasaCambioBCV_USD: number; // Para visualización bimonetaria referencial
  tasasBCV: TasaBCV[];
  tabuladorCargos: TabuladorCargo[];
}

export interface MesDevengado {
  mesAno: string; // YYYY-MM
  diasGarantiaAbonados: number; // 15 días trimestrales o 0 en meses intermedios
  diasAdicionales: number; // 2 días por año a partir del 2do año
  salarioIntegralDiario: number;
  abonoGarantiaMes: number;
  garantiaAcumulada: number;
  tasaBCVAplicada: number; // % anual
  interesMes: number;
  interesAcumulado: number;
}

export interface TrabajadorFicha {
  cedula: string;
  nombres: string;
  apellidos: string;
  cargoId: string;
  cargoNombre: string;
  nivelCCP: number;
  salarioBasicoDiario: number;
  monedaEntrada?: MonedaEntrada; // 'BS' o 'USD'
  salarioMensualUSD?: number; // Para referencia de nómina indexada ($420/mes ej. Obreros SISDEM)
  turnoGuardia: TurnoGuardia;
  tiempoViajeDiario: number; // Bs. por concepto de Tiempo de Viaje (TV)
  otrasPrimasRegularesDiarias: number; // Primas de riesgo, turno, etc.
  fechaIngreso: string; // YYYY-MM-DD
  fechaEgreso: string; // YYYY-MM-DD
  causaEgreso: 'Culminación de Contrato (Fin de Obra)' | 'Terminación por Tiempo Determinado' | 'Retiro Justificado' | 'Despido Injustificado';
  aplicaIndemnizacionArt92?: boolean; // "Doblete" por despido injustificado (Art. 92 LOTTT)
  escenarioCalculo?: EscenarioCalculoCCP; // 'estricto' (15d por trimestre vencido) o 'amplio_ccp' (30d por trimestre iniciado + fracción >15d = mes)
  clausula70Contratistas?: boolean; // Cláusula 70 CCP: Homologación a personal directo PDVSA
  anticiposOtorgados: number; // Bs.
  porcentajeISLR: number; // Planilla ARI (%)
  fechaPuestaDisposicion?: string; // Para auditoría de mora (Sandrea Pozo)
}

export interface DetalleCalculoLiquidacion {
  // Tiempos
  tiempoServicio: {
    anos: number;
    meses: number;
    dias: number;
    totalDias: number;
    fraccionMayor6Meses: boolean;
    trimestresCompletos: number;
  };

  // Salarios base (calculados con precisión)
  salarioBasicoDiario: number;
  salarioNormalDiario: number;
  alicuotaUtilidadesDiaria: number;
  alicuotaBonoVacacionalDiaria: number;
  salarioIntegralDiario: number;

  // Garantía Trimestral (Art. 142 literal A y B)
  garantiaTrimestral: {
    diasTotalesGarantia: number;
    diasAdicionalesAntiguedad: number;
    montoGarantia: number;
    interesesAcumuladosArt143: number;
    totalGarantiaMasIntereses: number;
    tablaMensual: MesDevengado[];
  };

  // Retroactividad (Art. 142 literal C)
  retroactividad: {
    diasAntiguedad: number;
    montoRetroactividad: number;
  };

  // Comparativa y selección favorable (Art. 142 literal D)
  seleccionFavorable: {
    metodoAplicado: 'Garantía Trimestral (Literal A + B)' | 'Retroactividad (Literal C)';
    montoPrestacionesAplicado: number;
    diferenciaFavorTrabajador: number;
    incluyeInteresesEnTotal: boolean;
  };

  // Haberes fraccionados
  vacacionesFraccionadas: {
    dias: number;
    valorUnitario: number;
    total: number;
  };
  bonoVacacionalFraccionado: {
    dias: number;
    valorUnitario: number;
    total: number;
  };
  utilidadesFraccionadas: {
    dias: number;
    valorUnitario: number;
    total: number;
  };
  bonificacionEspecialFiniquitoCCP: {
    dias: number;
    valorUnitario: number;
    total: number;
  };

  // Indemnización adicional por despido injustificado (Art. 92 LOTTT "Doblete")
  indemnizacionDespidoArt92: {
    aplica: boolean;
    monto: number;
    fundamentoLegal: string;
  };

  // Límite legal de anticipos (Art. 144 LOTTT - hasta el 75% del fondo)
  controlAnticiposArt144: {
    montoFondoAcumulado: number;
    limiteMaximo75Porciento: number;
    anticiposDeducidos: number;
    saldoRestanteFondo: number;
  };

  escenarioAplicado: EscenarioCalculoCCP;
  clausula70Aplicada: boolean;

  totalAsignaciones: number;

  // Deducciones
  deducciones: {
    ivss: {
      porcentaje: number;
      base: number;
      topeAplicado: boolean;
      total: number;
    };
    spf: {
      porcentaje: number;
      base: number;
      topeAplicado: boolean;
      total: number;
    };
    faov: {
      porcentaje: number;
      base: number;
      total: number;
    };
    inces: {
      porcentaje: number;
      baseUtilidades: number; // Estrictamente sobre utilidades fraccionadas
      total: number;
    };
    islr: {
      porcentaje: number;
      baseGravable: number;
      total: number;
    };
    anticipos: number;
    totalDeducciones: number;
  };

  netoAPagar: number;
  netoEnLetras: string;
  netoEquivalenteUSD: number;

  // Auditoría de mora (Sandrea Pozo 2017)
  auditoriaMora: {
    diasMora: number;
    interesMoratorioLegalLOTTT: number;
    aplicaSancion3SalariosPDVSA: boolean; // Falso para contratistas salvo pacto
    observacionJuridica: string;
  };
}

export interface ExpedienteLiquidacion {
  id: string;
  numeroExpediente: string;
  fechaCreacion: string;
  fechaModificacion: string;
  contratista: Contratista;
  trabajador: TrabajadorFicha;
  parametrosSnapshot: {
    diasUtilidadesCCP: number;
    diasBonoVacacionalCCP: number;
    diasBonificacionFiniquitoCCP: number;
    salarioMinimoUrbano: number;
    tasaCambioBCV_USD: number;
  };
  calculo: DetalleCalculoLiquidacion;
  estado: 'Borrador' | 'Auditado por Relaciones Laborales' | 'Finiquitado y Pagado';
  notasInternas?: string;
}
