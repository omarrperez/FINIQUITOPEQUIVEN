import {
  ExpedienteLiquidacion,
  Contratista,
  ParametrosMaestros,
} from '../types/settlement';
import {
  EXPEDIENTE_OFICIAL_CARLOS,
  EXPEDIENTE_SUPEROCTANOS_JOSE,
  CONTRATISTAS_DEFAULT,
  PARAMETROS_DEFAULT,
} from './defaultData';

const STORAGE_KEYS = {
  EXPEDIENTES: 'petro_expedientes_v1',
  CONTRATISTAS: 'petro_contratistas_v1',
  PARAMETROS: 'petro_parametros_v1',
};

export const secureStorage = {
  // Expedientes
  getExpedientes(): ExpedienteLiquidacion[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPEDIENTES);
      if (!data) {
        // Inicializar con los casos oficiales homologados
        const inicial = [EXPEDIENTE_OFICIAL_CARLOS, EXPEDIENTE_SUPEROCTANOS_JOSE];
        this.saveExpedientes(inicial);
        return inicial;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading expedientes from secureStorage:', e);
      return [EXPEDIENTE_OFICIAL_CARLOS, EXPEDIENTE_SUPEROCTANOS_JOSE];
    }
  },

  saveExpedientes(expedientes: ExpedienteLiquidacion[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPEDIENTES, JSON.stringify(expedientes));
    } catch (e) {
      console.error('Error saving expedientes to secureStorage:', e);
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

  // Contratistas
  getContratistas(): Contratista[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTRATISTAS);
      if (!data) {
        this.saveContratistas(CONTRATISTAS_DEFAULT);
        return CONTRATISTAS_DEFAULT;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading contratistas:', e);
      return CONTRATISTAS_DEFAULT;
    }
  },

  saveContratistas(contratistas: Contratista[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTRATISTAS, JSON.stringify(contratistas));
    } catch (e) {
      console.error('Error saving contratistas:', e);
    }
  },

  // Parámetros Maestros
  getParametros(): ParametrosMaestros {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PARAMETROS);
      if (!data) {
        this.saveParametros(PARAMETROS_DEFAULT);
        return PARAMETROS_DEFAULT;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading parametros:', e);
      return PARAMETROS_DEFAULT;
    }
  },

  saveParametros(parametros: ParametrosMaestros): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PARAMETROS, JSON.stringify(parametros));
    } catch (e) {
      console.error('Error saving parametros:', e);
    }
  },

  // Exportar copia de seguridad en JSON
  exportBackup(): string {
    const backup = {
      version: '1.0',
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
    localStorage.removeItem(STORAGE_KEYS.EXPEDIENTES);
    localStorage.removeItem(STORAGE_KEYS.CONTRATISTAS);
    localStorage.removeItem(STORAGE_KEYS.PARAMETROS);
  },
};
