export interface BCVRateResponse {
  rate: number;
  fechaActualizacion: string;
  fuente: string;
}

export interface BCVSyncState {
  loading: boolean;
  lastSyncedRate: number | null;
  lastSource: string | null;
  lastDate: string | null;
  error: string | null;
}

/**
 * Consulta la tasa oficial del dólar BCV en Venezuela usando APIs públicas gratuitas
 * (con respaldo automático en caso de indisponibilidad de la fuente primaria).
 */
export async function fetchLiveBCVRate(): Promise<BCVRateResponse> {
  // 1. Fuente primaria: DolarApi Venezuela (BCV Oficial)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const rate = Number(data?.promedio);
      if (!isNaN(rate) && rate > 0) {
        return {
          rate: Number(rate.toFixed(4)),
          fechaActualizacion: data?.fechaActualizacion || new Date().toISOString(),
          fuente: 'BCV Oficial (ve.dolarapi.com)',
        };
      }
    }
  } catch (err) {
    console.warn('Error consultando ve.dolarapi.com, intentando fuente de respaldo...', err);
  }

  // 2. Fuente de respaldo gratuita: ExchangeRate-API (VES)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const rate = Number(data?.rates?.VES);
      if (!isNaN(rate) && rate > 0) {
        return {
          rate: Number(rate.toFixed(4)),
          fechaActualizacion: data?.time_last_update_utc || new Date().toISOString(),
          fuente: 'BCV Referencial (open.er-api.com)',
        };
      }
    }
  } catch (err) {
    console.warn('Error consultando open.er-api.com:', err);
  }

  throw new Error('No se pudo conectar con la API del BCV. Verifique su conexión a internet.');
}
