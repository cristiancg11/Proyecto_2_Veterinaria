import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, Loader2, MessageSquare, AlertCircle, X, Wifi } from 'lucide-react';
import { sendChatMessage } from '../services/api';
import { supabase } from '../services/supabaseClient';

const QUICK_PROMPTS = [
  '¿Cuál es la dosis, manejo y medicación sugerida?',
  '¿Cuáles son los cuidados en casa y signos de alarma?',
  '¿Cómo se espera que sea la evolución y pronóstico?',
  '¿Qué fármacos o acciones están contraindicadas?',
];

export function TriageChat({ triageId, petType = 'Mascota', triageContext = null }) {
  const activeTriageId = triageId || triageContext?.record_id || triageContext?.id || 'active-case';

  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: `Hola, soy el Asistente Clínico de VetIA. Tengo en contexto los datos del paciente (${petType}${triageContext?.primary_diagnosis ? ` • ${triageContext.primary_diagnosis}` : ''}). Respondo con precisión clínica directa a cualquier duda del médico o tutor sobre el diagnóstico, tratamiento, cuidados en casa, signos de alarma, dosis o medicación. ¿En qué puedo orientarte?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const loading = isTyping;
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history from Supabase triage_chat_messages
  const loadChatHistory = useCallback(async () => {
    if (!activeTriageId || activeTriageId === 'active-case') return;

    try {
      const { data, error: fetchErr } = await supabase
        .from('triage_chat_messages')
        .select('*')
        .eq('triage_id', activeTriageId)
        .order('created_at', { ascending: true });

      if (!fetchErr && data && data.length > 0) {
        setMessages(
          data.map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            sender: msg.sender,
            content: msg.content,
            created_at: msg.created_at,
          }))
        );
      }
    } catch (err) {
      console.warn('[TriageChat] Error al cargar historial previo de chat:', err);
    }
  }, [activeTriageId]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleCancelQuery = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTyping(false);
  };

  const handleSendMessage = async (textToSend) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isTyping) return;

    setError(null);
    setInputText('');

    const newMessages = [...messages, { role: 'user', sender: 'user', content: messageContent }];
    setMessages(newMessages);
    setIsTyping(true);

    // Cancelar cualquier llamada previa pendiente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Timeout de 20 segundos para desbloqueo estricto del chat
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 20000);

    // Persist user message to Supabase
    try {
      await supabase.from('triage_chat_messages').insert([
        {
          triage_id: activeTriageId,
          sender: 'user',
          content: messageContent,
        },
      ]);
    } catch (dbErr) {
      console.warn('[TriageChat] Error guardando mensaje de usuario en Supabase:', dbErr);
    }

    try {
      // Build clinical context payload with explicit clinical assistant system instructions
      const clinicalSystemInstruction =
        'Eres el Asistente Clínico de VetIA. Tienes en contexto los datos del paciente. Responde con precisión clínica directa a cualquier duda del médico o tutor sobre el diagnóstico, tratamiento, cuidados en casa o medicación.';

      const contextPayload = {
        ...(triageContext || {}),
        record_id: activeTriageId,
        id: activeTriageId,
        pet_type: petType,
        species: petType,
        system_prompt: clinicalSystemInstruction,
        system_instruction: clinicalSystemInstruction,
      };

      // Call API service with history, user_message, triage_context and triage_id
      const response = await sendChatMessage({
        history: newMessages.slice(0, -1),
        user_message: messageContent,
        triage_context: contextPayload,
        triage_id: activeTriageId,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const replyText = response.reply || response.message || 'Respuesta clínica procesada.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          sender: 'assistant',
          content: replyText,
        },
      ]);

      // Persist AI reply to Supabase with sender: 'assistant'
      try {
        await supabase.from('triage_chat_messages').insert([
          {
            triage_id: activeTriageId,
            sender: 'assistant',
            content: replyText,
          },
        ]);
      } catch (dbErr) {
        console.warn('[TriageChat] Error guardando respuesta IA en Supabase:', dbErr);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[TriageChat] Error al comunicarse con el asistente:', err);

      const isAborted =
        err.name === 'AbortError' ||
        err.message?.toLowerCase().includes('abort') ||
        controller.signal.aborted;

      const userNotice = isAborted
        ? '⚠️ La consulta tardó más de 20 segundos en responder o fue cancelada para liberar la interfaz. Puedes volver a intentar ahora.'
        : `⚠️ ${err.message || 'No se pudo obtener respuesta del asistente IA.'} Puedes reintentar tu pregunta.`;

      setError(userNotice);

      // Despliega burbuja en el chat con opción de reintento para que la UI nunca se quede colgada
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          sender: 'assistant',
          isError: true,
          content: userNotice,
        },
      ]);
    } finally {
      clearTimeout(timeoutId);
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white dark:bg-[#162420] rounded-2xl shadow-xs border border-[#DCE6E0] dark:border-[#233630] overflow-hidden flex flex-col h-full min-h-[460px] max-h-[600px]">
      {/* Real-time Connection Status Pill & Cancellation Header */}
      <div className="px-4 py-2.5 bg-[#F4F7F5] dark:bg-[#0F1A17] border-b border-[#DCE6E0] dark:border-[#233630] flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isTyping ? 'bg-[#D77926]' : 'bg-[#176B55]'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isTyping ? 'bg-[#D77926]' : 'bg-[#176B55]'
              }`}
            />
          </span>
          <span className="font-bold text-[#123B32] dark:text-white">
            {isTyping ? 'Consultando al Asistente VetIA...' : 'Conectado con Asistente VetIA'}
          </span>
          <span className="text-[11px] text-[#66756F] dark:text-[#A3B8B0] hidden sm:inline">• Paciente: {petType}</span>
        </div>

        {isTyping && (
          <button
            type="button"
            onClick={handleCancelQuery}
            className="text-[11px] font-bold text-[#C83D4D] bg-[#FDECEE] hover:bg-[#F9D7DC] border border-[#C83D4D]/30 px-2.5 py-1 rounded-lg flex items-center space-x-1 cursor-pointer transition shadow-xs"
            title="Cancelar consulta en curso si no deseas esperar"
          >
            <X className="w-3 h-3 text-[#C83D4D]" />
            <span>Cancelar consulta</span>
          </button>
        )}
      </div>

      {/* Messages container */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-white dark:bg-[#162420]">
        {messages.map((msg, index) => {
          const isAi =
            msg.role === 'assistant' ||
            msg.role === 'model' ||
            msg.sender === 'assistant' ||
            msg.sender === 'model';
          return (
            <div
              key={index}
              className={`flex items-start space-x-2.5 ${
                isAi ? 'justify-start' : 'justify-end'
              }`}
            >
              {isAi && (
                <div className="w-8 h-8 rounded-xl bg-[#176B55] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  isAi
                    ? 'bg-[#F4F7F5] dark:bg-[#0F1A17] border border-[#DCE6E0] dark:border-[#233630] text-[#1F2D29] dark:text-slate-200 shadow-xs'
                    : 'bg-[#176B55] text-white shadow-xs'
                }`}
              >
                {msg.content}
              </div>

              {!isAi && (
                <div className="w-8 h-8 rounded-xl bg-[#F4F7F5] dark:bg-[#1F2D29] text-[#123B32] dark:text-white flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#DCE6E0] dark:border-[#233630]">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-2.5 justify-start">
            <div className="w-8 h-8 rounded-xl bg-[#176B55] text-white flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#F4F7F5] dark:bg-[#0F1A17] text-[#66756F] dark:text-[#A3B8B0] rounded-2xl px-4 py-3 text-xs border border-[#DCE6E0] dark:border-[#233630] flex items-center space-x-2 shadow-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#176B55]" />
              <span>El Asistente Clínico de VetIA está analizando el caso...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-[#FDECEE] border border-[#C83D4D]/40 text-xs text-[#C83D4D] flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#C83D4D] flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2.5 px-4 bg-[#F4F7F5] dark:bg-[#0F1A17] border-t border-[#DCE6E0] dark:border-[#233630] overflow-x-auto flex space-x-2 no-scrollbar">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={loading}
            onClick={() => handleSendMessage(prompt)}
            className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full bg-white dark:bg-[#162420] hover:bg-[#EAF3F0] hover:text-[#176B55] text-[#1F2D29] dark:text-slate-200 transition border border-[#DCE6E0] dark:border-[#233630] font-medium cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input controls */}
      <div className="p-3 sm:p-4 bg-[#F4F7F5] dark:bg-[#0F1A17] border-t border-[#DCE6E0] dark:border-[#233630] flex items-center space-x-2">
        <textarea
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Escribe tu consulta adicional sobre primeros auxilios o síntomas..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-[#DCE6E0] dark:border-[#233630] bg-white dark:bg-[#162420] text-[#1F2D29] dark:text-white placeholder:text-[#66756F] text-xs sm:text-sm focus:ring-2 focus:ring-[#176B55] focus:border-[#176B55] outline-none resize-none"
        />

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={loading || !inputText.trim()}
          className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-[#176B55] hover:bg-[#135846] text-white font-bold text-xs sm:text-sm shadow-xs transition disabled:opacity-40 flex items-center space-x-1.5 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </div>
    </div>
  );
}

export default TriageChat;