import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  business_id: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, businessName: string, country: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

async function buildAuthUser(supaUser: SupabaseUser): Promise<AuthUser> {
  const { data: biz } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', supaUser.id)
    .maybeSingle();

  return {
    id: supaUser.id,
    email: supaUser.email ?? '',
    full_name: supaUser.user_metadata?.full_name ?? '',
    business_id: biz?.id ?? null,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // IMPORTANT: keep this callback synchronous to avoid Supabase auth deadlocks.
    // Defer any Supabase calls (like fetching the business) with setTimeout.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const supaUser = session.user;
        // Set a minimal user immediately so the UI can render
        setUser({
          id: supaUser.id,
          email: supaUser.email ?? '',
          full_name: supaUser.user_metadata?.full_name ?? '',
          business_id: null,
        });
        setIsLoading(false);
        // Defer the business lookup to avoid deadlocking the auth callback
        setTimeout(() => {
          buildAuthUser(supaUser)
            .then((authUser) => { if (mounted) setUser(authUser); })
            .catch((err) => console.error('buildAuthUser failed', err));
        }, 0);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const supaUser = session.user;
        setUser({
          id: supaUser.id,
          email: supaUser.email ?? '',
          full_name: supaUser.user_metadata?.full_name ?? '',
          business_id: null,
        });
        setIsLoading(false);
        buildAuthUser(supaUser)
          .then((authUser) => { if (mounted) setUser(authUser); })
          .catch((err) => console.error('buildAuthUser failed', err));
      } else {
        setIsLoading(false);
      }
    }).catch((err) => {
      console.error('getSession failed', err);
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email: string, password: string, businessName: string, country: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: businessName } },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Signup failed');

    await supabase.from('businesses').insert({
      owner_id: data.user.id,
      name: businessName,
      country,
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
