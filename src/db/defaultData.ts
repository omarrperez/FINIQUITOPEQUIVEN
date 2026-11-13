import { Contratista, TabuladorCargo, TasaBCV, ParametrosMaestros, ExpedienteLiquidacion } from '../types/settlement';
import { calcularLiquidacion } from '../utils/calculator';

export const CONTRATISTAS_DEFAULT: Contratista[] = [
  {
    id: 'emp-01',
    razonSocial: 'CONTRATISTA PETROLERA DE VENEZUELA, C.A.',
    rif: 'J-30999888-1',
    numeroContrato: '4600098765',
    obraServicio: 'MANTENIMIENTO INTEGRAL DE PLANTAS Y OLEODUCTOS',
    complejo: 'Complejo Petroquímico Ana María Campos (El Tablazo)',
    clientePrincipal: 'Pequiven',
  },
  {
    id: 'emp-superoctanos',
    razonSocial: 'SERVICIOS Y MONTAJES AMBIENTALES DE ORIENTE, C.A.',
    rif: 'J-31889901-2',
    numeroContrato: '4600123890',
    obraServicio: 'ORNAMENTO Y LIMPIEZA INDUSTRIAL EN PLANTA',
    complejo: 'Planta de Superoctanos C.A. (Complejo Industrial José Antonio Anzoátegui)',
    clientePrincipal: 'Superoctanos C.A.',
  },
  {
    id: 'emp-02',
    razonSocial: 'SERVICIOS INDUSTRIALES MORÓN, C.A.',
    rif: 'J-40221345-6',
    numeroContrato: '4600102384',
    obraServicio: 'PARADA DE PLANTA DE AMONÍACO Y FERTILIZANTES',
    complejo: 'Complejo Petroquímico Hugo Chávez (Morón)',
    clientePrincipal: 'Pequiven',
  },
  {
    id: 'emp-03',
    razonSocial: 'PETROSERVICIOS Y MONTAJES DEL CARIBE, S.A.',
    rif: 'J-31456789-0',
    numeroContrato: '4600078912',
    obraServicio: 'REHABILITACIÓN DE SISTEMAS DE BOMBEO Y TANQUES',
    complejo: 'Complejo Industrial José Antonio Anzoátegui (Jose)',
    clientePrincipal: 'PDVSA',
  },
];

export const TABULADOR_DEFAULT: TabuladorCargo[] = [
  {
    id: 'cargo-sisdem-obrero',
    codigo: 'CCP-SISDEM-1',
    denominacion: 'OBRERO GENERAL SISDEM (PLANTA SUPEROCTANOS)',
    nivel: 1,
    salarioBasicoDiario: 935.20, // $14.00 USD/día a tasa BCV 66.80
    categoria: 'Operativa',
  },
  {
    id: 'cargo-1',
    codigo: 'CCP-N1',
    denominacion: 'OBRERO GENERAL DE PLANTA',
    nivel: 1,
    salarioBasicoDiario: 280.0,
    categoria: 'Operativa',
  },
  {
    id: 'cargo-2',
    codigo: 'CCP-N2',
    denominacion: 'AYUDANTE DE MECÁNICA Y TUBERÍA',
    nivel: 2,
    salarioBasicoDiario: 340.0,
    categoria: 'Operativa',
  },
  {
    id: 'cargo-3',
    codigo: 'CCP-N3',
    denominacion: 'OPERADOR DE PLANTA PETROQUÍMICA',
    nivel: 3,
    salarioBasicoDiario: 395.0,
    categoria: 'Operativa',
  },
  {
    id: 'cargo-4',
    codigo: 'CCP-N4',
    denominacion: 'MECÁNICO DE MANTENIMIENTO INDUSTRIAL',
    nivel: 4,
    salarioBasicoDiario: 450.0,
    categoria: 'Mantenimiento',
  },
  {
    id: 'cargo-5',
    codigo: 'CCP-N5',
    denominacion: 'SOLDADOR DE ALTA PRESIÓN 6G',
    nivel: 5,
    salarioBasicoDiario: 520.0,
    categoria: 'Mantenimiento',
  },
  {
    id: 'cargo-6',
    codigo: 'CCP-N6',
    denominacion: 'TÉCNICO INSTRUMENTISTA Y CALIBRADOR',
    nivel: 6,
    salarioBasicoDiario: 590.0,
    categoria: 'Técnica',
  },
  {
    id: 'cargo-7',
    codigo: 'CCP-N7',
    denominacion: 'SUPERVISOR DE SEGURIDAD INDUSTRIAL (SHA)',
    nivel: 7,
    salarioBasicoDiario: 680.0,
    categoria: 'Supervisión',
  },
  {
    id: 'cargo-8',
    codigo: 'CCP-N8',
    denominacion: 'INGENIERO RESIDENTE DE OBRA PETROLERA',
    nivel: 8,
    salarioBasicoDiario: 840.0,
    categoria: 'Ingeniería',
  },
];

export const TASAS_BCV_DEFAULT: TasaBCV[] = [
  { id: 'bcv-01', mes: '2026-01', mesNombre: 'Enero 2026', tasaActiva: 34.20, tasaPromedio: 28.50 },
  { id: 'bcv-02', mes: '2026-02', mesNombre: 'Febrero 2026', tasaActiva: 33.80, tasaPromedio: 28.10 },
  { id: 'bcv-03', mes: '2026-03', mesNombre: 'Marzo 2026', tasaActiva: 34.50, tasaPromedio: 28.70 },
  { id: 'bcv-04', mes: '2026-04', mesNombre: 'Abril 2026', tasaActiva: 35.10, tasaPromedio: 29.20 },
  { id: 'bcv-05', mes: '2026-05', mesNombre: 'Mayo 2026', tasaActiva: 34.90, tasaPromedio: 29.00 },
  { id: 'bcv-06', mes: '2026-06', mesNombre: 'Junio 2026', tasaActiva: 35.40, tasaPromedio: 29.50 },
  { id: 'bcv-07', mes: '2026-07', mesNombre: 'Julio 2026', tasaActiva: 35.80, tasaPromedio: 29.80 },
  { id: 'bcv-08', mes: '2026-08', mesNombre: 'Agosto 2026', tasaActiva: 36.10, tasaPromedio: 30.10 },
  { id: 'bcv-09', mes: '2026-09', mesNombre: 'Septiembre 2026', tasaActiva: 36.30, tasaPromedio: 30.40 },
  { id: 'bcv-10', mes: '2026-10', mesNombre: 'Octubre 2026', tasaActiva: 36.00, tasaPromedio: 30.20 },
  { id: 'bcv-11', mes: '2026-11', mesNombre: 'Noviembre 2026', tasaActiva: 35.90, tasaPromedio: 30.00 },
  { id: 'bcv-12', mes: '2026-12', mesNombre: 'Diciembre 2026', tasaActiva: 36.20, tasaPromedio: 30.30 },
];

export const PARAMETROS_DEFAULT: ParametrosMaestros = {
  salarioMinimoUrbano: 130.0,
  diasUtilidadesCCP: 120,
  diasBonoVacacionalCCP: 55, // 55 días habituales de la CCP
  diasVacacionesAnualesCCP: 34, // 34 días según CCP
  diasBonificacionFiniquitoCCP: 15,
  tasaCambioBCV_USD: 66.80,
  tasasBCV: TASAS_BCV_DEFAULT,
  tabuladorCargos: TABULADOR_DEFAULT,
};

// Caso oficial 1: Carlos Eduardo Mendoza Pérez (Mantenimiento Pequiven)
const trabajadorOficialCarlos = {
  cedula: 'V-16.789.012',
  nombres: 'CARLOS EDUARDO',
  apellidos: 'MENDOZA PÉREZ',
  cargoId: 'cargo-4',
  cargoNombre: 'MECÁNICO DE MANTENIMIENTO INDUSTRIAL (Tabulador CCP - Nivel 4)',
  nivelCCP: 4,
  salarioBasicoDiario: 450.0,
  turnoGuardia: '5x2' as const,
  tiempoViajeDiario: 70.0,
  otrasPrimasRegularesDiarias: 0.0,
  fechaIngreso: '2026-01-15',
  fechaEgreso: '2026-11-11',
  causaEgreso: 'Culminación de Contrato (Fin de Obra)' as const,
  escenarioCalculo: 'amplio_ccp' as const,
  clausula70Contratistas: true,
  anticiposOtorgados: 0.0,
  porcentajeISLR: 0.0,
  fechaPuestaDisposicion: '2026-11-14',
};

// Caso oficial 2: José Suárez (Obrero SISDEM - Planta de Superoctanos C.A.)
const trabajadorSuperoctanos = {
  cedula: 'V-18.456.789',
  nombres: 'JOSÉ',
  apellidos: 'SUÁREZ',
  cargoId: 'cargo-sisdem-obrero',
  cargoNombre: 'OBRERO GENERAL SISDEM (PLANTA SUPEROCTANOS)',
  nivelCCP: 1,
  salarioBasicoDiario: 935.20, // $14.00 * 66.80
  salarioMensualUSD: 420.0, // $420.00 mensual ($14.00 / día)
  monedaEntrada: 'USD' as const,
  turnoGuardia: '5x2' as const,
  tiempoViajeDiario: 0.0,
  otrasPrimasRegularesDiarias: 0.0,
  fechaIngreso: '2026-08-03',
  fechaEgreso: '2026-11-24',
  causaEgreso: 'Culminación de Contrato (Fin de Obra)' as const,
  escenarioCalculo: 'amplio_ccp' as const, // 30 días de garantía ($624.17) y 4 meses fraccionados
  clausula70Contratistas: true,
  anticiposOtorgados: 0.0,
  porcentajeISLR: 0.0,
  fechaPuestaDisposicion: '2026-11-28',
};

const calculoOficialCarlos = calcularLiquidacion(trabajadorOficialCarlos, {
  ...PARAMETROS_DEFAULT,
  diasBonoVacacionalCCP: 45, // Respetamos los 45 días del acta original de Carlos Mendoza
});

const calculoSuperoctanos = calcularLiquidacion(trabajadorSuperoctanos, PARAMETROS_DEFAULT);

export const EXPEDIENTE_OFICIAL_CARLOS: ExpedienteLiquidacion = {
  id: 'exp-oficial-001',
  numeroExpediente: 'LIQ-PEQ-2026-0042',
  fechaCreacion: '2026-11-11T20:00:00.000Z',
  fechaModificacion: '2026-11-11T20:00:00.000Z',
  contratista: CONTRATISTAS_DEFAULT[0],
  trabajador: trabajadorOficialCarlos,
  parametrosSnapshot: {
    diasUtilidadesCCP: 120,
    diasBonoVacacionalCCP: 45,
    diasBonificacionFiniquitoCCP: 15,
    salarioMinimoUrbano: 130.0,
    tasaCambioBCV_USD: 66.80,
  },
  calculo: calculoOficialCarlos,
  estado: 'Finiquitado y Pagado',
  notasInternas: 'Finiquito homologado conforme al Artículo 142 de la LOTTT y cláusulas de la Convención Colectiva Petrolera Pequiven.',
};

export const EXPEDIENTE_SUPEROCTANOS_JOSE: ExpedienteLiquidacion = {
  id: 'exp-superoctanos-001',
  numeroExpediente: 'LIQ-SUPEROCTANOS-2026-0006',
  fechaCreacion: '2026-11-24T12:00:00.000Z',
  fechaModificacion: '2026-11-24T12:00:00.000Z',
  contratista: CONTRATISTAS_DEFAULT[1],
  trabajador: trabajadorSuperoctanos,
  parametrosSnapshot: {
    diasUtilidadesCCP: 120,
    diasBonoVacacionalCCP: 55,
    diasBonificacionFiniquitoCCP: 15,
    salarioMinimoUrbano: 130.0,
    tasaCambioBCV_USD: 66.80,
  },
  calculo: calculoSuperoctanos,
  estado: 'Auditado por Relaciones Laborales',
  notasInternas: 'Obra de Ornamento en Planta de Superoctanos C.A. Bajo cobertura Cláusula 70 CCP (Contratistas). Obreros SISDEM ($420/mes = $14/día). Tiempo de servicio: 3 meses y 21 días.',
};
