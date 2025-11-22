import { invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useRef } from 'react';

const MS_BASE = 1000;
const TIMEOUT_MS = 2 * 60 * MS_BASE; // 2-minute wait until it auto-locks

export function useAutoLock(isLoggedIn: boolean, onLock: () => void) {
  const timerRef = useRef<number | null>(null);

  const doLock = useCallback(async () => {
    if (!isLoggedIn) return;

    console.log('💤 Inatividade detectada. Trancando cofre...');
    try {
      await invoke('lock_vault');
      onLock();
    } catch (e) {
      console.error(`Falha ao trancar cofre: ${e}`);
    }
  }, [isLoggedIn, onLock]);

  const resetTimer = useCallback(() => {
    if (!isLoggedIn) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(doLock, TIMEOUT_MS);
  }, [isLoggedIn, doLock]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const events = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'];

    resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isLoggedIn, resetTimer]);
}
