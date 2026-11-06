import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase, { SUPABASE_URL } from '../services/supabaseClient';

const AuthContext = createContext({});

/**
 * Authentication Provider
 * Manages Supabase Auth lifecycle strictly using Supabase services
 * for user registration, login, and active session synchronization.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial active session retrieval from Supabase
    supabase.auth
      .getSession()
      .then(({ data: { session: sbSession } }) => {
        if (sbSession?.user) {
          setSession(sbSession);
          setUser(sbSession.user);
        } else {
          setSession(null);
          setUser(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(`[AuthProvider] Error al recuperar sesión de Supabase (${SUPABASE_URL}):`, err);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    // 2. Real-time auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Sign In with email and password strictly via Supabase Auth
   */
  const signIn = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const endpointUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        console.error(`[AuthContext.signIn] Error devuelto por Supabase (${endpointUrl}):`, error);

        let userMsg = error.message;
        if (error.message.includes('Invalid login credentials')) {
          userMsg = 'Credenciales incorrectas. Verifica tu correo y contraseña o regístrate en la pestaña "Crear Cuenta".';
        } else if (error.message.includes('Email not confirmed')) {
          userMsg = 'El correo electrónico aún no ha sido confirmado en Supabase.';
        } else if (error.message.toLowerCase().includes('rate limit')) {
          userMsg = 'Límite de solicitudes de inicio de sesión excedido en Supabase. Espera unos minutos antes de reintentar.';
        }

        throw new Error(userMsg);
      }

      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        return data;
      }

      throw new Error('No se pudo establecer la sesión con Supabase.');
    } catch (err) {
      console.error(`[AuthContext.signIn] Excepción al conectar con ${endpointUrl}:`, err);
      throw err;
    }
  };

  /**
   * Sign Up strictly via Supabase Auth with required metadata (full_name, role: 'tutor')
   */
  const signUp = async (email, password, metadata = {}) => {
    const normalizedEmail = email.trim().toLowerCase();
    const fullName = (metadata.full_name || '').trim() || normalizedEmail.split('@')[0];
    const phone = (metadata.phone || '').trim();
    const endpointUrl = `${SUPABASE_URL}/auth/v1/signup`;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
            role: 'tutor',
            ...metadata,
          },
        },
      });

      if (error) {
        console.error(`[AuthContext.signUp] Error devuelto por Supabase (${endpointUrl}):`, error);

        let userMsg = error.message;
        if (error.message.includes('User already registered')) {
          userMsg = 'Este correo electrónico ya está registrado. Por favor cambia a la pestaña "Iniciar Sesión".';
        } else if (error.message.includes('Password should be at least')) {
          userMsg = 'La contraseña debe contener al menos 6 caracteres.';
        } else if (
          error.status === 429 ||
          error.code === 'over_email_send_rate_limit' ||
          error.message.toLowerCase().includes('rate limit')
        ) {
          userMsg = 'Límite de envío de correos excedido en Supabase. Por favor espera unos minutos antes de intentar de nuevo.';
        } else if (error.message.toLowerCase().includes('invalid')) {
          userMsg = 'El formato del correo electrónico ingresado no es válido.';
        }

        throw new Error(userMsg);
      }

      if (!data?.user) {
        throw new Error('No se recibió la confirmación del usuario desde Supabase.');
      }

      const sbUser = data.user;
      const registeredUserId = sbUser.id;

      // Sync tutor profile to public.profiles table
      try {
        await supabase.from('profiles').upsert({
          id: registeredUserId,
          email: normalizedEmail,
          full_name: fullName,
          phone: phone || null,
          role: 'tutor',
          updated_at: new Date().toISOString(),
        });
      } catch (profErr) {
        console.info('[AuthContext.signUp] Aviso de sincronización en profiles:', profErr?.message || profErr);
      }

      // Establish active authenticated state
      setUser(sbUser);
      setSession(data.session || { user: sbUser });

      return { user: sbUser, session: data.session || { user: sbUser } };
    } catch (err) {
      console.error(`[AuthContext.signUp] Excepción al registrar en ${endpointUrl}:`, err);
      throw err;
    }
  };

  /**
   * Sign Out from Supabase Auth
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[AuthContext.signOut] Error al cerrar sesión:', err);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  const userProfile = {
    id: user?.id,
    email: user?.email,
    full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Tutor',
    phone: user?.user_metadata?.phone || null,
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        phone: user?.user_metadata?.phone || null,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
