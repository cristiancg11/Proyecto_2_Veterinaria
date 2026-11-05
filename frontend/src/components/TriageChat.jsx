import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { sendChatMessage } from '../services/api';

const QUICK_PROMPTS = [
  '¿Puedo ofrecerle agua o alimento ahora mismo?',
  '¿Cómo debo acomodarlo para transportarlo al veterinario?',
  '¿Qué medicamentos están estrictamente prohibidos?',
  '¿Cuáles signos indicarían que su estado se está agravando?',
];

export function TriageChat({ triageId, petType = 'Mascota', triageContext = null }) {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: `Hola, soy el asistente veterinario de VetIA. He revisado el reporte de triaje de tu ${petType}. ¿Tienes alguna duda sobre los primeros auxilios inmediatos o cómo transportarlo al centro veterinario?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || loading) return;

    setError(null);
    setInputText('');

    const newMessages = [...messages, { role: 'user', content: messageContent }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Build clinical context payload
      const contextPayload = triageContext || {
        record_id: triageId || 'active-case',
        id: triageId || 'active-case',
        pet_type: petType,
      };

      // Call API service with history, user_message, and triage_context
      const response = await sendChatMessage({
        history: newMessages.slice(0, -1),
        user_message: messageContent,
        triage_context: contextPayload,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: response.reply || response.message || 'Respuesta recibida.',
        },
      ]);
    } catch (err) {
      console.error('[TriageChat] Error al comunicarse con el asistente:', err);
      setError(
        err.message || 'No se pudo obtener respuesta del asistente IA. Por favor intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[460px] max-h-[600px]">
      {/* Messages container */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((msg, index) => {
          const isAi = msg.role === 'model';
          return (
            <div
              key={index}
              className={`flex items-start space-x-2.5 ${
                isAi ? 'justify-start' : 'justify-end'
              }`}
            >
              {isAi && (
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  isAi
                    ? 'bg-white text-slate-800 border border-slate-200/80'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 text-white font-medium'
                }`}
              >
                {msg.content}
              </div>

              {!isAi && (
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-2.5 justify-start">
            <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white text-slate-600 rounded-2xl px-4 py-3 text-xs border border-slate-200 flex items-center space-x-2 shadow-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
              <span>El Asistente VetIA está razonando sobre el caso clínico...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2.5 px-4 bg-white border-t border-slate-200/80 overflow-x-auto flex space-x-2 no-scrollbar">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={loading}
            onClick={() => handleSendMessage(prompt)}
            className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 transition border border-slate-200/70 font-medium cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input controls */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center space-x-2">
        <textarea
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Escribe tu consulta adicional sobre primeros auxilios o síntomas..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none resize-none"
        />

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={loading || !inputText.trim()}
          className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition disabled:opacity-40 flex items-center space-x-1.5 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </div>
    </div>
  );
}

export default TriageChat;
