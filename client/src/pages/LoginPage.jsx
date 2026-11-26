import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-sm rounded-lg border border-[#E2E8F0] bg-white p-6">
        <div className="mb-6">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-[#4F46E5] text-sm font-bold text-white">
            H
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-[#0F172A]">
            Sign in to Helpdesk
          </h1>
          <p className="mt-1 text-xs text-[#64748B]">
            Enter your credentials to access your support workspace.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#334155]">
              Email address
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#334155]">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="h-9 w-full rounded-md bg-[#4F46E5] text-sm font-medium text-white transition-colors hover:bg-[#4338CA] disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-[#64748B]">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-[#4F46E5] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
