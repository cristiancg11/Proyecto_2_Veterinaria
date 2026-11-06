/**
 * Validadores y Sanitizadores Clínicos para VetIA
 * Reglas de formato móvil colombiano, telemetría de peso por especie e imágenes de campo.
 */

import { LIVESTOCK_WEIGHT_THRESHOLDS } from '../constants/triageConstants';

/**
 * Tamaño máximo permitido para fotos de campo (en bytes).
 * 12 Megabytes (permite fotos de alta resolución de cámaras móviles en zona rural).
 */
export const MAX_FIELD_PHOTO_SIZE_BYTES = 12 * 1024 * 1024; // 12 MB

/**
 * Extensiones y tipos MIME de imagen permitidos
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

/**
 * Sanitiza un número de celular eliminando caracteres no numéricos,
 * espacios, guiones, puntos y removiendo prefijos internacionales como +57 o 057.
 * Transforma entradas como "310 123 4567" o "+57 (312) 345-6789" a "3101234567".
 * 
 * @param {string} phone 
 * @returns {string} Dígitos limpios sin espacios ni caracteres especiales
 */
export function sanitizePhoneNumber(phone) {
  if (!phone) return '';
  // Limpiar espacios en blanco, guiones, paréntesis y puntos
  let cleaned = String(phone).replace(/[^\d+]/g, '').trim();

  // Quitar +57 al inicio si viene presente
  if (cleaned.startsWith('+57')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('57') && cleaned.length >= 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('057') && cleaned.length >= 13) {
    cleaned = cleaned.substring(3);
  }

  // Retornar estrictamente dígitos
  return cleaned.replace(/\D/g, '');
}

/**
 * Sanitiza y formatea un número de celular colombiano para enlaces web de emergencia (WhatsApp wa.me)
 * 
 * @param {string} rawPhone 
 * @returns {{ cleanNumber: string, waUrlNumber: string, isValid: boolean, error: string | null }}
 */
export function sanitizeColombianMobileForWebLinks(rawPhone) {
  const cleanNumber = sanitizePhoneNumber(rawPhone);
  const validation = validateColombianPhone(cleanNumber);

  return {
    cleanNumber,
    waUrlNumber: validation.isValid ? `57${cleanNumber}` : '',
    isValid: validation.isValid,
    error: validation.error,
  };
}

/**
 * Da formato legible para la interfaz humana (ej: "310 123 4567")
 * 
 * @param {string} phone 
 * @returns {string}
 */
export function formatColombianPhoneDisplay(phone) {
  const clean = sanitizePhoneNumber(phone);
  if (clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  return clean;
}

/**
 * Suite de validación y pruebas de sanitización para números colombianos y enlaces web de emergencia
 * @returns {Array<{ input: string, expected: string, actual: string, passed: boolean }>}
 */
export function runPhoneSanitizationTests() {
  const testCases = [
    { input: '310 123 4567', expected: '3101234567' },
    { input: '+57 312 345 6789', expected: '3123456789' },
    { input: '(315) 987-6543', expected: '3159876543' },
    { input: '318.456.7890', expected: '3184567890' },
    { input: '+573201112233', expected: '3201112233' },
    { input: '573145556677', expected: '3145556677' },
    { input: ' 316-222 3344 ', expected: '3162223344' },
  ];

  return testCases.map((tc) => {
    const actual = sanitizePhoneNumber(tc.input);
    return {
      input: tc.input,
      expected: tc.expected,
      actual,
      passed: actual === tc.expected,
    };
  });
}

/**
 * Valida un número de celular de Colombia (exactamente 10 dígitos iniciando por 3)
 * 
 * @param {string} phone 
 * @returns {{ isValid: boolean, sanitized: string, error: string | null }}
 */
export function validateColombianPhone(phone) {
  const sanitized = sanitizePhoneNumber(phone);

  if (!sanitized) {
    return {
      isValid: false,
      sanitized: '',
      error: 'El número de celular o WhatsApp es obligatorio.',
    };
  }

  if (sanitized.length !== 10) {
    return {
      isValid: false,
      sanitized,
      error: `El celular debe tener exactamente 10 dígitos (ingresaste ${sanitized.length}).`,
    };
  }

  if (!sanitized.startsWith('3')) {
    return {
      isValid: false,
      sanitized,
      error: 'El celular colombiano debe iniciar con el dígito 3 (ej: 3123456789).',
    };
  }

  // Validación de operador válido móvil (300 a 351 aprox)
  const mobileRegex = /^3[0-5]\d{8}$/;
  if (!mobileRegex.test(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: 'Ingresa un número de telefonía celular móvil colombiana válido.',
    };
  }

  return {
    isValid: true,
    sanitized,
    error: null,
  };
}

/**
 * Valida si el peso ingresado es fisiológicamente coherente con la especie seleccionada
 * 
 * @param {string} speciesId - ID de la especie (bovino, equino, etc.)
 * @param {number|string} weight - Peso registrado en kg
 * @returns {{ isValid: boolean, numericWeight: number, minKg: number, maxKg: number, error: string | null, warning: string | null }}
 */
export function validateSpeciesWeight(speciesId, weight) {
  const normalizedSpecies = (speciesId || 'canino').toLowerCase().trim();
  const threshold = LIVESTOCK_WEIGHT_THRESHOLDS[normalizedSpecies] || {
    minKg: 0.1,
    maxKg: 1200,
    speciesName: 'Especie',
    unit: 'kg',
  };

  const parsedWeight = parseFloat(weight);

  if (isNaN(parsedWeight) || parsedWeight <= 0) {
    return {
      isValid: false,
      numericWeight: 0,
      minKg: threshold.minKg,
      maxKg: threshold.maxKg,
      error: 'Por favor ingresa un peso numérico válido mayor a 0 kg.',
      warning: null,
    };
  }

  if (parsedWeight < threshold.minKg) {
    return {
      isValid: false,
      numericWeight: parsedWeight,
      minKg: threshold.minKg,
      maxKg: threshold.maxKg,
      error: `El peso de ${parsedWeight} kg es inferior al mínimo fisiológico para ${threshold.speciesName} (${threshold.minKg} kg).`,
      warning: null,
    };
  }

  if (parsedWeight > threshold.maxKg) {
    return {
      isValid: false,
      numericWeight: parsedWeight,
      minKg: threshold.minKg,
      maxKg: threshold.maxKg,
      error: `El peso de ${parsedWeight} kg excede el rango máximo registrado para ${threshold.speciesName} (${threshold.maxKg} kg).`,
      warning: null,
    };
  }

  // Advertencias por valores atípicos dentro del rango
  let warning = null;
  if (threshold.warningThresholdLow && parsedWeight < threshold.warningThresholdLow) {
    warning = `Nota: ${parsedWeight} kg es bajo para un ejemplar adulto (posible cría o ejemplar joven).`;
  } else if (threshold.warningThresholdHigh && parsedWeight > threshold.warningThresholdHigh) {
    warning = `Nota: ${parsedWeight} kg se sitúa en el límite superior de la especie (ejemplar pesado).`;
  }

  return {
    isValid: true,
    numericWeight: parsedWeight,
    minKg: threshold.minKg,
    maxKg: threshold.maxKg,
    error: null,
    warning,
  };
}

/**
 * Valida el archivo de fotografía de campo tomado por el usuario
 * 
 * @param {File|Blob} file - Archivo proveniente de input o cámara
 * @param {number} [maxSizeBytes=MAX_FIELD_PHOTO_SIZE_BYTES]
 * @returns {{ isValid: boolean, sizeMb: string, error: string | null }}
 */
export function validateFieldPhoto(file, maxSizeBytes = MAX_FIELD_PHOTO_SIZE_BYTES) {
  if (!file) {
    return {
      isValid: true, // La foto es opcional según el flujo
      sizeMb: '0.00',
      error: null,
    };
  }

  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

  // Validación de tipo MIME
  if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      sizeMb,
      error: `Formato de imagen (${file.type || 'desconocido'}) no soportado. Usa JPEG, PNG o WebP.`,
    };
  }

  // Validación de tamaño
  if (file.size > maxSizeBytes) {
    const limitMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      isValid: false,
      sizeMb,
      error: `La fotografía de campo pesa ${sizeMb} MB y excede el límite máximo de ${limitMb} MB.`,
    };
  }

  return {
    isValid: true,
    sizeMb,
    error: null,
  };
}

/**
 * Sanitiza y limpia el texto del motivo de consulta o síntomas
 * 
 * @param {string} text 
 * @returns {{ isValid: boolean, sanitized: string, error: string | null }}
 */
export function sanitizeClinicalDescription(text) {
  if (!text) {
    return {
      isValid: false,
      sanitized: '',
      error: 'La descripción de los síntomas y motivo de consulta es obligatoria.',
    };
  }

  // Limpiar espacios dobles y caracteres de control
  const sanitized = String(text)
    .replace(/[\r\n\t]+/g, ' ')
    .trim();

  if (sanitized.length < 5) {
    return {
      isValid: false,
      sanitized,
      error: 'Por favor describe con más detalle lo que le ocurre al animal (mínimo 5 caracteres).',
    };
  }

  return {
    isValid: true,
    sanitized,
    error: null,
  };
}

