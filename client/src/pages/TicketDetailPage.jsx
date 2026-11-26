import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Edit3, Send, Clock } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/Badges';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [commentBody, setCommentBody] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: 'technical',
    priority: 'medium',
  });

  const [adminStatus, setAdminStatus] = useState('');
  const [adminPriority, setAdminPriority] = useState('');
  const [adminUpdating, setAdminUpdating] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const { data } = await api.get(`/tickets/${id}`);
      const t = data.data.ticket;
      setTicket(t);
      setComments(data.data.comments);
      setActivityLogs(data.data.activityLogs);
      setEditForm({
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
      });
      setAdminStatus(t.status);
      setAdminPriority(t.priority);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setCommentSubmitting(true);
    try {
      await api.post(`/tickets/${id}/comments`, { body: commentBody });
      setCommentBody('');
      await fetchDetail();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/tickets/${id}`, editForm);
      setEditing(false);
      await fetchDetail();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update ticket');
    }
  };

  const handleDeleteTicket = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await api.delete(`/tickets/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const handleAdminUpdate = async () => {
    setAdminUpdating(true);
    try {
      await api.patch(`/admin/tickets/${id}`, {
        status: adminStatus,
        priority: adminPriority,
      });
      await fetchDetail();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update ticket');
    } finally {
      setAdminUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4F46E5] border-t-transparent" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-8 text-center">
        <p className="text-sm font-medium text-[#0F172A]">{error || 'Ticket not found'}</p>
        <Link to="/dashboard" className="mt-3 inline-block text-xs font-medium text-[#4F46E5] hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isOwner = String(ticket.createdBy?._id || ticket.createdBy) === String(user?._id);
  const canEdit = isAdmin || (isOwner && !['resolved', 'closed'].includes(ticket.status));
  const canDelete = isAdmin || (isOwner && ticket.status === 'open');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={isAdmin ? '/admin' : '/dashboard'}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {isAdmin ? 'Admin Queue' : 'Tickets'}
        </Link>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => setEditing((v) => !v)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-3 text-xs font-medium text-[#334155] hover:bg-[#F8FAFC]"
            >
              <Edit3 className="h-3.5 w-3.5" />
              {editing ? 'Cancel Edit' : 'Edit'}
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDeleteTicket}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 text-xs font-medium text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Column: Ticket & Comments */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-medium text-[#64748B]">
                {ticket.ticketNumber}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <CategoryBadge category={ticket.category} />
            </div>

            {editing ? (
              <form onSubmit={handleUpdateTicket} className="mt-4 space-y-3">
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="h-9 w-full rounded-md border border-[#E2E8F0] px-3 text-sm font-medium focus:border-[#4F46E5] focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="h-8 rounded-md border border-[#E2E8F0] px-2.5 text-xs"
                  >
                    <option value="technical">Technical</option>
                    <option value="bug">Bug</option>
                    <option value="billing">Billing</option>
                    <option value="account">Account</option>
                    <option value="feature_request">Feature</option>
                    <option value="other">Other</option>
                  </select>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="h-8 rounded-md border border-[#E2E8F0] px-2.5 text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <textarea
                  rows={4}
                  required
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full rounded-md border border-[#E2E8F0] p-3 text-sm focus:border-[#4F46E5] focus:outline-none"
                />
                <button
                  type="submit"
                  className="h-8 rounded-md bg-[#4F46E5] px-4 text-xs font-medium text-white hover:bg-[#4338CA]"
                >
                  Save Changes
                </button>
              </form>
            ) : (
              <>
                <h1 className="mt-3 text-lg font-semibold tracking-tight text-[#0F172A]">
                  {ticket.title}
                </h1>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#334155]">
                  {ticket.description}
                </p>
              </>
            )}

            <div className="mt-5 flex flex-wrap gap-4 border-t border-[#E2E8F0] pt-4 text-xs text-[#64748B]">
              <span>
                Submitted by <strong className="text-[#0F172A]">{ticket.createdBy?.name}</strong>
              </span>
              <span>Created {new Date(ticket.createdAt).toLocaleString()}</span>
              {ticket.resolvedAt && (
                <span className="text-[#047857]">
                  Resolved {new Date(ticket.resolvedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-6">
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Conversation ({comments.length})
            </h2>

            <div className="mt-4 space-y-4">
              {comments.length === 0 ? (
                <p className="text-xs text-[#64748B]">No comments yet. Start the conversation below.</p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c._id}
                    className={`rounded-md border p-3.5 ${
                      c.author?.role === 'admin'
                        ? 'border-[#C7D2FE] bg-[#EEF2FF]/40'
                        : 'border-[#E2E8F0] bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#0F172A]">{c.author?.name}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            c.author?.role === 'admin'
                              ? 'bg-[#4F46E5] text-white'
                              : 'bg-[#E2E8F0] text-[#475569]'
                          }`}
                        >
                          {c.author?.role}
                        </span>
                      </div>
                      <span className="text-[#94A3B8]">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[#334155]">{c.body}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="mt-5 border-t border-[#E2E8F0] pt-4">
              <textarea
                rows={3}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a reply..."
                className="w-full rounded-md border border-[#E2E8F0] bg-white p-3 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
              />
              <div className="mt-2.5 flex justify-end">
                <button
                  type="submit"
                  disabled={commentSubmitting || !commentBody.trim()}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#4F46E5] px-3.5 text-xs font-medium text-white hover:bg-[#4338CA] disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {commentSubmitting ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Sidebar: Admin Controls & Activity Log */}
        <div className="space-y-6">
          {isAdmin && (
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Admin Controls
              </h2>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#334155]">Status</label>
                  <select
                    value={adminStatus}
                    onChange={(e) => setAdminStatus(e.target.value)}
                    className="h-8 w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#334155]">Priority</label>
                  <select
                    value={adminPriority}
                    onChange={(e) => setAdminPriority(e.target.value)}
                    className="h-8 w-full rounded-md border border-[#E2E8F0] bg-white px-2.5 text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <button
                  onClick={handleAdminUpdate}
                  disabled={adminUpdating}
                  className="h-8 w-full rounded-md bg-[#4F46E5] text-xs font-medium text-white hover:bg-[#4338CA] disabled:opacity-60"
                >
                  {adminUpdating ? 'Updating...' : 'Apply Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Event-Driven Activity Log */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-5">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#64748B]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Activity Timeline
              </h2>
            </div>

            <div className="mt-4 space-y-3.5">
              {activityLogs.length === 0 ? (
                <p className="text-xs text-[#94A3B8]">No activity recorded yet.</p>
              ) : (
                activityLogs.map((log) => (
                  <div key={log._id} className="relative border-l border-[#E2E8F0] pl-3.5">
                    <span className="absolute -left-[3.5px] top-1.5 h-1.5 w-1.5 rounded-full bg-[#4F46E5]" />
                    <p className="text-xs font-medium text-[#0F172A]">{log.description}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-[#94A3B8]">
                      {log.event} · {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
