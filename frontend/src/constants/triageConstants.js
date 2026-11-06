/**
 * Constantes y Configuración Médica Zootécnica para VetIA
 * Sistema de Triaje Veterinario y Asistencia de Urgencias Rurales
 */

/**
 * Códigos HEX oficiales de semaforización de urgencia médica
 */
export const URGENCY_HEX_COLORS = {
  CRITICO: '#DC2626', // Rojo emergencia (#dc2626 / #ef4444)
  CRITICAL: '#DC2626',
  RED: '#DC2626',
  URGENTE: '#EA580C', // Naranja alta prioridad (#ea580c / #f97316)
  ORANGE: '#EA580C',
  MODERADO: '#CA8A04', // Ámbar/Amarillo prioritario (#ca8a04 / #f59e0b)
  MODERATE: '#CA8A04',
  YELLOW: '#CA8A04',
  LEVE: '#16A34A', // Verde ambulatorio (#16a34a / #10b981)
  MILD: '#16A34A',
  GREEN: '#16A34A',
};

/**
 * Niveles de urgencia clínica con metadatos semánticos y de interfaz
 */
export const URGENCY_LEVELS = {
  CRITICO: {
    code: 'CRITICO',
    label: 'NIVEL CRÍTICO (EMERGENCIA INMEDIATA)',
    sublabel: 'Riesgo Vital Inminente - Hospitalización Urgente',
    hex: URGENCY_HEX_COLORS.CRITICO,
    bgBadge: 'bg-red-500',
    border: 'border-red-500',
    bgBanner: 'bg-red-50',
    textAccent: 'text-red-600',
    priorityIndex: 1,
    timeWindow: 'Inmediata (< 15 minutos)',
    pulse: true,
  },
  URGENTE: {
    code: 'URGENTE',
    label: 'NIVEL URGENTE (ALTA PRIORIDAD)',
    sublabel: 'Atención médica requerida en menos de 1 a 2 horas',
    hex: URGENCY_HEX_COLORS.URGENTE,
    bgBadge: 'bg-orange-500',
    border: 'border-orange-500',
    bgBanner: 'bg-orange-50',
    textAccent: 'text-orange-600',
    priorityIndex: 2,
    timeWindow: '1 - 2 horas',
    pulse: false,
  },
  MODERADO: {
    code: 'MODERADO',
    label: 'NIVEL MODERADO (ATENCIÓN PRIORITARIA)',
    sublabel: 'Atención médica requerida en el transcurso del día',
    hex: URGENCY_HEX_COLORS.MODERADO,
    bgBadge: 'bg-amber-500',
    border: 'border-amber-500',
    bgBanner: 'bg-amber-50',
    textAccent: 'text-amber-600',
    priorityIndex: 3,
    timeWindow: 'Mismo día (< 6-12 horas)',
    pulse: false,
  },
  LEVE: {
    code: 'LEVE',
    label: 'NIVEL LEVE (MANEJO AMBULATORIO)',
    sublabel: 'Sin riesgo vital aparente - Manejo en 24-48 horas',
    hex: URGENCY_HEX_COLORS.LEVE,
    bgBadge: 'bg-emerald-500',
    border: 'border-emerald-500',
    bgBanner: 'bg-emerald-50',
    textAccent: 'text-emerald-600',
    priorityIndex: 4,
    timeWindow: '24 - 48 horas',
    pulse: false,
  },
};

/**
 * Umbrales de peso por especie zootécnica y pecuaria (telemetría de campo)
 */
export const LIVESTOCK_WEIGHT_THRESHOLDS = {
  bovino: {
    speciesName: 'Bovino',
    minKg: 40,
    maxKg: 1200,
    defaultKg: 450,
    unit: 'kg',
    warningThresholdLow: 60,
    warningThresholdHigh: 950,
    category: 'Rumiante Mayor',
  },
  equino: {
    speciesName: 'Equino',
    minKg: 80,
    maxKg: 750,
    defaultKg: 380,
    unit: 'kg',
    warningThresholdLow: 120,
    warningThresholdHigh: 650,
    category: 'Monogástrico Mayor',
  },
  porcino: {
    speciesName: 'Porcino',
    minKg: 1.0,
    maxKg: 350,
    defaultKg: 95,
    unit: 'kg',
    warningThresholdLow: 1.5,
    warningThresholdHigh: 280,
    category: 'Monogástrico de Granja',
  },
  ovino_caprino: {
    speciesName: 'Ovino / Caprino',
    minKg: 4.0,
    maxKg: 130,
    defaultKg: 45,
    unit: 'kg',
    warningThresholdLow: 8.0,
    warningThresholdHigh: 100,
    category: 'Rumiante Menor',
  },
  aves_corral: {
    speciesName: 'Aves de Corral',
    minKg: 0.05,
    maxKg: 8.0,
    defaultKg: 2.4,
    unit: 'kg',
    warningThresholdLow: 0.1,
    warningThresholdHigh: 6.0,
    category: 'Avícola de Campo',
  },
  cuyes_conejos: {
    speciesName: 'Cuyes / Conejos',
    minKg: 0.15,
    maxKg: 6.0,
    defaultKg: 1.2,
    unit: 'kg',
    warningThresholdLow: 0.3,
    warningThresholdHigh: 4.5,
    category: 'Cunicular / Granja',
  },
  canino: {
    speciesName: 'Canino',
    minKg: 1.0,
    maxKg: 90,
    defaultKg: 22,
    unit: 'kg',
    warningThresholdLow: 2.5,
    warningThresholdHigh: 65,
    category: 'Canino Rural',
  },
  felino: {
    speciesName: 'Felino',
    minKg: 0.5,
    maxKg: 15,
    defaultKg: 4.2,
    unit: 'kg',
    warningThresholdLow: 1.5,
    warningThresholdHigh: 9.0,
    category: 'Felino Rural',
  },
};

/**
 * Directorio de números de emergencia agropecuaria y veterinaria de Nariño / Pasto
 */
export const NARINO_EMERGENCY_CONTACTS = [
  {
    entity: 'ICA Seccional Nariño (Sanidad Animal e Inocuidad)',
    phone: '+57 (602) 7226500',
    directMobile: '018000910112',
    zone: 'Pasto y Departamental Nariño',
    service: 'Notificación de sospechas de enfermedades de control oficial (Fiebre aftosa, rabia silvestre, PPA)',
    available: 'Lunes a Viernes 8:00 AM - 5:00 PM / Línea de urgencia 24H',
  },
  {
    entity: 'Corponariño - Fauna Silvestre y Urgencias Rurales',
    phone: '+57 (602) 7309282',
    directMobile: '+57 318 3505293',
    zone: 'Nariño - Pasto / Altiplano',
    service: 'Rescate de fauna rural silvestre y conflicto fauna-ganado',
    available: 'Atención 24 Horas',
  },
  {
    entity: 'Clínica Veterinaria UDENAR (Universidad de Nariño - Torobajo)',
    phone: '+57 (602) 7291411',
    directMobile: '+57 317 6451290',
    zone: 'Pasto - Torobajo',
    service: 'Hospitalización, cirugía de grandes y pequeños animales, laboratorio clínico',
    available: 'Urgencias 24 Horas',
  },
  {
    entity: 'Policía de Carabineros y Protección Ambiental Nariño',
    phone: '123',
    directMobile: '+57 311 4087112',
    zone: 'Sector Rural y Corregimientos de Pasto',
    service: 'Seguridad en el campo, arreo y atención ante maltrato o contingencias',
    available: '24 Horas / 365 Días',
  },
  {
    entity: 'Cuerpo de Bomberos Voluntarios de Pasto',
    phone: '119',
    directMobile: '+57 (602) 7230000',
    zone: 'Pasto y Veredas Aledañas',
    service: 'Rescate de semovientes en abismos, zanjas, ríos e incendios forestales',
    available: 'Línea de emergencia 24/7',
  },
  {
    entity: 'Defensa Civil Colombiana - Seccional Nariño',
    phone: '144',
    directMobile: '+57 (602) 7235008',
    zone: 'Nariño',
    service: 'Apoyo en emergencias hidroclimatológicas e inundaciones en predios rurales',
    available: '24 Horas',
  },
  {
    entity: 'Cruz Roja Colombiana Seccional Nariño',
    phone: '132',
    directMobile: '+57 (602) 7230333',
    zone: 'Pasto',
    service: 'Socorro y apoyo humanitario rural',
    available: '24 Horas',
  },
];

/**
 * Normalizador seguro del nivel de urgencia para obtener su configuración
 * @param {string} rawLevel 
 * @returns {typeof URGENCY_LEVELS.MODERADO}
 */
export function getUrgencyConfig(rawLevel = 'MODERADO') {
  if (!rawLevel) return URGENCY_LEVELS.MODERADO;
  const key = String(rawLevel).trim().toUpperCase();
  if (key === 'CRITICO' || key === 'CRITICAL' || key === 'RED') return URGENCY_LEVELS.CRITICO;
  if (key === 'URGENTE' || key === 'ORANGE') return URGENCY_LEVELS.URGENTE;
  if (key === 'MODERADO' || key === 'MODERATE' || key === 'YELLOW') return URGENCY_LEVELS.MODERADO;
  if (key === 'LEVE' || key === 'MILD' || key === 'GREEN') return URGENCY_LEVELS.LEVE;
  return URGENCY_LEVELS.MODERADO;
}
