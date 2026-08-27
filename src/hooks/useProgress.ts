import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'kanji-app:learned';

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function useProgress() {
  const [learned, setLearned] = useState<Set<string>>(() => load());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(learned)));
  }, [learned]);

  const toggleLearned = useCallback((kanji: string) => {
    setLearned((prev) => {
      const next = new Set(prev);
      if (next.has(kanji)) next.delete(kanji);
      else next.add(kanji);
      return next;
    });
  }, []);

  const isLearned = useCallback((kanji: string) => learned.has(kanji), [learned]);

  return { learned, isLearned, toggleLearned };
}
