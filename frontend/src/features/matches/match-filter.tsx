import { useState } from 'react';

export const MatchFilter = () => {
  const [status, setStatus] = useState('all');
  return (
    <div className="flex gap-2">
      {['all', 'scheduled', 'live', 'finished'].map((s) => (
        <button key={s} onClick={() => setStatus(s)}>{s}</button>
      ))}
    </div>
  );
};
