import React, { useState } from 'react';
import {
  Building2,
  User,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Scale,
  Sparkles,
  DollarSign,
  Briefcase,
  FileText,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Info,
  Loader2,
} from 'lucide-react';
import {
  Contratista,
  TrabajadorFicha,
  ParametrosMaestros,
  ExpedienteLiquidacion,
  TurnoGuardia,
  EscenarioCalculoCCP,
  MonedaEntrada,
} from '../../types/settlement';
import {
  calcularTiempoServicio,
  calcularLiquidacion,
  formatBs,
  round2,
  TASA_BCV_OFICIAL_DEFAULT,
} from '../../utils/calculator';
import { EXPEDIENTES_CRISBAORCA_LIST } from '../../db/defaultData';
import { BCVSyncState } from '../../utils/bcvService';

interface WizardLayoutProps {
  contratistas: Contratista[];
  parametros: ParametrosMaestros;
  onSaveExpediente: (expediente: ExpedienteLiquidacion) => void;
  onViewReceipt: (expediente: ExpedienteLiquidacion) => void;
  expedienteParaEditar?: ExpedienteLiquidacion | null;
  onSyncLiveBCV: () => Promise<ParametrosMaestros | null>;
  bcvSyncState: BCVSyncState;
}

export const WizardLayout: React.FC<WizardLayoutProps> = ({
  contratistas,
  parametros,
  onSaveExpediente,
  onViewReceipt,
  expedienteParaEditar,
  onSyncLiveBCV,
  bcvSyncState,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const tasaActual = parametros.tasaCambioBCV_USD || TASA_BCV_OFICIAL_DEFAULT;
  const defaultContratista = contratistas[0];

  // Step 1: Contratista & Contrato
  const [selectedContratistaId, setSelectedContratistaId] = useState<string>(
    expedienteParaEditar?.contratista.id || defaultContratista?.id || ''
  );
  const [razonSocial, setRazonSocial] = useState(
    expedienteParaEditar?.contratista.razonSocial || defaultContratista?.razonSocial || 'CRISBAORCA 2009, C.A.'
  );
  const [rif, setRif] = useState(
    expedienteParaEditar?.contratista.rif || defaultContratista?.rif || 'J-29711947-7'
  );
  const [direccion, setDireccion] = useState(
    expedienteParaEditar?.contratista.direccion ||
      defaultContratista?.direccion ||
      'AV. VIA HOSPITAL RASETTI, BARCELONA, ANZOATEGUI'
  );
  const [numeroContrato, setNumeroContrato] = useState(
    expedienteParaEditar?.contratista.numeroContrato || defaultContratista?.numeroContrato || 'ORNAMENTO SUPEROCTANOS'
  );
  const [obraServicio, setObraServicio] = useState(
    expedienteParaEditar?.contratista.obraServicio ||
      defaultContratista?.obraServicio ||
      'ORNAMENTO EN LA PLANTA DE SUPEROCTANOS C.A.'
  );
  const [complejo, setComplejo] = useState(
    expedienteParaEditar?.contratista.complejo ||
      defaultContratista?.complejo ||
      'Planta de Superoctanos C.A. (Complejo Industrial José Antonio Anzoátegui)'
  );
  const [clientePrincipal, setClientePrincipal] = useState<Contratista['clientePrincipal']>(
    expedienteParaEditar?.contratista.clientePrincipal || defaultContratista?.clientePrincipal || 'Superoctanos C.A.'
  );

  // Step 2: Trabajador & Régimen CCP
  const [cedula, setCedula] = useState(expedienteParaEditar?.trabajador.cedula || '');
  const [nombres, setNombres] = useState(expedienteParaEditar?.trabajador.nombres || '');
  const [apellidos, setApellidos] = useState(expedienteParaEditar?.trabajador.apellidos || '');
  const [selectedCargoId, setSelectedCargoId] = useState(
    expedienteParaEditar?.trabajador.cargoId || parametros.tabuladorCargos[0]?.id || 'cargo-sisdem-obrero'
  );

  // Bimonetary controls
  const [monedaEntrada, setMonedaEntrada] = useState<MonedaEntrada>(
    expedienteParaEditar?.trabajador.monedaEntrada || 'USD'
  );
  const [salarioMensualUSD, setSalarioMensualUSD] = useState<number>(
    expedienteParaEditar?.trabajador.salarioMensualUSD ?? 420.0
  );

  const [salarioBasico, setSalarioBasico] = useState<number>(
    expedienteParaEditar?.trabajador.salarioBasicoDiario ?? round2((420.0 / 30) * tasaActual)
  );
  const [cargoNombre, setCargoNombre] = useState(
    expedienteParaEditar?.trabajador.cargoNombre || parametros.tabuladorCargos[0]?.denominacion || 'OBRERO SISDEM'
  );
  const [nivelCCP, setNivelCCP] = useState(expedienteParaEditar?.trabajador.nivelCCP || 1);
  const [turnoGuardia, setTurnoGuardia] = useState<TurnoGuardia>(
    expedienteParaEditar?.trabajador.turnoGuardia || '5x2'
  );
  const [tiempoViaje, setTiempoViaje] = useState<number>(
    expedienteParaEditar?.trabajador.tiempoViajeDiario || 0.0
  );
  const [otrasPrimas, setOtrasPrimas] = useState<number>(
    expedienteParaEditar?.trabajador.otrasPrimasRegularesDiarias || 0.0
  );
  const [anticipos, setAnticipos] = useState<number>(
    expedienteParaEditar?.trabajador.anticiposOtorgados || 0.0
  );
  const [porcentajeISLR, setPorcentajeISLR] = useState<number>(
    expedienteParaEditar?.trabajador.porcentajeISLR || 0.0
  );

  // Step 3: Cronología & Fechas
  const [fechaIngreso, setFechaIngreso] = useState(
    expedienteParaEditar?.trabajador.fechaIngreso || '2026-08-03'
  );
  const [fechaEgreso, setFechaEgreso] = useState(
    expedienteParaEditar?.trabajador.fechaEgreso || '2026-11-24'
  );
  const [causaEgreso, setCausaEgreso] = useState<TrabajadorFicha['causaEgreso']>(
    expedienteParaEditar?.trabajador.causaEgreso || 'Culminación de Contrato (Fin de Obra)'
  );
  const [fechaPuestaDisposicion, setFechaPuestaDisposicion] = useState(
    expedienteParaEditar?.trabajador.fechaPuestaDisposicion || '2026-11-28'
  );

  // Criterios legales
  const [escenarioCalculo, setEscenarioCalculo] = useState<EscenarioCalculoCCP>(
    expedienteParaEditar?.trabajador.escenarioCalculo || 'amplio_ccp'
  );
  const [clausula70, setClausula70] = useState<boolean>(
    expedienteParaEditar?.trabajador.clausula70Contratistas ?? true
  );
  const [aplicaArt92, setAplicaArt92] = useState<boolean>(
    expedienteParaEditar?.trabajador.aplicaIndemnizacionArt92 || false
  );

  // Auto-fill contractor
  const handleContratistaSelect = (id: string) => {
    setSelectedContratistaId(id);
    const c = contratistas.find((item) => item.id === id);
    if (c) {
      setRazonSocial(c.razonSocial);
      setRif(c.rif);
      setDireccion(c.direccion || '');
      setNumeroContrato(c.numeroContrato);
      setObraServicio(c.obraServicio);
      setComplejo(c.complejo);
      setClientePrincipal(c.clientePrincipal);
    }
  };

  // Auto-fill cargo from tabulador
  const handleCargoSelect = (id: string) => {
    setSelectedCargoId(id);
    const cargo = parametros.tabuladorCargos.find((item) => item.id === id);
    const tasa = parametros.tasaCambioBCV_USD || TASA_BCV_OFICIAL_DEFAULT;
    if (cargo) {
      setCargoNombre(`${cargo.denominacion} (Tabulador CCP - Nivel ${cargo.nivel})`);
      setSalarioBasico(cargo.salarioBasicoDiario);
      setNivelCCP(cargo.nivel);
      const usdVal = round2((cargo.salarioBasicoDiario * 30) / tasa);
      setSalarioMensualUSD(usdVal);
    }
  };

  // Handle USD salary change
  const handleSalarioUSDChange = (val: number) => {
    setSalarioMensualUSD(val);
    const tasa = parametros.tasaCambioBCV_USD || TASA_BCV_OFICIAL_DEFAULT;
    const bsDiario = round2((val / 30) * tasa);
    setSalarioBasico(bsDiario);
  };

  // Handle Bs. salary change
  const handleSalarioBsChange = (val: number) => {
    setSalarioBasico(val);
    const tasa = parametros.tasaCambioBCV_USD || TASA_BCV_OFICIAL_DEFAULT;
    const usdVal = round2((val * 30) / tasa);
    setSalarioMensualUSD(usdVal);
  };

  // Live tenure calculation
  const tiempoCalculado = calcularTiempoServicio(fechaIngreso, fechaEgreso);

  // Current worker object
  const trabajadorCurrent: TrabajadorFicha = {
    cedula,
    nombres,
    apellidos,
    cargoId: selectedCargoId,
    cargoNombre,
    nivelCCP,
    salarioBasicoDiario: Number(salarioBasico) || 0,
    monedaEntrada,
    salarioMensualUSD: Number(salarioMensualUSD) || 0,
    turnoGuardia,
    tiempoViajeDiario: Number(tiempoViaje) || 0,
    otrasPrimasRegularesDiarias: Number(otrasPrimas) || 0,
    fechaIngreso,
    fechaEgreso,
    causaEgreso,
    escenarioCalculo,
    clausula70Contratistas: clausula70,
    aplicaIndemnizacionArt92: aplicaArt92,
    anticiposOtorgados: Number(anticipos) || 0,
    porcentajeISLR: Number(porcentajeISLR) || 0,
    fechaPuestaDisposicion,
  };

  const calculoLive = calcularLiquidacion(trabajadorCurrent, parametros);

  // Cargar plantilla de obra Crisbaorca / Superoctanos C.A.
  const handleLoadCrisbaorcaTemplate = () => {
    const s = EXPEDIENTES_CRISBAORCA_LIST[0];
    const tasa = parametros.tasaCambioBCV_USD || TASA_BCV_OFICIAL_DEFAULT;
    const usdMensual = s.trabajador.salarioMensualUSD || 420.0;
    setSelectedContratistaId(s.contratista.id);
    setRazonSocial(s.contratista.razonSocial);
    setRif(s.contratista.rif);
    setDireccion(s.contratista.direccion || '');
    setNumeroContrato(s.contratista.numeroContrato);
    setObraServicio(s.contratista.obraServicio);
    setComplejo(s.contratista.complejo);
    setClientePrincipal(s.contratista.clientePrincipal);

    setSelectedCargoId(s.trabajador.cargoId);
    setCargoNombre(s.trabajador.cargoNombre);
    setMonedaEntrada('USD');
    setSalarioMensualUSD(usdMensual);
    setSalarioBasico(round2((usdMensual / 30) * tasa));
    setNivelCCP(s.trabajador.nivelCCP);
    setTurnoGuardia(s.trabajador.turnoGuardia);
    setTiempoViaje(0);
    setOtrasPrimas(0);
    setFechaIngreso(s.trabajador.fechaIngreso);
    setFechaEgreso(s.trabajador.fechaEgreso);
    setCausaEgreso(s.trabajador.causaEgreso);
    setEscenarioCalculo('amplio_ccp');
    setClausula70(true);
    setAplicaArt92(false);
    setAnticipos(0);
    setPorcentajeISLR(0);
    setFechaPuestaDisposicion('2026-11-28');
  };

  const handleFinishAndSave = () => {
    const contratistaObj: Contratista = {
      id: selectedContratistaId || `emp-${Date.now()}`,
      razonSocial,
      rif,
      direccion,
      numeroContrato,
      obraServicio,
      complejo,
      clientePrincipal,
    };

    const nuevoExpediente: ExpedienteLiquidacion = {
      id: expedienteParaEditar?.id || `exp-${Date.now()}`,
      numeroExpediente:
        expedienteParaEditar?.numeroExpediente ||
        `LIQ-CRISBAORCA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      fechaCreacion: expedienteParaEditar?.fechaCreacion || new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
      contratista: contratistaObj,
      trabajador: trabajadorCurrent,
      parametrosSnapshot: {
        diasUtilidadesCCP: parametros.diasUtilidadesCCP,
        diasBonoVacacionalCCP: parametros.diasBonoVacacionalCCP,
        diasVacacionesAnualesCCP: parametros.diasVacacionesAnualesCCP,
        diasBonificacionFiniquitoCCP: parametros.diasBonificacionFiniquitoCCP,
        salarioMinimoUrbano: parametros.salarioMinimoUrbano,
        tasaCambioBCV_USD: parametros.tasaCambioBCV_USD || TASA_BCV_OFICIAL_DEFAULT,
      },
      calculo: calculoLive,
      estado: 'Auditado por Relaciones Laborales',
    };

    onSaveExpediente(nuevoExpediente);
    onViewReceipt(nuevoExpediente);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Wizard Header with Steps Tracker */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {expedienteParaEditar ? 'Modificar Liquidación' : 'Asistente de Liquidación — CRISBAORCA 2009, C.A.'}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Cálculo automatizado bajo LOTTT y Convención Colectiva Petrolera (Obra Planta Superoctanos C.A.)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleLoadCrisbaorcaTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Plantilla Proyecto Superoctanos</span>
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {[
            { step: 1, title: 'Contrato & Obra', icon: Building2 },
            { step: 2, title: 'Trabajador & CCP', icon: User },
            { step: 3, title: 'Cronología & Salarios', icon: Calendar },
            { step: 4, title: 'Auditoría Art. 142', icon: Scale },
          ].map(({ step, title, icon: Icon }) => {
            const isActive = currentStep === step;
            const isCompleted = currentStep > step;
            return (
              <button
                key={step}
                onClick={() => setCurrentStep(step as 1 | 2 | 3 | 4)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                    : isCompleted
                    ? 'border-slate-300 bg-white hover:bg-slate-50'
                    : 'border-slate-200 bg-slate-50/50 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? '✓' : step}
                  </div>
                  <span
                    className={`text-xs font-medium truncate ${
                      isActive ? 'text-blue-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    {title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Body */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 md:p-8">
        {/* STEP 1: Contrato & Contratista */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Paso 1: Parámetros del Contrato y Empresa Contratista
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Datos filiatorios de la contratista homologada ante Pequiven, PDVSA o Superoctanos C.A.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cláusula 70 CCP Activa</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Seleccionar Empresa Contratista Pre-registrada:
              </label>
              <select
                value={selectedContratistaId}
                onChange={(e) => handleContratistaSelect(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              >
                {contratistas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razonSocial} ({c.rif}) · Contrato N° {c.numeroContrato} [{c.clientePrincipal}]
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Razón Social de la Contratista:
                </label>
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  placeholder="CRISBAORCA 2009, C.A."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  RIF Patronal:
                </label>
                <input
                  type="text"
                  value={rif}
                  onChange={(e) => setRif(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono"
                  placeholder="J-29711947-7"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Dirección Fiscal:
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden uppercase"
                  placeholder="AV. VIA HOSPITAL RASETTI, BARCELONA, ANZOATEGUI"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Referencia / N° de Contrato:
                </label>
                <input
                  type="text"
                  value={numeroContrato}
                  onChange={(e) => setNumeroContrato(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono"
                  placeholder="ORNAMENTO SUPEROCTANOS"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ente Contratante Principal:
                </label>
                <select
                  value={clientePrincipal}
                  onChange={(e) => setClientePrincipal(e.target.value as any)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  <option value="Superoctanos C.A.">Planta Superoctanos C.A. (Complejo José)</option>
                  <option value="Pequiven">Petroquímica de Venezuela, S.A. (Pequiven)</option>
                  <option value="PDVSA">Petróleos de Venezuela, S.A. (PDVSA)</option>
                  <option value="Empresa Mixta">Empresa Mixta Petrolera / Petroquímica</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Denominación de la Obra o Servicio:
                </label>
                <input
                  type="text"
                  value={obraServicio}
                  onChange={(e) => setObraServicio(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden uppercase"
                  placeholder="ORNAMENTO Y MANTENIMIENTO INTEGRAL DE PLANTA"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Complejo / Planta Operativa:
                </label>
                <input
                  type="text"
                  value={complejo}
                  onChange={(e) => setComplejo(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  placeholder="Planta de Superoctanos C.A. (Complejo Industrial José Antonio Anzoátegui)"
                />
              </div>
            </div>

            {/* Cláusula 70 Notice */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-blue-950 block">
                  Cobertura a Contratistas según Cláusula 70 CCP (PDVSA / FUTPV):
                </span>
                <p className="text-blue-900 mt-0.5 leading-relaxed">
                  Los trabajadores de empresas contratistas y subcontratistas que ejecutan obras o servicios en la industria tienen derecho a las mismas condiciones salariales, alícuotas convencionales (120d utilidades, 55d bono vacacional, 34d vacaciones) y metodología de prestaciones que el personal de nómina directa corporativa.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Trabajador & Régimen CCP */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                Paso 2: Datos del Trabajador, Tabulador y Salario Bimonetario
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Clasificación de cargo según Convención Colectiva Petrolera (CCP) o nómina indexada SISDEM
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Cédula de Identidad:
                </label>
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  placeholder="V-00.000.000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nombres:
                </label>
                <input
                  type="text"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 uppercase focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  placeholder="NOMBRES"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Apellidos:
                </label>
                <input
                  type="text"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 uppercase focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  placeholder="APELLIDOS"
                />
              </div>
            </div>

            {/* Bimonetary Salary Input Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Determinación de Salario Base (Bimonetario):
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const updated = await onSyncLiveBCV();
                      if (updated) {
                        const nuevaTasa = updated.tasaCambioBCV_USD;
                        if (monedaEntrada === 'USD') {
                          setSalarioBasico(round2((salarioMensualUSD / 30) * nuevaTasa));
                        } else {
                          setSalarioMensualUSD(round2((salarioBasico * 30) / nuevaTasa));
                        }
                      }
                    }}
                    disabled={bcvSyncState.loading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-2xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 transition-colors shadow-2xs"
                  >
                    {bcvSyncState.loading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <DollarSign className="w-3 h-3" />
                    )}
                    <span>
                      {bcvSyncState.loading
                        ? 'Consultando...'
                        : `Dólar BCV Hoy (Bs. ${formatBs(parametros.tasaCambioBCV_USD, 4)})`}
                    </span>
                  </button>
                  <span className="text-2xs text-slate-500 font-medium">Modalidad:</span>
                  <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setMonedaEntrada('USD')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        monedaEntrada === 'USD'
                          ? 'bg-blue-700 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Dólares ($ USD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMonedaEntrada('BS')}
                      className={`px-2.5 py-1 rounded font-medium transition-colors ${
                        monedaEntrada === 'BS'
                          ? 'bg-blue-700 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Bolívares (Bs.)
                    </button>
                  </div>
                </div>
              </div>

              {bcvSyncState.lastSyncedRate && !bcvSyncState.error && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-2xs text-emerald-900 flex items-center justify-between">
                  <span>
                    ✓ Tasa BCV actualizada a <strong>Bs. {formatBs(bcvSyncState.lastSyncedRate, 4)}</strong> / USD
                  </span>
                  <span className="font-mono text-emerald-700">{bcvSyncState.lastSource}</span>
                </div>
              )}
              {bcvSyncState.error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-2xs text-red-800">
                  {bcvSyncState.error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cargo Tabulador CCP:
                  </label>
                  <select
                    value={selectedCargoId}
                    onChange={(e) => handleCargoSelect(e.target.value)}
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  >
                    {parametros.tabuladorCargos.map((cargo) => (
                      <option key={cargo.id} value={cargo.id}>
                        {cargo.denominacion} (Nivel {cargo.nivel})
                      </option>
                    ))}
                  </select>
                </div>

                {monedaEntrada === 'USD' ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Sueldo Mensual ($ USD / SISDEM):
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                        <input
                          type="number"
                          step="1"
                          value={salarioMensualUSD}
                          onChange={(e) => handleSalarioUSDChange(parseFloat(e.target.value) || 0)}
                          className="w-full text-sm border border-slate-300 rounded-lg pl-7 pr-3 py-2 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                          placeholder="420.00"
                        />
                      </div>
                      <span className="text-2xs text-slate-500 mt-1 block font-mono">
                        Salario Diario: ${round2(salarioMensualUSD / 30)} USD/día
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Equivalente Básico Oficial en Bs. (@ {parametros.tasaCambioBCV_USD} Bs/$):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={salarioBasico}
                        onChange={(e) => handleSalarioBsChange(parseFloat(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      />
                      <span className="text-2xs text-slate-500 mt-1 block">
                        Conversión automática a tasa oficial BCV
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Salario Básico Diario (Bs.):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={salarioBasico}
                        onChange={(e) => handleSalarioBsChange(parseFloat(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                      />
                      <span className="text-2xs text-slate-500 mt-1 block">
                        Salario base del tabulador
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Equivalente Mensual en USD (@ {parametros.tasaCambioBCV_USD}):
                      </label>
                      <div className="py-2 px-3 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 text-sm">
                        ${salarioMensualUSD} USD/mes
                      </div>
                      <span className="text-2xs text-slate-500 mt-1 block">
                        Ref. indexada oficial
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Turnos de Guardia y Beneficios No Salariales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Régimen de Guardia CCP:
                </label>
                <select
                  value={turnoGuardia}
                  onChange={(e) => setTurnoGuardia(e.target.value as TurnoGuardia)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  <option value="5x2">5x2 (Ordinario lunes a viernes)</option>
                  <option value="1x1">1x1 (Rotativo continuo)</option>
                  <option value="7x7">7x7 (Semanal continuo en planta/taladro)</option>
                  <option value="2x4">2x4 (Régimen especializado)</option>
                  <option value="3x6">3x6 (Hidrografía / Costa afuera)</option>
                  <option value="5x10">5x10 (Perforación especializada)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tiempo de Viaje (TV) Diario (Bs.):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={tiempoViaje}
                  onChange={(e) => setTiempoViaje(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  placeholder="0.00"
                />
                <span className="text-2xs text-slate-500 mt-0.5 block">
                  Integra el Salario Normal y bases de alícuotas
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Otras Primas Regulares Diarias (Bs.):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={otrasPrimas}
                  onChange={(e) => setOtrasPrimas(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Anticipos Otorgados (Art. 144 LOTTT):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={anticipos}
                  onChange={(e) => setAnticipos(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  placeholder="0.00"
                />
                <span className="text-2xs text-slate-500 mt-0.5 block">
                  Límite legal de ley: hasta el 75% del fondo acumulado
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Retención ISLR Planilla ARI (%):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={porcentajeISLR}
                  onChange={(e) => setPorcentajeISLR(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  placeholder="0.00"
                />
                <span className="text-2xs text-slate-500 mt-0.5 block">
                  Exención expresa de prestaciones e intereses
                </span>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aplicaArt92}
                    onChange={(e) => setAplicaArt92(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Indemnización Despido Injustificado (Art. 92)
                    </span>
                    <span className="text-2xs text-slate-500">
                      "Doblete" del 100% de prestaciones por despido injustificado
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Note on non-wage benefits */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-2xs text-slate-600 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>Beneficios no salariales (Art. 105 LOTTT):</strong> El Cestaticket Socialista y la Tarjeta Electrónica de Alimentación (TEA) no forman parte del salario integral ni inciden en el cálculo de las prestaciones sociales de conformidad con el marco petrolero.
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: Cronología & Salarios */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                Paso 3: Cronología Laboral y Escenario de Cálculo CCP
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cálculo instantáneo de antigüedad e impacto del criterio amplio vs estricto
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Fecha de Ingreso:
                </label>
                <input
                  type="date"
                  value={fechaIngreso}
                  onChange={(e) => setFechaIngreso(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Fecha de Egreso:
                </label>
                <input
                  type="date"
                  value={fechaEgreso}
                  onChange={(e) => setFechaEgreso(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Causa de Terminación de Contrato:
                </label>
                <select
                  value={causaEgreso}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setCausaEgreso(val);
                    if (val === 'Despido Injustificado') {
                      setAplicaArt92(true);
                    }
                  }}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  <option value="Culminación de Contrato (Fin de Obra)">
                    Culminación de Contrato / Fin de Obra (Arts. 83 y 87 LOTTT)
                  </option>
                  <option value="Terminación por Tiempo Determinado">
                    Vencimiento de Tiempo Determinado
                  </option>
                  <option value="Retiro Justificado">Retiro Voluntario Justificado</option>
                  <option value="Despido Injustificado">Despido Injustificado (Aplica Art. 92 "Doblete")</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Fecha de Puesta a Disposición de Fondos (Auditoría Mora):
                </label>
                <input
                  type="date"
                  value={fechaPuestaDisposicion}
                  onChange={(e) => setFechaPuestaDisposicion(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Escenario de Cálculo Switch */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                Selección de Criterio de Cómputo (Escenario de Liquidación):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                    escenarioCalculo === 'amplio_ccp'
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="escenario"
                    value="amplio_ccp"
                    checked={escenarioCalculo === 'amplio_ccp'}
                    onChange={() => setEscenarioCalculo('amplio_ccp')}
                    className="mt-0.5 text-blue-700 focus:ring-blue-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Escenario Amplio Convencional CCP (Recomendado)
                    </span>
                    <p className="text-2xs text-slate-600 mt-0.5 leading-relaxed">
                      El inicio del trimestre genera derecho al depósito (30 días en 3m y 21d). La fracción superior a 15 días computa como mes completo (4 meses) para utilidades y vacaciones.
                    </p>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                    escenarioCalculo === 'estricto'
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="escenario"
                    value="estricto"
                    checked={escenarioCalculo === 'estricto'}
                    onChange={() => setEscenarioCalculo('estricto')}
                    className="mt-0.5 text-blue-700 focus:ring-blue-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Escenario Estricto LOTTT
                    </span>
                    <p className="text-2xs text-slate-600 mt-0.5 leading-relaxed">
                      Abona únicamente los trimestres vencidos completos (15 días por trimestre vencido = 15 días en 3m y 21d). Cómputo de meses estrictos cumplidos.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Dynamic Computation Summary Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Cómputo Automático de Antigüedad y Salario Integral Petrolero
                </span>
                <span className="text-xs font-mono font-semibold text-blue-700">
                  {tiempoCalculado.totalDias} Días Continuos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Tiempo de Servicio Exacto:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {tiempoCalculado.anos} Años, {tiempoCalculado.meses} Meses, {tiempoCalculado.dias} Días
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Días Garantía Computables:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {calculoLive.garantiaTrimestral.diasTotalesGarantia} Días ({escenarioCalculo === 'amplio_ccp' ? 'Criterio Amplio' : 'Criterio Estricto'})
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Meses Fraccionados Computables:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {escenarioCalculo === 'amplio_ccp'
                      ? `${tiempoCalculado.mesesComputablesFracciones} Meses (Fracción > 15d = Mes)`
                      : `${tiempoCalculado.mesesEstrictoFracciones} Meses (Meses enteros cumplidos)`}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-2xs block">Salario Básico Diario:</span>
                  <span className="font-semibold text-slate-900">Bs. {formatBs(calculoLive.salarioBasicoDiario)}</span>
                  <span className="text-3xs text-slate-400 block">${round2(calculoLive.salarioBasicoDiario / (parametros.tasaCambioBCV_USD || TASA_BCV_OFICIAL_DEFAULT))} USD</span>
                </div>
                <div>
                  <span className="text-slate-500 text-2xs block">Alícuota Utilidades ({parametros.diasUtilidadesCCP}d):</span>
                  <span className="font-semibold text-slate-900">Bs. {formatBs(calculoLive.alicuotaUtilidadesDiaria)}</span>
                  <span className="text-3xs text-slate-400 block">${round2(calculoLive.alicuotaUtilidadesDiaria / (parametros.tasaCambioBCV_USD || TASA_BCV_OFICIAL_DEFAULT))} USD</span>
                </div>
                <div>
                  <span className="text-slate-500 text-2xs block">Alícuota Vacaciones ({parametros.diasBonoVacacionalCCP}d):</span>
                  <span className="font-semibold text-slate-900">Bs. {formatBs(calculoLive.alicuotaBonoVacacionalDiaria)}</span>
                  <span className="text-3xs text-slate-400 block">${round2(calculoLive.alicuotaBonoVacacionalDiaria / (parametros.tasaCambioBCV_USD || TASA_BCV_OFICIAL_DEFAULT))} USD</span>
                </div>
                <div>
                  <span className="text-slate-500 text-2xs block">Salario Integral Diario:</span>
                  <span className="font-bold text-blue-900">Bs. {formatBs(calculoLive.salarioIntegralDiario)}</span>
                  <span className="text-3xs font-bold text-emerald-700 block">${round2(calculoLive.salarioIntegralDiario / (parametros.tasaCambioBCV_USD || TASA_BCV_OFICIAL_DEFAULT))} USD</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Auditoría Comparativa Art. 142 LOTTT & Deducciones */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                Paso 4: Auditoría Comparativa Art. 142 LOTTT, Límite de Anticipos y Emisión
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluación en paralelo de la Garantía Trimestral frente a la Retroactividad de Antigüedad
              </p>
            </div>

            {/* Parallel Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tarjeta A: Garantía Trimestral */}
              <div
                className={`p-5 rounded-xl border-2 transition-all ${
                  calculoLive.seleccionFavorable.metodoAplicado === 'Garantía Trimestral (Literal A + B)'
                    ? 'border-emerald-600 bg-emerald-50/30 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Opción A: Garantía Trimestral (Art. 142-a LOTTT)
                  </span>
                  {calculoLive.seleccionFavorable.metodoAplicado === 'Garantía Trimestral (Literal A + B)' && (
                    <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Favorable (Aplica)
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Días Acumulados:</span>
                    <span className="font-semibold text-slate-900">
                      {formatBs(calculoLive.garantiaTrimestral.diasTotalesGarantia)} Días ({escenarioCalculo === 'amplio_ccp' ? 'Amplio' : 'Estricto'})
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Salario Integral Diario:</span>
                    <span className="font-semibold text-slate-900">
                      Bs. {formatBs(calculoLive.salarioIntegralDiario)} (${round2(calculoLive.salarioIntegralDiario / (parametros.tasaCambioBCV_USD || TASA_BCV_OFICIAL_DEFAULT))})
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Subtotal Garantía:</span>
                    <span className="font-semibold text-slate-900">
                      Bs. {formatBs(calculoLive.garantiaTrimestral.montoGarantia)} (${round2(calculoLive.garantiaTrimestral.montoGarantia / (parametros.tasaCambioBCV_USD || TASA_BCV_OFICIAL_DEFAULT))})
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Intereses Art. 143 (Tasas BCV):</span>
                    <span className="font-semibold text-slate-900">
                      Bs. {formatBs(calculoLive.garantiaTrimestral.interesesAcumuladosArt143)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm font-bold">
                    <span className="font-sans">Total Garantía + Intereses:</span>
                    <span className="text-emerald-700">
                      Bs. {formatBs(calculoLive.garantiaTrimestral.totalGarantiaMasIntereses)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tarjeta B: Retroactividad */}
              <div
                className={`p-5 rounded-xl border-2 transition-all ${
                  calculoLive.seleccionFavorable.metodoAplicado === 'Retroactividad (Literal C)'
                    ? 'border-emerald-600 bg-emerald-50/30 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Opción B: Retroactividad (Art. 142-c LOTTT)
                  </span>
                  {calculoLive.seleccionFavorable.metodoAplicado === 'Retroactividad (Literal C)' && (
                    <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Favorable (Aplica)
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Días Antigüedad (30d por año/fracción):</span>
                    <span className="font-semibold text-slate-900">
                      {calculoLive.retroactividad.diasAntiguedad} Días
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Último Salario Integral:</span>
                    <span className="font-semibold text-slate-900">
                      Bs. {formatBs(calculoLive.salarioIntegralDiario)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Fórmula Legal:</span>
                    <span className="text-slate-600 font-sans text-2xs">
                      {calculoLive.retroactividad.diasAntiguedad} Días × Bs. {formatBs(calculoLive.salarioIntegralDiario)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm font-bold">
                    <span className="font-sans">Total Régimen Retroactivo:</span>
                    <span className="text-slate-900">
                      Bs. {formatBs(calculoLive.retroactividad.montoRetroactividad)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Comparison Banner */}
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-emerald-950 block text-sm">
                  Dictamen Legal Art. 142 Literal D de la LOTTT & Cláusula 70 CCP:
                </span>
                <p className="text-emerald-900 mt-1 leading-relaxed">
                  Se aplica el régimen de <strong>{calculoLive.seleccionFavorable.metodoAplicado}</strong> por resultar el monto cuantitativamente más favorable al trabajador petrolero.
                  {calculoLive.indemnizacionDespidoArt92.aplica && (
                    <span className="block mt-1 font-semibold text-amber-900">
                      ★ Se adiciona el 100% de indemnización legal por Despido Injustificado (Art. 92 LOTTT "Doblete"): Bs. {formatBs(calculoLive.indemnizacionDespidoArt92.monto)}.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Anticipos Control Card (Art. 144 LOTTT) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-800 uppercase text-2xs block">
                  Control de Anticipos de Prestaciones (Art. 144 LOTTT):
                </span>
                <span className="text-slate-600 text-2xs">
                  Límite legal permitido (75% del fondo acumulado): <strong className="font-mono text-slate-900">Bs. {formatBs(calculoLive.controlAnticiposArt144.limiteMaximo75Porciento)}</strong>
                </span>
              </div>
              <div className="text-right font-mono">
                <span className="text-2xs text-slate-500 block">Anticipos Deducidos:</span>
                <span className="font-bold text-red-700">Bs. {formatBs(calculoLive.deducciones.anticipos)}</span>
              </div>
            </div>

            {/* Summary Totals Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                Resumen Ejecutivo de la Liquidación
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 font-sans block">Total Asignaciones:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    Bs. {formatBs(calculoLive.totalAsignaciones)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans block">Total Deducciones de Ley:</span>
                  <span className="font-bold text-red-700 text-sm">
                    Bs. {formatBs(calculoLive.deducciones.totalDeducciones)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans block">Neto Final a Pagar:</span>
                  <span className="font-black text-blue-900 text-base">
                    Bs. {formatBs(calculoLive.netoAPagar)}
                  </span>
                  <span className="text-3xs text-emerald-700 font-bold block">
                    Ref. BCV: ${formatBs(calculoLive.netoEquivalenteUSD)} USD
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep((currentStep - 1) as any)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep((currentStep + 1) as any)}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors shadow-xs"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinishAndSave}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-md"
            >
              <FileText className="w-4 h-4" />
              <span>Guardar y Emitir Recibo Oficial</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
