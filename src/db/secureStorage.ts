import {
  ExpedienteLiquidacion,
  Contratista,
  ParametrosMaestros,
} from '../types/settlement';
import {
  EXPEDIENTES_CRISBAORCA_LIST,
  CONTRATISTAS_DEFAULT,
  PARAMETROS_DEFAULT,
} from './defaultData';
import { calcularLiquidacion, round2, TASA_BCV_OFICIAL_DEFAULT } from '../utils/calculator';

const STORAGE_KEYS = {
  EXPEDIENTES: 'petro_expedientes_v7',
  CONTRATISTAS: 'petro_contratistas_v7',
  PARAMETROS: 'petro_parametros_v7',
};

const memoryFallback: {
  expedientes: ExpedienteLiquidacion[] | null;
  contratistas: Contratista[] | null;
  parametros: ParametrosMaestros | null;
} = {
  expedientes: null,
  contratistas: null,
  parametros: null,
};

const clearLegacyStorage = () => {
  try {
    ['v2', 'v3', 'v4', 'v5', 'v6'].forEach((ver) => {
      localStorage.removeItem(`petro_expedientes_${ver}`);
      localStorage.removeItem(`petro_contratistas_${ver}`);
      localStorage.removeItem(`petro_parametros_${ver}`);
    });
  } catch {
    // Ignore storage cleanup errors
  }
};

const getDefaultExpedientes = (): ExpedienteLiquidacion[] => [...EXPEDIENTES_CRISBAORCA_LIST];

export const secureStorage = {
  // Expedientes
  getExpedientes(): ExpedienteLiquidacion[] {
    try {
      clearLegacyStorage();
      const data = localStorage.getItem(STORAGE_KEYS.EXPEDIENTES);
      if (!data) {
        const inicial = memoryFallback.expedientes || getDefaultExpedientes();
        this.saveExpedientes(inicial);
        return inicial;
      }
      const parsed = JSON.parse(data);
      memoryFallback.expedientes = parsed;
      return parsed;
    } catch (e) {
      console.warn('Usando caché en memoria para expedientes:', e);
      if (!memoryFallback.expedientes) {
        memoryFallback.expedientes = getDefaultExpedientes();
      }
      return memoryFallback.expedientes;
    }
  },

  saveExpedientes(expedientes: ExpedienteLiquidacion[]): void {
    memoryFallback.expedientes = expedientes;
    try {
      localStorage.setItem(STORAGE_KEYS.EXPEDIENTES, JSON.stringify(expedientes));
    } catch (e) {
      console.warn('localStorage no disponible en este origen, guardado en memoria:', e);
    }
  },

  saveExpediente(expediente: ExpedienteLiquidacion): void {
    const list = this.getExpedientes();
    const index = list.findIndex((e) => e.id === expediente.id);
    if (index >= 0) {
      list[index] = { ...expediente, fechaModificacion: new Date().toISOString() };
    } else {
      list.unshift(expediente);
    }
    this.saveExpedientes(list);
  },

  deleteExpediente(id: string): void {
    const list = this.getExpedientes().filter((e) => e.id !== id);
    this.saveExpedientes(list);
  },

  // Recalcular todos los expedientes guardados contra parámetros actuales (tasa BCV, CCP, tope 5 SM)
  recalcularTodosExpedientes(parametros: ParametrosMaestros): ExpedienteLiquidacion[] {
    const tasaUSD = parametros.tasaCambioBCV_USD || TASA_BCV_OFICIAL_DEFAULT;
    const actuales = this.getExpedientes();
    const actualizados = actuales.map((exp) => {
      const trabajadorActualizado = { ...exp.trabajador };
      if (trabajadorActualizado.monedaEntrada === 'USD' && trabajadorActualizado.salarioMensualUSD) {
        trabajadorActualizado.salarioBasicoDiario = round2(
          (trabajadorActualizado.salarioMensualUSD / 30) * tasaUSD
        );
      }
      const nuevoCalculo = calcularLiquidacion(trabajadorActualizado, parametros);
      return {
        ...exp,
        fechaModificacion: new Date().toISOString(),
        trabajador: trabajadorActualizado,
        parametrosSnapshot: {
          diasUtilidadesCCP: parametros.diasUtilidadesCCP,
          diasBonoVacacionalCCP: parametros.diasBonoVacacionalCCP,
          diasVacacionesAnualesCCP: parametros.diasVacacionesAnualesCCP,
          diasBonificacionFiniquitoCCP: parametros.diasBonificacionFiniquitoCCP,
          salarioMinimoUrbano: parametros.salarioMinimoUrbano,
          tasaCambioBCV_USD: tasaUSD,
        },
        calculo: nuevoCalculo,
      };
    });
    this.saveExpedientes(actualizados);
    return actualizados;
  },

  applyNewBCVRate(nuevaTasa: number): {
    parametros: ParametrosMaestros;
    expedientes: ExpedienteLiquidacion[];
  } {
    const params = this.getParametros();
    const tasaAnterior = params.tasaCambioBCV_USD || TASA_BCV_OFICIAL_DEFAULT;
    const updatedTabulador = params.tabuladorCargos.map((cargo) => {
      if (cargo.id === 'cargo-sisdem-obrero') {
        return { ...cargo, salarioBasicoDiario: round2(14.0 * nuevaTasa) };
      }
      if (cargo.id === 'cargo-inspector-siho') {
        return { ...cargo, salarioBasicoDiario: round2(20.0 * nuevaTasa) };
      }
      // Para otros cargos agregados por el usuario, conservar proporcionalidad si cambia la tasa
      const usdDiario = cargo.salarioBasicoDiario / tasaAnterior;
      return { ...cargo, salarioBasicoDiario: round2(usdDiario * nuevaTasa) };
    });

    const updatedParams: ParametrosMaestros = {
      ...params,
      tasaCambioBCV_USD: nuevaTasa,
      tabuladorCargos: updatedTabulador,
    };
    this.saveParametros(updatedParams);
    const updatedExpedientes = this.recalcularTodosExpedientes(updatedParams);
    return { parametros: updatedParams, expedientes: updatedExpedientes };
  },

  // Contratistas
  getContratistas(): Contratista[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTRATISTAS);
      if (!data) {
        const init = memoryFallback.contratistas || CONTRATISTAS_DEFAULT;
        this.saveContratistas(init);
        return init;
      }
      const parsed = JSON.parse(data);
      memoryFallback.contratistas = parsed;
      return parsed;
    } catch (e) {
      console.warn('Usando caché en memoria para contratistas:', e);
      if (!memoryFallback.contratistas) {
        memoryFallback.contratistas = CONTRATISTAS_DEFAULT;
      }
      return memoryFallback.contratistas;
    }
  },

  saveContratistas(contratistas: Contratista[]): void {
    memoryFallback.contratistas = contratistas;
    try {
      localStorage.setItem(STORAGE_KEYS.CONTRATISTAS, JSON.stringify(contratistas));
    } catch (e) {
      console.warn('localStorage no disponible en este origen:', e);
    }
  },

  // Parámetros Maestros
  getParametros(): ParametrosMaestros {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PARAMETROS);
      if (!data) {
        const init = memoryFallback.parametros || PARAMETROS_DEFAULT;
        this.saveParametros(init);
        return init;
      }
      const parsed = JSON.parse(data);
      memoryFallback.parametros = parsed;
      return parsed;
    } catch (e) {
      console.warn('Usando caché en memoria para parametros:', e);
      if (!memoryFallback.parametros) {
        memoryFallback.parametros = PARAMETROS_DEFAULT;
      }
      return memoryFallback.parametros;
    }
  },

  saveParametros(parametros: ParametrosMaestros): void {
    memoryFallback.parametros = parametros;
    try {
      localStorage.setItem(STORAGE_KEYS.PARAMETROS, JSON.stringify(parametros));
    } catch (e) {
      console.warn('localStorage no disponible en este origen:', e);
    }
  },

  // Exportar copia de seguridad en JSON
  exportBackup(): string {
    const backup = {
      version: '4.0',
      exportedAt: new Date().toISOString(),
      expedientes: this.getExpedientes(),
      contratistas: this.getContratistas(),
      parametros: this.getParametros(),
    };
    return JSON.stringify(backup, null, 2);
  },

  // Importar copia de seguridad
  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.expedientes && Array.isArray(data.expedientes)) {
        this.saveExpedientes(data.expedientes);
      }
      if (data.contratistas && Array.isArray(data.contratistas)) {
        this.saveContratistas(data.contratistas);
      }
      if (data.parametros && data.parametros.tabuladorCargos) {
        this.saveParametros(data.parametros);
      }
      return true;
    } catch (e) {
      console.error('Error importing backup:', e);
      return false;
    }
  },

  // Reset a fábrica
  resetToDefault(): void {
    memoryFallback.expedientes = null;
    memoryFallback.contratistas = null;
    memoryFallback.parametros = null;
    try {
      localStorage.removeItem(STORAGE_KEYS.EXPEDIENTES);
      localStorage.removeItem(STORAGE_KEYS.CONTRATISTAS);
      localStorage.removeItem(STORAGE_KEYS.PARAMETROS);
      clearLegacyStorage();
    } catch {
      // Ignore storage errors
    }
  },
};
