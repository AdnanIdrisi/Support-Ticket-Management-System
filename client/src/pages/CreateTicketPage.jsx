import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api/client';

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    category: 'technical',
    priority: 'medium',
    description: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/tickets', form);
      navigate(`/tickets/${data.data.ticket._id}`);
    } catch (err) {
      const details = err.response?.data?.details;
      if (Array.isArray(details) && details.length > 0) {
        setError(details.map((d) => d.message).join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to create ticket');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Workspace
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-[#0F172A]">
          Create Support Ticket
        </h1>
        <p className="mt-0.5 text-xs text-[#64748B]">
          Describe your issue clearly so our support team can resolve it quickly.
        </p>
      </div>

      <div className="rounded-lg border border-[#E2E8F0] bg-white p-6">
        {error && (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#334155]">
              Title
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={150}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Brief summary of the issue"
              className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#334155]">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              >
                <option value="technical">Technical</option>
                <option value="bug">Bug Report</option>
                <option value="billing">Billing</option>
                <option value="account">Account</option>
                <option value="feature_request">Feature Request</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#334155]">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#334155]">
              Description
            </label>
            <textarea
              rows={5}
              required
              minLength={10}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide steps to reproduce, expected behavior, or relevant details..."
              className="w-full rounded-md border border-[#E2E8F0] bg-white p-3 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Link
              to="/dashboard"
              className="inline-flex h-9 items-center rounded-md border border-[#E2E8F0] bg-white px-4 text-xs font-medium text-[#334155] hover:bg-[#F8FAFC]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-9 items-center rounded-md bg-[#4F46E5] px-4 text-xs font-medium text-white hover:bg-[#4338CA] disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
