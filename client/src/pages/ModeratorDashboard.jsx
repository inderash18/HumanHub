import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import ModerationQueue from '../components/moderation/ModerationQueue';
import api from '../services/api';

export default function ModeratorDashboard() {
  const { user } = useAuthStore();
  const authorized = ['admin', 'moderator'].includes(user?.role);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!authorized) return;
    api.get('/moderation/stats').then(({ data }) => setStats(data))
      .catch(() => setError('Could not load moderation counts.'));
  }, [authorized]);
  if (!authorized) return <Navigate to="/feed" replace />;
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Moderation</h1>
      <p>Review submitted posts. Automatic detection is currently unavailable.</p>
      {error && <p role="alert">{error}</p>}
      {stats && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(stats).map(([label, count]) => <div key={label} className="p-4 border rounded-xl">
          <p className="capitalize">{label === 'bannedUsers' ? 'Suspended users' : label}</p>
          <strong className="text-2xl">{count}</strong>
        </div>)}
      </div>}
      <ModerationQueue />
    </div>
  );
}
