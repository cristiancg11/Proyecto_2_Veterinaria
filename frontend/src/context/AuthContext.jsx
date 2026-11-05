import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase, { SUPABASE_URL } from '../services/supabaseClient';

const AuthContext = createContext({});

const ACTIVE_USER_STORAGE_KEY = 'vetia_active_user';

/**
 * Authentication Provider
 * Manages Supabase Auth lifecycle with real-time session persistence,
 * strict error propagation for validation, and dedicated local test modes.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Recover active session from Supabase
    supabase.auth
      .getSession()
      .then(({ data: { session: sbSession } }) => {
        if (sbSession?.user) {
          setSession(sbSession);
          setUser(sbSession.user);
          localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
        } else {
          // Check if a local demo/test session exists
          const savedActiveUser = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
          if (savedActiveUser) {
            try {
              const parsedUser = JSON.parse(savedActiveUser);
              setUser(parsedUser);
              setSession({ user: parsedUser });
            } catch (err) {
              localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
            }
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn(`[AuthProvider] Supabase getSession error (${SUPABASE_URL}):`, err);
        const savedActiveUser = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
        if (savedActiveUser) {
          try {
            const parsedUser = JSON.parse(savedActiveUser);
            setUser(parsedUser);
            setSession({ user: parsedUser });
          } catch (_) {}
        }
        setLoading(false);
      });

    // 2. Listen to Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
        setUser(null);
        setSession(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Helper to activate session state
   */
  const activateLocalSession = (userData) => {
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
    setSession({ user: userData });
    return { user: userData, session: { user: userData } };
  };

  /**
   * Sign In with email and password via Supabase Auth
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
        console.error(`[AuthContext.signIn] Error en Supabase Auth (${endpointUrl}):`, error);

        let userMsg = error.message;
        if (error.message.includes('Invalid login credentials')) {
          userMsg = 'Credenciales incorrectas. Verifica tu correo y contraseña o regístrate en "Crear Cuenta".';
        } else if (error.message.includes('Email not confirmed')) {
          userMsg = 'El correo electrónico aún no ha sido confirmado en Supabase.';
        } else if (error.message.toLowerCase().includes('rate limit')) {
          userMsg = 'Límite de intentos excedido en Supabase. Espera unos momentos o usa las sesiones de prueba.';
        }

        throw new Error(userMsg);
      }

      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
        return data;
      }

      throw new Error('No se pudo establecer la sesión con el servidor.');
    } catch (err) {
      console.error(`[AuthContext.signIn] Excepción al conectar con ${endpointUrl}:`, err);
      throw err;
    }
  };

  /**
   * Sign Up with mandatory user metadata (full_name, role: 'tutor')
   */
  const signUp = async (email, password, metadata = {}) => {
    const normalizedEmail = email.trim().toLowerCase();
    const fullName = (metadata.full_name || '').trim() || normalizedEmail.split('@')[0];
    const endpointUrl = `${SUPABASE_URL}/auth/v1/signup`;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'tutor',
          },
        },
      });

      // Strict error handling: Do not fake login on error, propagate to UI
      if (error) {
        console.error(`[AuthContext.signUp] Error devuelto por Supabase Auth (${endpointUrl}):`, error);

        let userMsg = error.message;
        if (error.message.includes('User already registered')) {
          userMsg = 'Este correo electrónico ya está registrado. Por favor inicia sesión.';
        } else if (error.message.includes('Password should be at least')) {
          userMsg = 'La contraseña debe contener al menos 6 caracteres.';
        } else if (
          error.status === 429 ||
          error.code === 'over_email_send_rate_limit' ||
          error.message.toLowerCase().includes('rate limit')
        ) {
          userMsg = 'Límite de envío de correos excedido en Supabase. Por favor intenta más tarde o utiliza los botones de prueba local.';
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

      // Optional profile sync to public.profiles table
      try {
        await supabase.from('profiles').upsert({
          id: registeredUserId,
          email: normalizedEmail,
          full_name: fullName,
          role: 'tutor',
          updated_at: new Date().toISOString(),
        });
      } catch (profErr) {
        console.info('[AuthContext.signUp] Aviso de sincronización en profiles:', profErr?.message || profErr);
      }

      // If Supabase created the user, immediately activate session in Dashboard
      setUser(sbUser);
      if (data.session) {
        setSession(data.session);
        localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      } else {
        // User created in auth.users without automatic email confirmation session
        setSession({ user: sbUser });
        activateLocalSession(sbUser);
      }

      return { user: sbUser, session: data.session || { user: sbUser } };
    } catch (err) {
      console.error(`[AuthContext.signUp] Excepción al registrar en ${endpointUrl}:`, err);
      throw err;
    }
  };

  /**
   * Dedicated Demo Session (Explicitly marked as local test without Supabase persistence)
   */
  const loginAsDemo = () => {
    const demoUser = {
      id: 'usr_demo_veterinarian_2026',
      email: 'doctor.urgencias@vetia.ai',
      user_metadata: {
        full_name: 'Dr. Veterinario de Turno (Demo)',
        role: 'veterinarian',
        is_demo: true,
      },
      role: 'authenticated',
      app_metadata: { provider: 'local_demo', is_local_test: true },
      created_at: new Date().toISOString(),
    };
    return activateLocalSession(demoUser);
  };

  /**
   * Dedicated Guest Session (Explicitly marked as local test without Supabase persistence)
   */
  const loginAsGuest = () => {
    const guestUser = {
      id: 'usr_tutor_guest_' + Math.random().toString(36).substring(2, 8),
      email: 'tutor.invitado@vetia.ai',
      user_metadata: {
        full_name: 'Tutor Invitado (Demo)',
        role: 'tutor',
        is_demo: true,
      },
      role: 'authenticated',
      app_metadata: { provider: 'local_guest', is_local_test: true },
      created_at: new Date().toISOString(),
    };
    return activateLocalSession(guestUser);
  };

  /**
   * Sign out and clear all sessions
   */
  const signOut = async () => {
    try {
      if (supabase?.auth) {
        await supabase.auth.signOut().catch(() => {});
      }
    } finally {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        loginAsDemo,
        loginAsGuest,
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
