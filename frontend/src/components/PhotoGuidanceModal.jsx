import React from 'react';
import {
  X,
  Camera,
  Sun,
  Eye,
  Crosshair,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';

const GUIDANCE_TOPICS = [
  {
    id: 'muestras',
    icon: '🧪',
    title: 'Muestras (Vómito, Heces o Secreciones)',
    subtitle: 'Captura cenital sin reflejos',
    badge: 'Fluídos & Deposiciones',
    tips: [
      'Toma cenital (desde arriba, ángulo recto de 90° respecto al suelo).',
      'Usa luz natural abundante. Evita el flash directo para prevenir reflejos blancos sobre líquidos.',
      'Si es posible, incluye una referencia de tamaño al lado (como una moneda, servilleta o regla).',
      'No manipules la muestra sin guantes higiénicos descartables.',
    ],
    exampleTitle: 'Ángulo recomendado',
    exampleDesc: 'Foto cenital a 30-40 cm de distancia con iluminación lateral uniforme.',
  },
  {
    id: 'mucosas',
    icon: '👄',
    title: 'Mucosas Dentales, Encías y Ojos',
    subtitle: 'Inspección de perfusión y coloración vascular',
    badge: 'Signos Vitales Visibles',
    tips: [
      'Levanta con suavidad y calma el belfo o labio superior para exponer la encía sobre los caninos.',
      'Verifica la coloración: Rosado normal, Blanco/Pálido (anemia/shock), Azul/Gris (cianosis/falta de oxígeno) o Amarillo (ictericia hepática).',
      'Toma la foto a 15-20 cm enfocando el tejido gingival.',
      'Para ojos: mantén quieta a la mascota y enfoca de frente evitando el flash en la pupila.',
    ],
    exampleTitle: 'Detalle de coloración',
    exampleDesc: 'Belfo levantado con luz clara para revelar el Tiempo de Llenado Capilar (TLLC).',
  },
  {
    id: 'piel',
    icon: '🩹',
    title: 'Piel, Heridas y Traumatismos',
    subtitle: 'Estrategia de doble encuadre (Macro + Contexto)',
    badge: 'Lesiones & Sangrado',
    tips: [
      'Toma cercana (Macro): Enfocada y nítida a 10-15 cm sobre los bordes de la herida o bulto.',
      'Toma amplia (Contexto anatómico): Una segunda foto que muestre la extremidad completa o zona corporal afectada.',
      'Aparta con cuidado el pelaje alrededor de la lesión si la mascota no experimenta dolor agudo.',
      'Si hay hemorragia activa, prioriza la compresión estéril y acude de inmediato a urgencias.',
    ],
    exampleTitle: 'Estrategia Macro + Contexto',
    exampleDesc: '1 toma de detalle + 1 toma amplia para ubicar con exactitud la zona anatómica.',
  },
  {
    id: 'pezuñas',
    icon: '🦶',
    title: 'Pezuñas, Cascos y Aplomos (Gabarro / Claudicación)',
    subtitle: 'Inspección de apoyo podal y espacio interdigital',
    badge: 'Zootecnia & Campo',
    tips: [
      'Inmoviliza al animal con seguridad en manga o manea antes de levantar la extremidad.',
      'Limpia con agua o cepillo suave el barro adherido al espacio interdigital y suela del casco.',
      'Toma una foto cercana del bulbo del talón y la corona de la pezuña con buena luz natural.',
      'Toma una foto panorámica lateral de la postura de apoyo para registrar el grado de claudicación.',
    ],
    exampleTitle: 'Detalle de pezuña limpia',
    exampleDesc: 'Foto macro del espacio interdigital libre de barro para apreciar grietas, eritema o flemón.',
  },
];

export function PhotoGuidanceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="backdrop-blur-xl bg-slate-900/95 rounded-3xl max-w-2xl w-full shadow-2xl shadow-indigo-950/40 border border-white/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 text-white flex items-start justify-between border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Camera className="w-4 h-4" />
              <span>Guía para el Tutor</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold">
              Consejos para una Foto Diagnóstica Precisa
            </h3>
            <p className="text-xs text-slate-300">
              Una fotografía nítida permite a Gemini AI y al médico veterinario clasificar con máxima precisión el riesgo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Cerrar guía"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {GUIDANCE_TOPICS.map((topic) => (
            <div
              key={topic.id}
              className="bg-slate-950/40 border border-slate-700/50 rounded-2xl p-5 space-y-3 hover:border-indigo-500/30 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{topic.icon}</span>
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base">
                      {topic.title}
                    </h4>
                    <p className="text-xs text-slate-400">{topic.subtitle}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-white/[0.04] border border-white/10 text-slate-300 rounded-full shadow-lg">
                  {topic.badge}
                </span>
              </div>

              {/* Tips List */}
              <ul className="space-y-2 text-xs text-slate-300">
                {topic.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>

              {/* Highlight Note */}
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3 text-[11px] text-indigo-100 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>
                  <strong>Tip Pro:</strong> {topic.exampleDesc}
                </span>
              </div>
            </div>
          ))}

          {/* Quick Warning */}
          <div className="p-4 bg-amber-500/10 border border-amber-400/30 rounded-2xl text-xs text-amber-100 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-amber-200">Prioridad Vital de Seguridad</h5>
              <p className="mt-0.5 text-amber-100/90 leading-relaxed">
                Si tu mascota está sufriendo dolor extremo o se muestra agresiva por el estrés de la herida, no fuerces la toma fotográfica; tu seguridad y la del animal son prioritarias.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white/[0.03] border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-teal-500 hover:brightness-110 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            Entendido, volver a la consulta
          </button>
        </div>
      </div>
    </div>
  );
}

export default PhotoGuidanceModal;
