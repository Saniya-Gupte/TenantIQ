import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useRequireAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const { getSupabaseClient } = await import('./supabase');
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session) {
          router.replace('/signin');
        } else {
          setReady(true);
        }
      } catch {
        // Supabase not configured — demo mode, allow through
        if (!cancelled) setReady(true);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [router]);

  return ready;
}

export async function signOut(router: ReturnType<typeof useRouter>) {
  try {
    const { getSupabaseClient } = await import('./supabase');
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  } catch { /* demo mode */ }
  router.push('/signin');
}
