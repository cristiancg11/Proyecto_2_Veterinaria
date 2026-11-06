import { jsPDF } from 'jspdf';

/**
 * Generador de Ficha Clínica de Pre-Ingreso en formato PDF profesional para VetIA
 * Utiliza jsPDF para maquetar una ficha veterinaria sobria, limpia y formal.
 * 
 * @param {Object} data - Datos clínicos del triaje
 * @param {string} [data.species] - Especie o tipo de paciente
 * @param {number|string} [data.weight_kg] - Peso registrado en kg
 * @param {string} [data.description] - Descripción del motivo de consulta / síntomas
 * @param {string} [data.urgency_level] - Nivel de urgencia (CRÍTICO, URGENTE, MODERADO, LEVE)
 * @param {string} [data.color_code] - Código de color alternativo
 * @param {string|Array} [data.presumptive_diagnosis] - Diagnóstico presuntivo emitido por la IA
 * @param {string} [data.visual_findings] - Hallazgos visuales detectados en la foto
 * @param {Array<string>} [data.first_aid_actions] - Pautas de primeros auxilios inmediatos
 * @param {Array<string>} [data.vital_risks] - Riesgos vitales a monitorear
 * @param {string} [data.record_id] - ID único del expediente en Supabase
 * @param {string} [data.tutor_name] - Nombre del tutor o productor pecuario
 * @param {string} [data.created_at] - Marca de tiempo de registro
 * @returns {string} Nombre del archivo descargado
 */
export function generateTriagePDF(data = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Metadatos embebidos en el documento PDF
  doc.setProperties({
    title: 'VetIA - Ficha Clínica de Pre-Ingreso y Triage',
    subject: 'Evaluación y Derivación Médica Veterinaria de Urgencias',
    author: 'VetIA Rural Triage System',
    keywords: 'VetIA, Triage, Veterinaria, Zootecnia, Urgencias, Nariño, Ficha Clínica',
    creator: 'VetIA Rural Triage System - Motor Multimodal IA',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // Código de folio o seguimiento de caso único con timestamp
  const now = new Date();
  const timestampStr = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const caseFolio = data.folio_code || data.case_id || `VET-NAR-${timestampStr}-${randomSuffix}`;

  // =========================================================================
  // 1. Encabezado institucional: Barra superior esmeralda oscuro (#064e3b)
  // =========================================================================
  doc.setFillColor(6, 78, 59); // #064e3b
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Línea de acento esmeralda claro (#10b981)
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 24.5, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(255, 255, 255);
  doc.text('VetIA - Hospital Digital & Triage de Urgencias', margin, 13);

  // Folio en esquina superior derecha del encabezado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(167, 243, 208); // emerald-200
  doc.text(`FOLIO: ${caseFolio}`, pageWidth - margin, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 250, 229);
  doc.text('Ficha Clínica de Pre-Ingreso y Derivación Médica Asistida por IA', margin, 20);

  y = 33;

  // =========================================================================
  // 2. Metadatos del documento (Fecha/hora, ID de consulta y Nombre del tutor)
  // =========================================================================
  const formattedDate = data.created_at
    ? new Date(data.created_at).toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : now.toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

  const recordId = data.record_id || data.id || caseFolio;
  const tutorName = data.tutor_name || data.userName || data.user_email || 'Tutor Registrado';

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('FOLIO / EXPEDIENTE:', margin + 4, y + 5.5);
  doc.text('FECHA Y HORA:', margin + 65, y + 5.5);
  doc.text('NOMBRE DEL TUTOR / PRODUCTOR:', margin + 120, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(String(recordId), margin + 4, y + 11.5);
  doc.text(String(formattedDate), margin + 65, y + 11.5);
  doc.text(String(tutorName), margin + 120, y + 11.5);

  y += 22;

  // =========================================================================
  // 3. Cuadro de Urgencia Clínica (Color & borde según severidad)
  // =========================================================================
  const rawUrgency = (data.urgency_level || data.color_code || 'MODERADO').toUpperCase();
  let urgencyTitle = 'NIVEL MODERADO (ATENCIÓN PRIORITARIA)';
  let urgencySub = 'Atención médica requerida en el transcurso del día';
  let urgencyColor = [202, 138, 4]; // Amarillo (#ca8a04)
  let urgencyBg = [254, 249, 195];

  if (['CRITICO', 'CRITICAL', 'RED'].includes(rawUrgency)) {
    urgencyTitle = 'NIVEL CRÍTICO (EMERGENCIA INMEDIATA)';
    urgencySub = 'Riesgo Vital Inminente - Requiere hospitalización urgente inmediata';
    urgencyColor = [220, 38, 38]; // Rojo (#dc2626)
    urgencyBg = [254, 226, 226];
  } else if (['URGENTE', 'ORANGE'].includes(rawUrgency)) {
    urgencyTitle = 'NIVEL URGENTE (ALTA PRIORIDAD)';
    urgencySub = 'Atención médica presencial requerida en menos de 1 a 2 horas';
    urgencyColor = [234, 88, 12]; // Naranja (#ea580c)
    urgencyBg = [255, 237, 213];
  } else if (['LEVE', 'MILD', 'GREEN'].includes(rawUrgency)) {
    urgencyTitle = 'NIVEL LEVE (MANEJO AMBULATORIO)';
    urgencySub = 'Sin riesgo vital aparente detectado - Seguimiento clínico en 24 a 48 horas';
    urgencyColor = [22, 163, 74]; // Verde (#16a34a)
    urgencyBg = [220, 252, 231];
  }

  doc.setFillColor(...urgencyBg);
  doc.setDrawColor(...urgencyColor);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, contentWidth, 18, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...urgencyColor);
  doc.text(`SEMÁFORO DE TRIAJE: ${urgencyTitle}`, margin + 5, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(urgencySub, margin + 5, y + 13.5);

  y += 24;

  // =========================================================================
  // 4. Sección Paciente (Especie, Peso en kg, Motivo de consulta)
  // =========================================================================
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DATOS DEL PACIENTE & MOTIVO DE CONSULTA', margin + 3, y + 4.5);

  y += 10;
  const species = data.species || data.pet_type || data.especie || 'No especificada';
  const weight = data.weight_kg || data.peso_kg || data.weight || 'No registrado';
  const description =
    data.description ||
    data.symptoms_description ||
    data.descripcion ||
    'Sin descripción detallada ingresada.';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Especie / Categoría:', margin + 3, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(String(species), margin + 38, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Peso Registrado:', margin + 115, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${weight} kg`, margin + 144, y);

  y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Síntomas / Motivo:', margin + 3, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const descLines = doc.splitTextToSize(description, contentWidth - 6);
  doc.text(descLines, margin + 3, y);
  y += descLines.length * 4 + 4;

  // =========================================================================
  // 5. Bloque Diagnóstico Presuntivo y Hallazgos Visuales (IA Clínica)
  // =========================================================================
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DIAGNÓSTICO PRESUNTIVO & HALLAZGOS VISUALES (IA CLÍNICA)', margin + 3, y + 4.5);

  y += 10;
  const presumptive = Array.isArray(data.presumptive_diagnosis)
    ? data.presumptive_diagnosis.join(', ')
    : data.presumptive_diagnosis || 'Evaluación preliminar de triaje.';
  const visualFindings =
    data.visual_findings ||
    'Signos visuales de la lesión evaluados mediante visión computacional multimodal.';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 20, 20);
  doc.text('Diagnóstico Presuntivo:', margin + 3, y);
  y += 3.8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const presLines = doc.splitTextToSize(presumptive, contentWidth - 6);
  doc.text(presLines, margin + 3, y);
  y += presLines.length * 3.8 + 3.5;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('Hallazgos Visuales Detectados:', margin + 3, y);
  y += 3.8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const visLines = doc.splitTextToSize(visualFindings, contentWidth - 6);
  doc.text(visLines, margin + 3, y);
  y += visLines.length * 3.8 + 4;

  // =========================================================================
  // 6. Bloque de Primeros Auxilios de Campo (Soporte Inmediato)
  // =========================================================================
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PAUTAS DE PRIMEROS AUXILIOS DE CAMPO (SOPORTE INMEDIATO)', margin + 3, y + 4.5);

  y += 10;
  const firstAid = Array.isArray(data.first_aid_actions)
    ? data.first_aid_actions
    : [
        data.first_aid_actions ||
          'Mantener al paciente en reposo en un ambiente templado y ventilado sin suministrar medicamentos de uso humano.',
      ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  firstAid.slice(0, 4).forEach((item, idx) => {
    const itemText = `${idx + 1}. ${item}`;
    const itemLines = doc.splitTextToSize(itemText, contentWidth - 6);
    doc.text(itemLines, margin + 3, y);
    y += itemLines.length * 3.8 + 1.5;
  });

  // =========================================================================
  // 7. Pie de página: Descargo de responsabilidad médico obligatorio
  // =========================================================================
  const footerY = pageHeight - 16;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const disclaimer =
    'Documento de pre-ingreso orientativo generado por asistencia de IA de VetIA. La atención definitiva debe ser supervisada por un médico veterinario colegiado.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth - 45);
  doc.text(disclaimerLines, margin, footerY + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Folio: ${caseFolio}`, pageWidth - margin, footerY + 3.5, { align: 'right' });

  // Nombre de descarga: Ficha_VetIA_[Especie]_[Fecha].pdf
  const rawFirstWord = species.split(' ')[0] || 'Paciente';
  const cleanSpecies = rawFirstWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '');
  const dateStr = now.toISOString().slice(0, 10);
  const fileName = `Ficha_VetIA_${cleanSpecies}_${dateStr}.pdf`;

  doc.save(fileName);
  return fileName;
}

export default generateTriagePDF;

