'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import VideoFeed from '@/components/VideoFeed';

export default function Home() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    // Load user data on mount
    loadUser();
  }, [loadUser]);

  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <VideoFeed />
    </main>
  );
}
