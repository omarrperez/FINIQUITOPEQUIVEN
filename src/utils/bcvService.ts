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

function xhrGetJson(url: string, timeoutMs: number): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof XMLHttpRequest === 'undefined') {
      reject(new Error('XMLHttpRequest no disponible'));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = timeoutMs;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('JSON inválido'));
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Error de red XHR'));
    xhr.ontimeout = () => reject(new Error('Timeout XHR'));
    xhr.send();
  });
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 4500): Promise<any> {
  if (typeof fetch === 'function') {
    const hasAbort = typeof AbortController !== 'undefined';
    const controller = hasAbort ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      const res = await fetch(url, controller ? { signal: controller.signal } : undefined);
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (fetchErr) {
      // Fallback a XMLHttpRequest clásico si fetch falla en file:// o navegadores con políticas estrictas
      if (typeof XMLHttpRequest !== 'undefined') {
        return await xhrGetJson(url, timeoutMs);
      }
      throw fetchErr;
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    }
  }

  return await xhrGetJson(url, timeoutMs);
}

async function fetchFromDolarApi(): Promise<BCVRateResponse> {
  const data = await fetchJsonWithTimeout(
    `https://ve.dolarapi.com/v1/dolares/oficial?t=${Date.now()}`
  );
  const rate = Number(data?.promedio);
  if (!Number.isFinite(rate) || rate <= 1) {
    throw new Error('Respuesta inválida de ve.dolarapi.com');
  }
  return {
    rate: Number(rate.toFixed(4)),
    fechaActualizacion: data?.fechaActualizacion || new Date().toISOString(),
    fuente: 'BCV Oficial (ve.dolarapi.com)',
  };
}

async function fetchFromOpenErApi(): Promise<BCVRateResponse> {
  const data = await fetchJsonWithTimeout('https://open.er-api.com/v6/latest/USD');
  const rate = Number(data?.rates?.VES);
  if (!Number.isFinite(rate) || rate <= 1) {
    throw new Error('Respuesta inválida de open.er-api.com');
  }
  return {
    rate: Number(rate.toFixed(4)),
    fechaActualizacion: data?.time_last_update_utc || new Date().toISOString(),
    fuente: 'BCV Oficial Ref. (open.er-api.com)',
  };
}

async function fetchFromJsDelivr(): Promise<BCVRateResponse> {
  const data = await fetchJsonWithTimeout(
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'
  );
  const rate = Number(data?.usd?.ves);
  if (!Number.isFinite(rate) || rate <= 1) {
    throw new Error('Respuesta inválida de jsDelivr Currency API');
  }
  return {
    rate: Number(rate.toFixed(4)),
    fechaActualizacion: data?.date || new Date().toISOString(),
    fuente: 'BCV Ref. (CDN jsDelivr)',
  };
}

async function fetchFromPagesDev(): Promise<BCVRateResponse> {
  const data = await fetchJsonWithTimeout(
    'https://latest.currency-api.pages.dev/v1/currencies/usd.json'
  );
  const rate = Number(data?.usd?.ves);
  if (!Number.isFinite(rate) || rate <= 1) {
    throw new Error('Respuesta inválida de Currency API Mirror');
  }
  return {
    rate: Number(rate.toFixed(4)),
    fechaActualizacion: data?.date || new Date().toISOString(),
    fuente: 'BCV Ref. (Mirror Cloudflare)',
  };
}

function raceFirstSuccess<T>(tasks: Array<() => Promise<T>>): Promise<T> {
  const promises = tasks.map((fn) => fn());
  if (typeof Promise.any === 'function') {
    return Promise.any(promises);
  }
  return new Promise<T>((resolve, reject) => {
    let failures = 0;
    promises.forEach((p) => {
      p.then(resolve).catch(() => {
        failures += 1;
        if (failures === promises.length) {
          reject(new Error('Todas las fuentes fallaron'));
        }
      });
    });
  });
}

/**
 * Consulta la tasa oficial del dólar BCV en Venezuela usando APIs CORS verificadas
 * con soporte para Chrome, Edge, Opera y archivos locales (file://) mediante fetch + fallback XHR.
 */
export async function fetchLiveBCVRate(): Promise<BCVRateResponse> {
  // Nivel 1: Fuentes directas BCV con 4 decimales exactos
  try {
    return await raceFirstSuccess([fetchFromDolarApi, fetchFromOpenErApi]);
  } catch (err) {
    console.warn('Nivel 1 BCV no disponible, activando respaldo CDN...', err);
  }

  // Nivel 2: CDNs globales (evitan bloqueos regionales o de bloqueadores de rastreo)
  try {
    return await raceFirstSuccess([fetchFromJsDelivr, fetchFromPagesDev]);
  } catch (err) {
    console.warn('Nivel 2 BCV no disponible:', err);
  }

  throw new Error(
    'No se pudo consultar la API del BCV automáticamente desde este navegador/red. Escriba la tasa del día en la casilla "Tasa BCV" y pulse "Aplicar".'
  );
}
