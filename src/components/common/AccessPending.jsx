import React from "react";

import { useAuth } from "../../hooks/useAuth.js";

const copyByStatus = {
  PENDING: {
    title: "Approval Pending",
    description:
      "Your account has been created and is waiting for admin approval. You will get dashboard access as soon as the review is complete.",
    accent: "text-amber-700",
    panel: "bg-amber-50 border-amber-200",
  },
  BLOCKED: {
    title: "Account Blocked",
    description:
      "This account is temporarily blocked. If this feels unexpected, contact support and share your registered phone number or email so the admin team can quickly trace your order and account history.",
    accent: "text-red-700",
    panel: "bg-red-50 border-red-200",
  },
};

const AccessPending = ({ user }) => {
  const { logout } = useAuth();
  const statusCopy = copyByStatus[user?.status] || copyByStatus.PENDING;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#ffffff_45%,_#e2e8f0)] flex items-center justify-center px-4">
      <div className={`w-full max-w-2xl rounded-[2rem] border p-8 md:p-10 shadow-xl ${statusCopy.panel}`}>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Dodago Partner Access</p>
        <h1 className={`mt-4 text-3xl md:text-4xl font-black ${statusCopy.accent}`}>{statusCopy.title}</h1>
        <p className="mt-4 text-slate-700 leading-7">{statusCopy.description}</p>

        <div className="mt-8 rounded-3xl bg-white/80 border border-white p-5">
          <div className="text-sm text-slate-500">Signed in as</div>
          <div className="mt-2 text-xl font-bold text-slate-900">{user?.name}</div>
          <div className="text-sm text-slate-600">{user?.email}</div>
          <div className="mt-3 inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-wide text-white">
            {user?.role} � {user?.status}
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Refresh Status
          </button>
          <button
            onClick={logout}
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessPending;
