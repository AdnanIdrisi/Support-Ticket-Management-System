import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, RotateCcw, Users } from 'lucide-react';
import api from '../api/client';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/Badges';

export default function AdminDashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    totalTickets: 0,
    totalUsers: 0,
    byStatus: { open: 0, in_progress: 0, resolved: 0, closed: 0 },
    recentActivity: [],
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

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
          params.append(key, val);
        }
      });
      params.append('limit', '10');

      const [ticketsRes, statsRes] = await Promise.all([
        api.get(`/admin/tickets?${params.toString()}`),
        api.get('/admin/stats'),
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
    fetchAdminData();
  }, [fetchAdminData]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const kpis = [
    { label: 'Total Tickets', value: stats.totalTickets, accent: 'text-[#0F172A]' },
    { label: 'Open Queue', value: stats.byStatus.open || 0, accent: 'text-[#4338CA]' },
    { label: 'In Progress', value: stats.byStatus.in_progress || 0, accent: 'text-[#B45309]' },
    { label: 'Resolved', value: stats.byStatus.resolved || 0, accent: 'text-[#047857]' },
    { label: 'Customers', value: stats.totalUsers, accent: 'text-[#0F172A]', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[#0F172A]">
          Admin Ticket Queue
        </h1>
        <p className="mt-0.5 text-xs text-[#64748B]">
          Triage, prioritize, and resolve support requests across all users.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <p className="text-xs font-medium text-[#64748B]">{kpi.label}</p>
            <p className={`mt-1.5 text-2xl font-semibold tracking-tight tabular-nums ${kpi.accent}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {/* Ticket Queue */}
        <div className="space-y-4 xl:col-span-3">
          <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-[#E2E8F0] bg-white p-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Search tickets..."
                className="h-8 w-full rounded-md border border-[#E2E8F0] bg-white pl-8 pr-3 text-xs focus:border-[#4F46E5] focus:outline-none"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs"
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
              className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs"
            >
              <option value="">Priority: All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {(filters.search || filters.status || filters.priority) && (
              <button
                onClick={() =>
                  setFilters({
                    search: '',
                    status: '',
                    priority: '',
                    category: '',
                    sortBy: 'createdAt',
                    order: 'desc',
                    page: 1,
                  })
                }
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#4F46E5] border-t-transparent" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#64748B]">
                No tickets match the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                      <th className="px-4 py-2.5">ID</th>
                      <th className="px-4 py-2.5">Title &amp; Requester</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Priority</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {tickets.map((t) => (
                      <tr key={t._id} className="transition-colors hover:bg-[#F8FAFC]">
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[#64748B]">
                          <Link to={`/tickets/${t._id}`} className="hover:text-[#4F46E5] hover:underline">
                            {t.ticketNumber}
                          </Link>
                        </td>
                        <td className="max-w-xs px-4 py-3">
                          <Link
                            to={`/tickets/${t._id}`}
                            className="block truncate text-[13px] font-medium text-[#0F172A] hover:text-[#4F46E5]"
                          >
                            {t.title}
                          </Link>
                          <p className="truncate text-[11px] text-[#64748B]">
                            {t.createdBy?.name} ({t.createdBy?.email})
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <CategoryBadge category={t.category} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <PriorityBadge priority={t.priority} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-[#64748B] tabular-nums">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#E2E8F0] px-4 py-2.5 text-xs text-[#64748B]">
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                    className="inline-flex h-7 items-center gap-1 rounded border border-[#E2E8F0] px-2.5 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                    className="inline-flex h-7 items-center gap-1 rounded border border-[#E2E8F0] px-2.5 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Event Activity */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Recent System Events
          </h2>
          <div className="mt-4 space-y-3.5">
            {stats.recentActivity?.length === 0 ? (
              <p className="text-xs text-[#94A3B8]">No recent activity.</p>
            ) : (
              stats.recentActivity?.map((log) => (
                <div key={log._id} className="border-l border-[#E2E8F0] pl-3">
                  <p className="text-xs font-medium text-[#0F172A]">{log.description}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-[#94A3B8]">
                    {log.event} · {new Date(log.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
