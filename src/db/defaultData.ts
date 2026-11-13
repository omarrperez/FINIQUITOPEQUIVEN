import { Contratista, TabuladorCargo, TasaBCV, ParametrosMaestros, ExpedienteLiquidacion } from '../types/settlement';
import { calcularLiquidacion, round2, TASA_BCV_OFICIAL_DEFAULT } from '../utils/calculator';

export const CONTRATISTAS_DEFAULT: Contratista[] = [
  {
    id: 'emp-crisbaorca',
    razonSocial: 'CRISBAORCA 2009, C.A.',
    rif: 'J-29711947-7',
    direccion: 'AV. VIA HOSPITAL RASETTI, BARCELONA, ANZOATEGUI',
    numeroContrato: 'ORNAMENTO SUPEROCTANOS',
    obraServicio: 'ORNAMENTO EN LA PLANTA DE SUPEROCTANOS C.A.',
    complejo: 'Planta de Superoctanos C.A. (Complejo Industrial José Antonio Anzoátegui)',
    clientePrincipal: 'Superoctanos C.A.',
  },
];

export const TABULADOR_DEFAULT: TabuladorCargo[] = [
  {
    id: 'cargo-sisdem-obrero',
    codigo: 'CCP-SISDEM-1',
    denominacion: 'OBRERO SISDEM',
    nivel: 1,
    salarioBasicoDiario: round2(14.0 * TASA_BCV_OFICIAL_DEFAULT), // $420.00 USD/mes ($14.00 USD/día) a tasa BCV 904,4485
    categoria: 'Operativa',
  },
  {
    id: 'cargo-inspector-siho',
    codigo: 'CCP-SIHO-2',
    denominacion: 'INSPECTOR SIHO',
    nivel: 5,
    salarioBasicoDiario: round2(20.0 * TASA_BCV_OFICIAL_DEFAULT), // $600.00 USD/mes ($20.00 USD/día) a tasa BCV 904,4485
    categoria: 'Supervisión',
  },
];

export const TASAS_BCV_DEFAULT: TasaBCV[] = [
  { id: 'bcv-01', mes: '2026-01', mesNombre: 'Enero 2026 (G.O. 43.322)', tasaActiva: 47.34, tasaPromedio: 47.34 },
  { id: 'bcv-02', mes: '2026-02', mesNombre: 'Febrero 2026 (G.O. 43.367)', tasaActiva: 47.10, tasaPromedio: 47.10 },
  { id: 'bcv-03', mes: '2026-03', mesNombre: 'Marzo 2026 (G.O. 43.361)', tasaActiva: 47.30, tasaPromedio: 47.30 },
  { id: 'bcv-04', mes: '2026-04', mesNombre: 'Abril 2026 (G.O. 43.380)', tasaActiva: 47.46, tasaPromedio: 47.46 },
  { id: 'bcv-05', mes: '2026-05', mesNombre: 'Mayo 2026 (G.O. 43.399)', tasaActiva: 47.52, tasaPromedio: 47.52 },
  { id: 'bcv-06', mes: '2026-06', mesNombre: 'Junio 2026 (G.O. 43.418)', tasaActiva: 47.56, tasaPromedio: 47.56 },
  { id: 'bcv-07', mes: '2026-07', mesNombre: 'Julio 2026 (G.O. 43.441)', tasaActiva: 47.52, tasaPromedio: 47.52 },
  { id: 'bcv-08', mes: '2026-08', mesNombre: 'Agosto 2026 (G.O. 43.464)', tasaActiva: 47.46, tasaPromedio: 47.46 },
  { id: 'bcv-09', mes: '2026-09', mesNombre: 'Septiembre 2026 (Ref. G.O. 43.464)', tasaActiva: 47.46, tasaPromedio: 47.46 },
  { id: 'bcv-10', mes: '2026-10', mesNombre: 'Octubre 2026 (Ref. G.O. 43.464)', tasaActiva: 47.46, tasaPromedio: 47.46 },
  { id: 'bcv-11', mes: '2026-11', mesNombre: 'Noviembre 2026 (Ref. G.O. 43.464)', tasaActiva: 47.46, tasaPromedio: 47.46 },
  { id: 'bcv-12', mes: '2026-12', mesNombre: 'Diciembre 2026 (Ref. G.O. 43.464)', tasaActiva: 47.46, tasaPromedio: 47.46 },
];

export const PARAMETROS_DEFAULT: ParametrosMaestros = {
  salarioMinimoUrbano: 130.0,
  diasUtilidadesCCP: 120,
  diasBonoVacacionalCCP: 55,
  diasVacacionesAnualesCCP: 34,
  diasBonificacionFiniquitoCCP: 15,
  tasaCambioBCV_USD: TASA_BCV_OFICIAL_DEFAULT, // 904,4485 Bs./USD al 12-11-2026
  tasasBCV: TASAS_BCV_DEFAULT,
  tabuladorCargos: TABULADOR_DEFAULT,
};

// 5 Trabajadores de CRISBAORCA 2009, C.A. a liquidar (Obra: Ornamento en Planta de Superoctanos C.A., 03/08/2026 al 24/11/2026)
const workersCrisbaorcaRaw = [
  { num: 6, nombres: 'JERRIS JOSE', apellidos: 'MOY CUPAMO', cedula: 'V-13.913.535', cargo: 'OBRERO SISDEM', cargoId: 'cargo-sisdem-obrero', usd: 420 },
  { num: 7, nombres: 'TONY', apellidos: 'JEREZ', cedula: 'V-16.853.581', cargo: 'OBRERO SISDEM', cargoId: 'cargo-sisdem-obrero', usd: 420 },
  { num: 8, nombres: 'JOHNNY JOSE', apellidos: 'REGES HEREDIA', cedula: 'V-12.574.627', cargo: 'OBRERO SISDEM', cargoId: 'cargo-sisdem-obrero', usd: 420 },
  { num: 9, nombres: 'JOSE LUIS', apellidos: 'HERNANDEZ', cedula: 'V-8.277.490', cargo: 'OBRERO SISDEM', cargoId: 'cargo-sisdem-obrero', usd: 420 },
  { num: 11, nombres: 'JHON EMILIO', apellidos: 'MACIAS MORALES', cedula: 'V-16.673.850', cargo: 'INSPECTOR SIHO', cargoId: 'cargo-inspector-siho', usd: 600 },
];

export const EXPEDIENTES_CRISBAORCA_LIST: ExpedienteLiquidacion[] = workersCrisbaorcaRaw.map((w, index) => {
  const salarioBasicoDiario = round2((w.usd / 30) * PARAMETROS_DEFAULT.tasaCambioBCV_USD);
  const trabajadorFicha = {
    cedula: w.cedula,
    nombres: w.nombres,
    apellidos: w.apellidos,
    cargoId: w.cargoId,
    cargoNombre: w.cargo,
    nivelCCP: w.usd >= 600 ? 5 : 1,
    salarioBasicoDiario,
    monedaEntrada: 'USD' as const,
    salarioMensualUSD: w.usd,
    turnoGuardia: '5x2' as const,
    tiempoViajeDiario: 0.0,
    otrasPrimasRegularesDiarias: 0.0,
    fechaIngreso: '2026-08-03',
    fechaEgreso: '2026-11-24',
    causaEgreso: 'Culminación de Contrato (Fin de Obra)' as const,
    escenarioCalculo: 'amplio_ccp' as const,
    clausula70Contratistas: true,
    anticiposOtorgados: 0.0,
    porcentajeISLR: 0.0,
    fechaPuestaDisposicion: '2026-11-28',
  };

  const calc = calcularLiquidacion(trabajadorFicha, PARAMETROS_DEFAULT);

  return {
    id: `exp-crisbaorca-00${index + 1}`,
    numeroExpediente: `LIQ-CRISBAORCA-2026-000${index + 1}`,
    fechaCreacion: '2026-11-24T12:00:00.000Z',
    fechaModificacion: '2026-11-24T12:00:00.000Z',
    contratista: CONTRATISTAS_DEFAULT[0],
    trabajador: trabajadorFicha,
    parametrosSnapshot: {
      diasUtilidadesCCP: PARAMETROS_DEFAULT.diasUtilidadesCCP,
      diasBonoVacacionalCCP: PARAMETROS_DEFAULT.diasBonoVacacionalCCP,
      diasVacacionesAnualesCCP: PARAMETROS_DEFAULT.diasVacacionesAnualesCCP,
      diasBonificacionFiniquitoCCP: PARAMETROS_DEFAULT.diasBonificacionFiniquitoCCP,
      salarioMinimoUrbano: PARAMETROS_DEFAULT.salarioMinimoUrbano,
      tasaCambioBCV_USD: PARAMETROS_DEFAULT.tasaCambioBCV_USD,
    },
    calculo: calc,
    estado: 'Auditado por Relaciones Laborales',
    notasInternas: `CRISBAORCA 2009, C.A. · Obra: Ornamento en Planta de Superoctanos C.A. (03/08/2026 al 24/11/2026). Cláusula 70 CCP. Sueldo mensual: $${w.usd}.00 USD (indexado a tasa oficial BCV).`,
  };
});
