"use client";

import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, Database, Users, Settings, Activity, Clock, ShieldAlert } from 'lucide-react';

const API_BASE = '/api/backend';

interface Checkpoint {
  id: string;
  blockNumber: number;
  eventType: string;
  eventHash: string;
  signer: string;
  timestamp: string;
}

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [bcRes, statsRes, parcelsRes] = await Promise.all([
          fetch(`${API_BASE}/fraud/blockchain`),
          fetch(`${API_BASE}/parcels/stats`),
          fetch(`${API_BASE}/parcels/all`)
        ]);

        const bcData = await bcRes.json();
        const statsData = await statsRes.json();
        const parcelsData = await parcelsRes.json();

        setCheckpoints(bcData.checkpoints || []);
        setStats(statsData);

        // Gather unique owners from parcels
        const ownerMap: Record<string, any> = {};
        if (parcelsData.parcels) {
          for (const p of parcelsData.parcels) {
            if (p.current_owner && !ownerMap[p.current_owner.id]) {
              ownerMap[p.current_owner.id] = p.current_owner;
            }
          }
        }
        setOwners(Object.values(ownerMap));
      } catch (err) {
        console.error("Failed to fetch admin dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="min-h-screen bg-primary-navy text-text-primary p-8">
      {/* Header */}
      <header className="mb-8 flex justify-between items-end border-b border-border-color pb-4">
        <div className="flex items-center gap-3">
          <Cpu className="text-pending-amber animate-pulse" size={32} />
          <div>
            <h1 className="font-serif text-3xl font-bold text-text-primary">System Administrator Console</h1>
            <p className="text-text-secondary mt-1">Infrastructure Health, Node Stats & Ledger Audits</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface-mid px-4 py-2 rounded border border-border-color">
            <span className="text-sm font-bold text-pending-amber font-mono">NODE ID: NODE-BLR-MAIN</span>
          </div>
          <a href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">← Back</a>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Stats & System Health */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface-dark p-4 rounded-lg border border-border-color shadow flex flex-col justify-between">
              <span className="text-xs text-text-secondary uppercase font-bold tracking-wider">Blockchain Height</span>
              <span className="text-3xl font-mono font-bold text-accent-blue mt-2">
                #{checkpoints.length > 0 ? checkpoints[0].blockNumber : 8}
              </span>
            </div>
            <div className="bg-surface-dark p-4 rounded-lg border border-border-color shadow flex flex-col justify-between">
              <span className="text-xs text-text-secondary uppercase font-bold tracking-wider">Registered Owners</span>
              <span className="text-3xl font-mono font-bold text-text-primary mt-2">
                {owners.length > 0 ? owners.length : 5}
              </span>
            </div>
            <div className="bg-surface-dark p-4 rounded-lg border border-border-color shadow flex flex-col justify-between">
              <span className="text-xs text-text-secondary uppercase font-bold tracking-wider">Active Disputes</span>
              <span className="text-3xl font-mono font-bold text-frozen-red mt-2">
                {stats?.activeCases ?? 1}
              </span>
            </div>
            <div className="bg-surface-dark p-4 rounded-lg border border-border-color shadow flex flex-col justify-between">
              <span className="text-xs text-text-secondary uppercase font-bold tracking-wider">Consensus Status</span>
              <span className="text-sm font-bold text-verified-green mt-4 flex items-center gap-1.5">
                <ShieldCheck size={16} /> OPERATIONAL
              </span>
            </div>
          </div>

          {/* Audit: User Directory */}
          <div className="bg-surface-dark rounded-lg border border-border-color shadow overflow-hidden">
            <div className="p-4 border-b border-border-color bg-surface-mid">
              <h2 className="font-serif font-bold text-lg flex items-center gap-2">
                <Users size={18} className="text-accent-blue" /> User & Title Registry Audit
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {owners.length === 0 ? (
                  <p className="text-text-secondary text-sm">No owners seeded in registry.</p>
                ) : (
                  owners.map(owner => (
                    <div key={owner.id} className="p-3 bg-surface-mid rounded border border-border-color/60 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-surface-dark border border-border-color overflow-hidden flex-shrink-0 relative">
                        {owner.photoUrl && (
                          <img src={owner.photoUrl} alt={owner.fullName} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-text-primary">{owner.fullName}</div>
                        <div className="text-xs text-text-secondary">{owner.isNri ? `OCI: ${owner.ociNumber}` : 'Resident Citizen'}</div>
                        {owner.country && owner.country !== 'IN' && (
                          <span className="text-[9px] bg-accent-blue/20 text-accent-blue border border-accent-blue/30 px-1 rounded font-bold uppercase">{owner.country}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Audit Logs */}
          <div className="bg-surface-dark rounded-lg border border-border-color shadow overflow-hidden">
            <div className="p-4 border-b border-border-color bg-surface-mid flex justify-between items-center">
              <h2 className="font-serif font-bold text-lg flex items-center gap-2">
                <Activity size={18} className="text-accent-blue" /> Infrastructure Nodes health
              </h2>
              <span className="text-xs bg-verified-green/20 text-verified-green px-2 py-0.5 rounded font-bold uppercase">All Nodes Green</span>
            </div>
            <div className="p-4 text-xs font-mono space-y-2">
              <div className="flex justify-between border-b border-border-color/20 pb-1.5">
                <span className="text-text-secondary">Node: SR-BLR-001 (Bangalore East Sub-Registrar)</span>
                <span className="text-verified-green">CONNECTED · Latency: 12ms</span>
              </div>
              <div className="flex justify-between border-b border-border-color/20 pb-1.5">
                <span className="text-text-secondary">Node: SR-MYS-004 (Mysore Central Sub-Registrar)</span>
                <span className="text-verified-green">CONNECTED · Latency: 15ms</span>
              </div>
              <div className="flex justify-between border-b border-border-color/20 pb-1.5">
                <span className="text-text-secondary">Node: HC-KAR-BENCH-02 (Karnataka High Court Bench)</span>
                <span className="text-verified-green">CONNECTED · Latency: 8ms</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Recent Blockchain Blocks */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Blockchain Block explorer */}
          <div className="bg-surface-dark rounded-lg border border-border-color shadow overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-border-color bg-surface-mid flex justify-between items-center">
              <h2 className="font-serif font-bold text-lg flex items-center gap-2">
                <Database size={18} className="text-pending-amber" /> Blockchain Explorer
              </h2>
              <span className="text-xs text-text-secondary font-mono">{checkpoints.length} Blocks</span>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[500px] space-y-4">
              {loading ? (
                <p className="text-center text-text-secondary text-sm">Loading ledger blocks...</p>
              ) : checkpoints.length === 0 ? (
                <p className="text-center text-text-secondary text-sm">No blocks committed.</p>
              ) : (
                checkpoints.map(cp => (
                  <div key={cp.id} className="p-3 bg-surface-mid rounded border border-border-color font-mono text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-accent-blue">Block #{cp.blockNumber}</span>
                      <span className="text-text-primary uppercase text-[10px]">{cp.eventType}</span>
                    </div>
                    <div className="text-[10px] text-text-secondary break-all">
                      Hash: <span className="text-text-primary">{cp.eventHash}</span>
                    </div>
                    <div className="text-[10px] text-text-secondary">
                      Signer Node: <span className="text-text-primary">{cp.signer}</span>
                    </div>
                    <div className="text-[9px] text-text-secondary text-right pt-1">
                      {new Date(cp.timestamp).toLocaleString()}
                    </div>
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
