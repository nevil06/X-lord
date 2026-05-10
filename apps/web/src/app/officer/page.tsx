"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, FileSignature, CheckCircle, Clock, Loader2, AlertTriangle, X } from 'lucide-react';

const API_BASE = '/api/backend';

interface Mutation {
  id: string;
  mutationType: string;
  status: string;
  createdAt: string;
  parcel?: { landUid: string; surveyNumber: string };
  initiator?: { fullName: string };
}

interface Checkpoint {
  id: string;
  blockNumber: number;
  eventType: string;
  eventHash: string;
  signer: string;
  timestamp: string;
}

export default function OfficerWorkstation() {
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mutRes, bcRes] = await Promise.all([
        fetch(`${API_BASE}/mutations`),
        fetch(`${API_BASE}/fraud/blockchain`)
      ]);
      const mutData = await mutRes.json();
      const bcData = await bcRes.json();
      setMutations(mutData.mutations || []);
      setCheckpoints(bcData.checkpoints || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/mutations/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerId: 'SR-BLR-092' })
      });
      if (res.ok) {
        setToast({ message: 'Mutation approved & committed to blockchain', type: 'success' });
        fetchData();
      }
    } catch {
      setToast({ message: 'Failed to approve mutation', type: 'error' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE}/mutations/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Document verification required' })
      });
      if (res.ok) {
        setToast({ message: 'Mutation rejected', type: 'success' });
        fetchData();
      }
    } catch {
      setToast({ message: 'Failed to reject mutation', type: 'error' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const pendingCount = mutations.filter(m => m.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-primary-navy p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg border shadow-xl flex items-center gap-3 ${
          toast.type === 'success' 
            ? 'bg-verified-green/20 border-verified-green text-verified-green' 
            : 'bg-frozen-red/20 border-frozen-red text-frozen-red'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      <header className="mb-8 flex justify-between items-end border-b border-border-color pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-text-primary">Sub-Registrar Workstation</h1>
          <p className="text-text-secondary mt-1">Pending Mutations & Document Verification</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface-mid px-4 py-2 rounded border border-border-color">
            <span className="text-sm font-bold text-accent-blue">Officer ID: SR-BLR-092</span>
          </div>
          <a href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">← Back</a>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-surface-dark rounded-lg border border-border-color shadow overflow-hidden">
            <div className="p-4 border-b border-border-color bg-surface-mid flex justify-between items-center">
              <h2 className="font-serif font-bold text-lg">Mutation Queue</h2>
              {pendingCount > 0 && (
                <span className="bg-pending-amber text-white text-xs px-2 py-1 rounded font-bold">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 size={24} className="animate-spin text-accent-blue" />
              </div>
            ) : mutations.length === 0 ? (
              <div className="p-8 text-center text-text-secondary">No mutations in queue.</div>
            ) : (
              <div className="divide-y divide-border-color">
                {mutations.map(m => (
                  <div key={m.id} className="p-4 flex items-center justify-between hover:bg-surface-mid transition-colors">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-accent-blue font-bold text-sm">
                          {m.parcel?.landUid || m.id.slice(0, 12)}
                        </span>
                        <span className="text-xs bg-surface-light px-2 py-0.5 rounded">{m.mutationType}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          m.status === 'PENDING' ? 'bg-pending-amber/20 text-pending-amber' :
                          m.status === 'APPROVED' ? 'bg-verified-green/20 text-verified-green' :
                          m.status === 'REJECTED' ? 'bg-frozen-red/20 text-frozen-red' :
                          'bg-surface-light text-text-secondary'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                      <div className="text-sm text-text-secondary">
                        {m.initiator?.fullName && `By: ${m.initiator.fullName} · `}
                        Survey: {m.parcel?.surveyNumber || '—'}
                      </div>
                    </div>
                    {m.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApprove(m.id)}
                          disabled={actionLoading === m.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-verified-green/10 text-verified-green hover:bg-verified-green/20 rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {actionLoading === m.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(m.id)}
                          disabled={actionLoading === m.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-frozen-red/10 text-frozen-red hover:bg-frozen-red/20 rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-surface-dark p-6 rounded-lg border border-border-color shadow">
            <h3 className="font-serif font-bold mb-4">AI Verification Engine</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full border-4 border-verified-green flex items-center justify-center font-bold text-verified-green">
                98%
              </div>
              <div>
                <div className="text-sm font-bold">OCR Confidence</div>
                <div className="text-xs text-text-secondary">System Average</div>
              </div>
            </div>
            <button className="w-full py-2 bg-surface-mid hover:bg-surface-light border border-border-color rounded text-sm font-medium transition-colors">
              Run Batch Analysis
            </button>
          </div>

          <div className="bg-surface-dark p-6 rounded-lg border border-border-color shadow">
            <h3 className="font-serif font-bold mb-4 flex items-center gap-2">
              <Clock size={16} /> Recent Blockchain Commits
            </h3>
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-text-secondary" /></div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {checkpoints.slice(0, 10).map(cp => (
                  <div key={cp.id} className="text-xs p-2 bg-surface-mid rounded border border-border-color font-mono">
                    <div className="flex justify-between mb-1">
                      <span className="text-accent-blue font-bold">Block #{cp.blockNumber}</span>
                      <span className="text-text-secondary">{cp.eventType}</span>
                    </div>
                    <div className="text-text-secondary truncate">Hash: {cp.eventHash.slice(0, 24)}...</div>
                    <div className="text-text-secondary">Signer: {cp.signer}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
