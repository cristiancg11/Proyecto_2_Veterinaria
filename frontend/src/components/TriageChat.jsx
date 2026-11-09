import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, Loader2, MessageSquare, AlertCircle, X, Wifi } from 'lucide-react';
import { sendChatMessage } from '../services/api';
import { supabase } from '../services/supabaseClient';

const QUICK_PROMPTS = [
  '¿Puedo ofrecerle agua o alimento ahora mismo?',
  '¿Cómo debo acomodarlo para transportarlo al veterinario?',
  '¿Qué medicamentos están estrictamente prohibidos?',
  '¿Cuáles signos indicarían que su estado se está agravando?',
];

export function TriageChat({ triageId, petType = 'Mascota', triageContext = null }) {
  const activeTriageId = triageId || triageContext?.record_id || triageContext?.id || 'active-case';

  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: `Hola, soy el asistente clínico veterinario de VetIA. He revisado el reporte de triaje de tu ${petType}. ¿Tienes alguna duda sobre los primeros auxilios inmediatos o cómo transportarlo al centro veterinario?`,
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
      // Build clinical context payload
      const contextPayload = triageContext || {
        record_id: activeTriageId,
        id: activeTriageId,
        pet_type: petType,
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
    <div className="backdrop-blur-md bg-slate-900/70 rounded-2xl shadow-xl shadow-emerald-950/20 border border-slate-700/50 overflow-hidden flex flex-col h-full min-h-[460px] max-h-[600px]">
      {/* Real-time Connection Status Pill & Cancellation Header */}
      <div className="px-4 py-2.5 bg-slate-950/50 border-b border-slate-700/50 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isTyping ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isTyping ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </span>
          <span className="font-bold text-slate-100">
            {isTyping ? 'Consultando al Asistente VetIA...' : 'Conectado con Asistente VetIA'}
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">• Paciente: {petType}</span>
        </div>

        {isTyping && (
          <button
            type="button"
            onClick={handleCancelQuery}
            className="text-[11px] font-bold text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 rounded-lg flex items-center space-x-1 cursor-pointer transition shadow-lg shadow-rose-950/20"
            title="Cancelar consulta en curso si no deseas esperar"
          >
            <X className="w-3 h-3 text-rose-400" />
            <span>Cancelar consulta</span>
          </button>
        )}
      </div>

      {/* Messages container */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-950/30">
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-emerald-600/20">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-lg ${
                  isAi
                    ? 'bg-slate-900/80 text-slate-100 border border-slate-700/50'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-medium'
                }`}
              >
                {msg.content}
              </div>

              {!isAi && (
                <div className="w-8 h-8 rounded-full bg-white/[0.06] text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/10">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-2.5 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse shadow-lg shadow-emerald-600/20">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900/80 text-slate-300 rounded-2xl px-4 py-3 text-xs border border-slate-700/50 flex items-center space-x-2 shadow-lg">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>El Asistente VetIA está razonando sobre el caso clínico...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-100 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2.5 px-4 bg-slate-950/40 border-t border-slate-700/50 overflow-x-auto flex space-x-2 no-scrollbar">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={loading}
            onClick={() => handleSendMessage(prompt)}
            className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-900/70 hover:bg-emerald-500/15 hover:text-emerald-200 text-slate-300 transition border border-slate-700/60 font-medium cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input controls */}
      <div className="p-3 sm:p-4 bg-slate-950/40 border-t border-slate-700/50 flex items-center space-x-2">
        <textarea
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Escribe tu consulta adicional sobre primeros auxilios o síntomas..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950/50 text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none resize-none"
        />

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={loading || !inputText.trim()}
          className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition disabled:opacity-40 flex items-center space-x-1.5 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </div>
    </div>
  );
}

export default TriageChat;