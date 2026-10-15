'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    const user = api.getUser();
    startTransition(() => {
      if (!user) {
        router.replace('/login');
      } else if (user.role === 'cook') {
        router.replace('/cook');
      } else if (user.role === 'order_taker') {
        router.replace('/waiter');
      } else {
        router.replace('/manager');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Cargando Nano Lomos...</p>
      </div>
    </div>
  );
}
