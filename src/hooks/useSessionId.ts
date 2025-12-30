import { useState, useEffect } from 'react';

export function useSessionId() {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    let id = localStorage.getItem('user_session_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('user_session_id', id);
    }
    setSessionId(id);
  }, []);

  return sessionId;
}
