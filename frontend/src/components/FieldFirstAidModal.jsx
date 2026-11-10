import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Droplets,
  Activity,
  CheckCircle2,
  Stethoscope,
  Compass,
  Phone,
  BookOpen,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const FIRST_AID_GUIDELINES = [
  {
    id: 'timpanismo',
    title: 'Timpanismo Ruminal Agudo (Meteorismo)',
    species: 'Bovinos, Ovinos y Caprinos',
    badge: 'Emergencia Crítica Asfíctica',
    badgeColor: 'bg-red-500 text-white',
    icon: AlertTriangle,
    symptoms:
      'Distensión marcada y tensa del flanco izquierdo (fosa del ijar como tambor), dificultad respiratoria severa, lengua afuera, mugidos de dolor e imposibilidad de echarse.',
    steps: [
      {
        step: 1,
        title: 'Posicionamiento y Marcha',
        desc: 'Mantén al animal en pie con el tren delantero elevado sobre una pendiente o montículo para facilitar la salida de gases por el cardias.',
      },
      {
        step: 2,
        title: 'Administración de Agente Antiespumante',
        desc: 'Si es timpanismo espumoso (consumo de leguminosas húmedas), suministra vía oral de 500 a 1000 ml de aceite mineral o vegetal (aceite de cocina) o silicona/antiespumante comercial para romper burbujas.',
      },
      {
        step: 3,
        title: 'Descompresión de Urgencia Extrema',
        desc: 'Intenta pasar una sonda orogástrica lubricada. Si la asfixia es inminente y el animal cae, realiza punción en el centro de la fosa del ijar izquierdo con trocar ruminal o cánula estéril.',
      },
      {
        step: 4,
        title: 'Prevención Posterior',
        desc: 'Retira al lote de pasturas con rocío matutino o leguminosas tiernas. Ofrece heno seco antes del pastoreo.',
      },
    ],
  },
  {
    id: 'colico_equino',
    title: 'Cólico Equino en Faena de Campo',
    species: 'Caballos, Mulas y Asnos',
    badge: 'Urgencia Quirúrgica / Médica',
    badgeColor: 'bg-amber-500 text-white',
    icon: HeartPulse,
    symptoms:
      'El equino se mira continuamente los flancos, patea el vientre, manotea el suelo, suda copiosamente, intenta echarse y revolcarse bruscamente, pulso acelerado.',
    steps: [
      {
        step: 1,
        title: 'Caminar Continuo y Vigilancia',
        desc: 'Camina al equino a paso lento y parejo. Evita bajo toda circunstancia que se revuelque bruscamente, pues esto puede ocasionar una torsión o desplazamiento intestinal fatal.',
      },
      {
        step: 2,
        title: 'Restricción Inmediata de Alimento',
        desc: 'Retira inmediatamente concentrados, granos, forraje fresco y agua fría. Deja libre de obstáculos el corral.',
      },
      {
        step: 3,
        title: 'Medición de Constantes Básicas',
        desc: 'Evalúa la frecuencia cardíaca (normal 28-44 lpm) y el color de las mucosas oculares/gingivales (si están pálidas o azuladas indica shock).',
      },
      {
        step: 4,
        title: 'Atención Profesional sin Medicar a Ciegas',
        desc: 'No apliques analgésicos fuertes antes de que el médico veterinario examine al caballo, ya que enmascara los síntomas del cuadro obstructivo.',
      },
    ],
  },
  {
    id: 'heridas_alambre',
    title: 'Heridas Cortantes por Alambre de Púa y Hemorragias',
    species: 'Todas las especies de campo',
    badge: 'Atención Quirúrgica Inmediata',
    badgeColor: 'bg-rose-600 text-white',
    icon: ShieldAlert,
    symptoms:
      'Cortes en pecho, garrones o extremidades con sangrado continuo, exposición de fascia muscular o tendones y riesgo de infección por Clostridium / Tétanos.',
    steps: [
      {
        step: 1,
        title: 'Control de Hemorragia por Compresión',
        desc: 'Aplica presión firme y directa sobre la herida con un paño limpio o compresas estériles durante al menos 5 a 10 minutos ininterrumpidos sin retirar para verificar.',
      },
      {
        step: 2,
        title: 'Lavado Mecánico Profundo',
        desc: 'Lava la zona con abundante agua potable limpia o solución salina para retirar tierra, estiércol o virutas de alambre. No uses tierra, creolina sin diluir ni polvos cáusticos.',
      },
      {
        step: 3,
        title: 'Antisepsia y Protección contra Moscas',
        desc: 'Aplica solución yodada diluida (al 1%) o clorhexidina. En zonas tropicales o cálidas, rocía repelente larvicida (curabichera) alrededor de los bordes para prevenir miasis.',
      },
      {
        step: 4,
        title: 'Profilaxis Antitetánica y Antibiótica',
        desc: 'Coordina con el veterinario la aplicación de suero antitetánico o refuerzo de toxoide y antibioterapia preventiva (penicilinas / oxitetraciclinas).',
      },
    ],
  },
  {
    id: 'diarrea_neonatal',
    title: 'Diarrea Neonatal y Deshidratación en Crías',
    species: 'Terneros, Lechones y Corderos',
    badge: 'Riesgo Vital por Deshidratación',
    badgeColor: 'bg-blue-600 text-white',
    icon: Droplets,
    symptoms:
      'Heces acuosas amarillentas o blanquecinas, ojos hundidos (endoftalmia), orejas y extremidades frías, letargia profunda y pérdida del reflejo de deglución.',
    steps: [
      {
        step: 1,
        title: 'Aislamiento Térmico y Cama Seca',
        desc: 'Separa la cría a un corral cerrado, libre de corrientes de aire y con abundante paja seca. La hipotermia agrava rápidamente el shock metabólico.',
      },
      {
        step: 2,
        title: 'Terapia de Rehidratación Oral (TRO)',
        desc: 'Suministra electrolitos orales (sales de rehidratación con glucosa, sodio, potasio y bicarbonato) a temperatura tibia (38°C), en dosis de 1.5 a 2 litros por toma en terneros.',
      },
      {
        step: 3,
        title: 'Manejo de la Leche',
        desc: 'No suspendas la lactancia por más de 12 horas. Alterna tomas de sales de rehidratación con tomas de leche para evitar la desnutrición energética.',
      },
      {
        step: 4,
        title: 'Diagnóstico Causal',
        desc: 'Toma muestra o fotografía para diferenciar entre origen infeccioso (Rotavirus, Coronavirus, E. coli, Criptosporidio) o nutricional por exceso de consumo.',
      },
    ],
  },
  {
    id: 'gabarro_pezuñas',
    title: 'Gabarro / Pododermatitis Infecciosa de Temporada Húmeda',
    species: 'Bovinos, Ovinos y Caprinos',
    badge: 'Enfermedad Estacional del Terreno',
    badgeColor: 'bg-indigo-600 text-white',
    icon: Activity,
    symptoms:
      'Claudicación severa, apoyo en pinza, piel interdigital roja, agrietada, exudativa y con olor fétido característico por reblandecimiento del casco.',
    steps: [
      {
        step: 1,
        title: 'Inspección y Limpieza de Casco',
        desc: 'Inmoviliza la pata con manea segura. Retira barro compactado, piedras o espinas incrustadas en el espacio interdigital con agua limpia y cepillo suave.',
      },
      {
        step: 2,
        title: 'Pediluvio o Cura Tópica Antiséptica',
        desc: 'Aplica solución tópica de sulfato de cobre (5%) o sulfato de zinc, o tintura de yodo al 7% en toda la herida interdigital.',
      },
      {
        step: 3,
        title: 'Aislamiento en Superficie Firme',
        desc: 'Mantén al lote afectado en corrales con suelo firme y seco durante el tratamiento para evitar reinfección bacteriana (Fusobacterium necrophorum).',
      },
      {
        step: 4,
        title: 'Tratamiento Sistémico',
        desc: 'En casos avanzados con flemón o celulitis coronaria, se requiere antibioterapia sistémica pautada por el médico veterinario.',
      },
    ],
  },
  {
    id: 'intoxicacion_campo',
    title: 'Sospecha de Intoxicación por Plantas o Agroquímicos',
    species: 'Todas las especies ganaderas',
    badge: 'Intoxicación Aguda',
    badgeColor: 'bg-purple-600 text-white',
    icon: Stethoscope,
    symptoms:
      'Sialorrea intensa (babeo excesivo), marcha tambaleante, convulsiones o temblores, pupilas muy dilatadas o contraídas, timpanismo súbito tras cambio de lote.',
    steps: [
      {
        step: 1,
        title: 'Retiro Inmediato del Potrero',
        desc: 'Mueve de inmediato al resto del lote fuera de la pastura o zona fumigada para evitar nuevos animales afectados.',
      },
      {
        step: 2,
        title: 'Sombra y Entorno Tranquilo',
        desc: 'Coloca al animal en un corral con sombra abundante y evita ruidos o arreos violentos que eleven la temperatura corporal o aceleren la circulación del tóxico.',
      },
      {
        step: 3,
        title: 'Administración de Carbón Activado',
        desc: 'Si la ingestión fue reciente y el animal puede tragar con seguridad, suministra suspensión de carbón activado para adsorber toxinas en el tracto digestivo.',
      },
      {
        step: 4,
        title: 'Identificación de la Muestra',
        desc: 'Recoge una muestra de la maleza sospechosa o anota el principio activo del herbicida/plaguicida utilizado para indicárselo al veterinario de urgencia.',
      },
    ],
  },
];

export function FieldFirstAidModal({ isOpen, onClose }) {
  const [selectedId, setSelectedId] = useState('timpanismo');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  React.useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  if (!isOpen) return null;

  const currentGuide = FIRST_AID_GUIDELINES.find((g) => g.id === selectedId) || FIRST_AID_GUIDELINES[0];
  const IconComponent = currentGuide.icon;

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-surface-dim/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-surface-container-high/60 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-high/40 p-6 text-on-surface flex items-center justify-between gap-4 border-b border-surface-container-high/60">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-container to-blue-700 text-white flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(37,99,235,0.4)]">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-primary border border-primary/30 px-2.5 py-0.5 rounded-full">
                  Protocolo Quirúrgico & Campo
                </span>
                <span className="text-xs text-on-surface-variant">• Zootecnia y Estabilización</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight mt-0.5">
                Guía Rápida de Primeros Auxilios de Campo
              </h3>
              <p className="text-xs text-on-surface-variant">
                Pautas de estabilización de urgencia para ganado mayor, menor y animales de granja.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-white transition cursor-pointer border border-surface-container-high/60"
            title="Cerrar Guía"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout: Left Nav + Right Details */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-surface-container-high/60 bg-surface-container-lowest">
          {/* Left Index (Panel izquierdo de catálogo de urgencias) */}
          <div className="md:col-span-4 p-4 space-y-2 bg-surface-container-low overflow-y-auto max-h-72 md:max-h-none">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline block px-2 mb-1">
              Catálogo de Urgencias en Finca
            </span>
            {FIRST_AID_GUIDELINES.map((item) => {
              const ItemIcon = item.icon;
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-3 rounded-xl transition flex items-start space-x-3 cursor-pointer ${
                    isSelected
                      ? 'bg-surface-container-high border border-primary/50 text-on-surface ring-1 ring-primary/40 shadow-sm'
                      : 'hover:bg-surface-container border border-transparent text-on-surface-variant'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-surface-container-highest text-outline'
                    }`}
                  >
                    <ItemIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5
                      className={`text-xs font-bold truncate leading-tight ${
                        isSelected ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      {item.title}
                    </h5>
                    <span className="text-[11px] text-on-surface-variant block truncate">
                      {item.species}
                    </span>
                  </div>
                  {isSelected && <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>

          {/* Right Detailed Procedure (Panel derecho con cronómetro de paro y guía por fases) */}
          <div className="md:col-span-8 p-6 sm:p-8 space-y-6 bg-surface-container-lowest overflow-y-auto">
            {/* Header of selected guide + Cronómetro de Paro / Reanimación */}
            <div className="space-y-4 border-b border-surface-container-high/60 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${currentGuide.badgeColor}`}>
                    {currentGuide.badge}
                  </span>
                  <span className="text-xs font-bold text-on-surface-variant bg-surface-container border border-surface-container-high px-2.5 py-0.5 rounded-full">
                    Especie: {currentGuide.species}
                  </span>
                </div>

                {/* Cronómetro de paro / estabilización en tiempo real */}
                <div className="flex items-center space-x-2 bg-surface-container px-3 py-1.5 rounded-xl border border-surface-container-high">
                  <span className="text-[10px] uppercase font-bold text-outline">Cronómetro de Urgencia:</span>
                  <span className="font-mono font-bold text-sm text-secondary">{formatTimer(timerSeconds)}</span>
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-container text-white hover:bg-primary transition cursor-pointer"
                  >
                    {isTimerRunning ? 'Pausar' : 'Iniciar'}
                  </button>
                  {timerSeconds > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsTimerRunning(false);
                        setTimerSeconds(0);
                      }}
                      className="text-[10px] text-outline hover:text-white"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <h4 className="text-xl sm:text-2xl font-black text-on-surface">
                {currentGuide.title}
              </h4>
              <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container-high text-on-surface text-xs sm:text-sm leading-relaxed">
                <strong className="block font-bold text-secondary mb-0.5">Signos Clave de Identificación en Terreno:</strong>
                {currentGuide.symptoms}
              </div>
            </div>

            {/* Protocol Steps / Guía por Fases */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-outline">
                Guía por Fases de Estabilización Inmediata:
              </h5>

              <div className="space-y-3">
                {currentGuide.steps.map((s) => (
                  <div
                    key={s.step}
                    className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/60 flex items-start space-x-4 hover:border-primary/40 transition shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-container to-blue-700 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-md">
                      F{s.step}
                    </div>
                    <div className="space-y-1">
                      <h6 className="font-extrabold text-sm text-on-surface">{s.title}</h6>
                      <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning Note */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/60 flex items-start space-x-3 text-xs">
              <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed text-on-surface-variant">
                <strong className="text-on-surface">Aviso Clínico Importante:</strong> Estas pautas constituyen maniobras de estabilización de soporte en faena. Todo cuadro crítico debe ser valorado presencialmente por un médico veterinario zootécnico colegiado.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-8 border-t border-surface-container-high/60 bg-surface-container-lowest flex items-center justify-between">
          <span className="text-xs text-outline">
            Manual de Urgencias Pecuarias VetIA • Soporte Asistido
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-container via-blue-600 to-blue-700 hover:brightness-110 text-white font-bold text-xs shadow-[0_0_14px_rgba(37,99,235,0.4)] transition cursor-pointer"
          >
            Entendido / Cerrar Guía
          </button>
        </div>
      </div>
    </div>
  );
}

export default FieldFirstAidModal;

