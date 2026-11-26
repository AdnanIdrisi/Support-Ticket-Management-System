import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  ShieldCheck,
  Bell,
  LogOut,
  Menu,
  X,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data.notifications);
      setUnreadCount(data.data.unreadCount);
    } catch {
      // ignore transient errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (notif) => {
    if (!notif.isRead) {
      await api.patch(`/notifications/${notif._id}/read`);
      fetchNotifications();
    }
    setNotifOpen(false);
    if (notif.ticket?._id) {
      navigate(`/tickets/${notif.ticket._id}`);
    }
  };

  const handleMarkAllRead = async () => {
    await api.patch('/notifications/read-all');
    fetchNotifications();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
      isActive
        ? 'bg-[#EEF2FF] text-[#4338CA]'
        : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
    }`;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/25 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-[#E2E8F0] bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-[#E2E8F0] px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#4F46E5] text-xs font-bold text-white">
              H
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#0F172A]">
              Helpdesk
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 text-[#64748B] hover:bg-[#F1F5F9] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            Workspace
          </p>
          <NavLink to="/dashboard" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>
          <NavLink to="/tickets/new" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <PlusCircle className="h-4 w-4" />
            New Ticket
          </NavLink>

          {isAdmin && (
            <>
              <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Administration
              </p>
              <NavLink to="/admin" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
                <ShieldCheck className="h-4 w-4" />
                Admin Queue
              </NavLink>
            </>
          )}
        </nav>

        <div className="border-t border-[#E2E8F0] p-3">
          <div className="flex items-center justify-between rounded-md bg-[#F8FAFC] px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-[#0F172A]">{user?.name}</p>
              <p className="truncate text-[11px] text-[#64748B] capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="rounded p-1.5 text-[#64748B] transition-colors hover:bg-[#E2E8F0]/60 hover:text-[#0F172A]"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E2E8F0] bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-1.5 text-[#475569] hover:bg-[#F1F5F9] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 text-xs text-[#64748B] sm:flex">
              <Ticket className="h-3.5 w-3.5 text-[#4F46E5]" />
              <span>Support Ticket Management System</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/tickets/new"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#4F46E5] px-3 text-xs font-medium text-white transition-colors hover:bg-[#4338CA]"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>New Ticket</span>
            </Link>

            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((prev) => !prev)}
                className="relative flex h-8 w-8 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#475569] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#4F46E5] px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-lg border border-[#CBD5E1] bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] px-3.5 py-2.5">
                    <span className="text-xs font-semibold text-[#0F172A]">
                      Notifications ({unreadCount})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4F46E5] hover:underline"
                      >
                        <CheckCheck className="h-3 w-3" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E2E8F0]">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-[#64748B]">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n._id}
                          onClick={() => handleMarkRead(n)}
                          className={`flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left transition-colors hover:bg-[#F8FAFC] ${
                            !n.isRead ? 'bg-[#EEF2FF]/40' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-[#0F172A]">
                              {n.message}
                            </span>
                            {!n.isRead && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4F46E5]" />
                            )}
                          </div>
                          <span className="text-[11px] text-[#94A3B8]">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
