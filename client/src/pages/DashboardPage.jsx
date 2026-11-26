import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import api from '../api/client';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/Badges';

export default function DashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    totalTickets: 0,
    byStatus: { open: 0, in_progress: 0, resolved: 0, closed: 0 },
  });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    category: '',
    sortBy: 'createdAt',
    order: 'desc',
    page: 1,
  });

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
          params.append(key, val);
        }
      });
      params.append('limit', '8');

      const [ticketsRes, statsRes] = await Promise.all([
        api.get(`/tickets?${params.toString()}`),
        api.get('/tickets/stats'),
      ]);

      setTickets(ticketsRes.data.data.tickets);
      setPagination(ticketsRes.data.data.pagination);
      setStats(statsRes.data.data);
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      category: '',
      sortBy: 'createdAt',
      order: 'desc',
      page: 1,
    });
  };

  const kpis = [
    { label: 'Total Tickets', value: stats.totalTickets, accent: 'text-[#0F172A]' },
    { label: 'Open', value: stats.byStatus.open || 0, accent: 'text-[#4338CA]' },
    { label: 'In Progress', value: stats.byStatus.in_progress || 0, accent: 'text-[#B45309]' },
    { label: 'Resolved', value: stats.byStatus.resolved || 0, accent: 'text-[#047857]' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#0F172A]">
            Support Workspace
          </h1>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Track your submitted tickets, status updates, and replies.
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="inline-flex h-9 items-center gap-1.5 self-start rounded-md bg-[#4F46E5] px-3.5 text-xs font-medium text-white transition-colors hover:bg-[#4338CA]"
        >
          <Plus className="h-4 w-4" />
          Create Ticket
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-[#E2E8F0] bg-white p-4"
          >
            <p className="text-xs font-medium text-[#64748B]">{kpi.label}</p>
            <p className={`mt-1.5 text-2xl font-semibold tracking-tight tabular-nums ${kpi.accent}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-[#E2E8F0] bg-white p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search by ID, title, or description..."
            className="h-8 w-full rounded-md border border-[#E2E8F0] bg-white pl-8 pr-3 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#334155] focus:border-[#4F46E5] focus:outline-none"
        >
          <option value="">Status: All</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => updateFilter('priority', e.target.value)}
          className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#334155] focus:border-[#4F46E5] focus:outline-none"
        >
          <option value="">Priority: All</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#334155] focus:border-[#4F46E5] focus:outline-none"
        >
          <option value="">Category: All</option>
          <option value="technical">Technical</option>
          <option value="billing">Billing</option>
          <option value="account">Account</option>
          <option value="bug">Bug</option>
          <option value="feature_request">Feature</option>
          <option value="other">Other</option>
        </select>

        <select
          value={`${filters.sortBy}:${filters.order}`}
          onChange={(e) => {
            const [sortBy, order] = e.target.value.split(':');
            setFilters((prev) => ({ ...prev, sortBy, order, page: 1 }));
          }}
          className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#334155] focus:border-[#4F46E5] focus:outline-none"
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="updatedAt:desc">Recently updated</option>
          <option value="priority:desc">Priority</option>
        </select>

        {(filters.search || filters.status || filters.priority || filters.category) && (
          <button
            onClick={resetFilters}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Ticket Table */}
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#4F46E5] border-t-transparent" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-[#0F172A]">No tickets found</p>
            <p className="mt-1 text-xs text-[#64748B]">
              Try adjusting your filters or create a new support ticket.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Title</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Priority</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-sm">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    className="transition-colors hover:bg-[#F8FAFC]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[#64748B]">
                      <Link
                        to={`/tickets/${ticket._id}`}
                        className="hover:text-[#4F46E5] hover:underline"
                      >
                        {ticket.ticketNumber}
                      </Link>
                    </td>
                    <td className="max-w-md px-4 py-3">
                      <Link
                        to={`/tickets/${ticket._id}`}
                        className="block truncate text-[13px] font-medium text-[#0F172A] hover:text-[#4F46E5]"
                      >
                        {ticket.title}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-[#64748B]">
                        {ticket.description}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <CategoryBadge category={ticket.category} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-[#64748B] tabular-nums">
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#E2E8F0] px-4 py-2.5 text-xs text-[#64748B]">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} tickets)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                className="inline-flex h-7 items-center gap-1 rounded border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#334155] hover:bg-[#F8FAFC] disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                className="inline-flex h-7 items-center gap-1 rounded border border-[#E2E8F0] bg-white px-2.5 text-xs font-medium text-[#334155] hover:bg-[#F8FAFC] disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
