import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { AdminSession, Battalion, BATTALION_ANOS } from '../types';

interface LoginViewProps {
  onLoginSuccess: (admin: AdminSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [battalion, setBattalion] = useState<Battalion>('2 Raj');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          battalion,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials.');
      } else {
        onLoginSuccess(data.admin as AdminSession);
      }
    } catch {
      setError('Unable to reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6f2] px-4 py-10">
      <div className="w-full max-w-[440px]">
        <div className="rounded-lg border border-[#dce1d5] bg-white p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-[#4b5320] text-white">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-[#2f3613] text-balance">
              NCC Cadet Management Portal
            </h1>
            <p className="mt-1 text-xs text-[#5c6352]">
              Associate NCC Officer (ANO) Sign In
            </p>
          </div>

          <div className="mb-5">
            <div className="block text-xs font-semibold text-[#1f2419] mb-2">
              Select Battalion Login
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {(['2 Raj', '10 Raj'] as Battalion[]).map((bn) => {
                const selected = battalion === bn;
                return (
                  <button
                    key={bn}
                    type="button"
                    onClick={() => {
                      setBattalion(bn);
                      setError('');
                    }}
                    className={`rounded-md border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#4b5320] bg-[#f7f9f3] text-[#2f3613] ring-1 ring-[#4b5320]'
                        : 'border-[#dce1d5] bg-white text-[#5c6352] hover:bg-[#fafbf8]'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#2f3613]">{bn} Bn NCC</div>
                    <div className="mt-0.5 text-[11px] text-[#5c6352] leading-tight">
                      {BATTALION_ANOS[bn]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username" className="block text-xs font-semibold text-[#1f2419] mb-1.5">
                {battalion} ANO Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={`Enter ${battalion} ANO username`}
                className="w-full rounded-md border border-[#cbd2c2] bg-white px-3 py-2 text-sm text-[#1f2419] focus:border-[#4b5320] focus:outline-none focus:ring-2 focus:ring-[#4b5320]/15"
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-[#1f2419] mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-md border border-[#cbd2c2] bg-white px-3 py-2 text-sm text-[#1f2419] focus:border-[#4b5320] focus:outline-none focus:ring-2 focus:ring-[#4b5320]/15"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#4b5320] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3d4619] transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {loading ? 'Signing in...' : `Sign In to ${battalion} Portal`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
