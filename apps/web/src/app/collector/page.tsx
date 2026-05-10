"use client";

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Shield, Users, Loader2, CheckCircle } from 'lucide-react';
import MapViewer from '@/components/map/MapViewer';

const API_BASE = '/api/backend';

interface Stats {
  totalParcels: number;
  frozenParcels: number;
  pendingParcels: number;
  verifiedParcels: number;
  activeCases: number;
  highRiskFlags: number;
  nriOwners: number;
  pendingMutations: number;
}

interface FraudFlag {
  id: string;
  flagType: string;
  riskScore: number;
  explanation: string;
  aiModel: string;
  resolved: boolean;
  createdAt: string;
  parcel?: { landUid: string; id: string };
}

export default function CollectorDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [flags, setFlags] = useState<FraudFlag[]>([]);
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [freezeLoading, setFreezeLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, flagsRes, parcelsRes] = await Promise.all([
        fetch(`${API_BASE}/parcels/stats`),
        fetch(`${API_BASE}/fraud?resolved=false`),
        fetch(`${API_BASE}/parcels/all`)
      ]);
      const statsData = await statsRes.json();
      const flagsData = await flagsRes.json();
      const parcelsData = await parcelsRes.json();
      setStats(statsData);
      setFlags(flagsData.flags || []);
      setParcels(parcelsData.parcels || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFreeze = async (parcelId: string) => {
    setFreezeLoading(parcelId);
    try {
      const res = await fetch(`${API_BASE}/court/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelId,
          courtOrderNumber: `WP-${new Date().getFullYear()}-${Math.floor(Math.random() * 99999)}`,
          reason: 'Fraud investigation initiated by District Collector',
          officialId: 'DC-BLR-001'
        })
      });
      if (res.ok) {
        setToast('Parcel frozen successfully. Blockchain checkpoint created.');
        fetchData();
      }
    } catch {
      setToast('Failed to freeze parcel.');
    } finally {
      setFreezeLoading(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const kpiCards = stats ? [
    { label: 'Total Parcels', value: stats.totalParcels, icon: Activity, color: 'text-text-secondary', borderColor: 'border-border-color' },
    { label: 'Active Disputes', value: stats.activeCases, icon: AlertTriangle, color: 'text-frozen-red', borderColor: 'border-frozen-red/50' },
    { label: 'High Risk Flags', value: stats.highRiskFlags, icon: Shield, color: 'text-pending-amber', borderColor: 'border-border-color' },
    { label: 'NRI Owners', value: stats.nriOwners, icon: Users, color: 'text-accent-blue', borderColor: 'border-border-color' },
  ] : [];

  return (
    <div className="min-h-screen bg-primary-navy p-8 flex flex-col gap-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-lg border bg-verified-green/20 border-verified-green text-verified-green shadow-xl flex items-center gap-3">
          <CheckCircle size={16} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <header className="flex justify-between items-end border-b border-border-color pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-text-primary">District Collector Overview</h1>
          <p className="text-text-secondary mt-1">Macro-Level Fraud Detection & Jurisdiction Map</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface-mid px-4 py-2 rounded border border-border-color">
            <span className="text-sm font-bold text-text-primary">District: BLR (Bangalore Urban)</span>
          </div>
          <a href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">← Back</a>
        </div>
      </header>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-surface-dark p-4 rounded-lg border border-border-color animate-pulse">
              <div className="h-4 bg-surface-mid rounded w-1/2 mb-3" />
              <div className="h-8 bg-surface-mid rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {kpiCards.map(kpi => (
            <div key={kpi.label} className={`bg-surface-dark p-4 rounded-lg border ${kpi.borderColor} shadow`}>
              <div className={`flex items-center gap-2 ${kpi.color} mb-2`}>
                <kpi.icon size={16} />
                <span className="text-sm font-bold uppercase tracking-wider">{kpi.label}</span>
              </div>
              <div className={`text-3xl font-serif font-bold ${kpi.color}`}>
                {kpi.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Map */}
        <div className="col-span-2 bg-surface-dark rounded-lg border border-border-color shadow overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-border-color bg-surface-mid">
            <h2 className="font-serif font-bold text-lg">Jurisdiction Map</h2>
          </div>
          <div className="flex-1 relative">
            <MapViewer parcels={parcels} />
          </div>
        </div>

        {/* Fraud Alerts */}
        <div className="col-span-1 bg-surface-dark rounded-lg border border-border-color shadow flex flex-col">
          <div className="p-4 border-b border-border-color bg-surface-mid flex justify-between items-center">
            <h2 className="font-serif font-bold text-lg">Fraud Alerts</h2>
            {flags.length > 0 && (
              <span className="bg-frozen-red text-white text-xs px-2 py-1 rounded font-bold">
                {flags.length} Active
              </span>
            )}
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-text-secondary" /></div>
            ) : flags.length === 0 ? (
              <p className="text-center text-text-secondary py-8">No active fraud flags.</p>
            ) : (
              flags.map(flag => (
                <div key={flag.id} className="p-3 bg-surface-mid border border-frozen-red/30 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-sm font-bold text-text-primary">
                      {flag.parcel?.landUid || '—'}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                      (flag.riskScore || 0) >= 70 ? 'bg-frozen-red/20 text-frozen-red' :
                      (flag.riskScore || 0) >= 40 ? 'bg-pending-amber/20 text-pending-amber' :
                      'bg-surface-light text-text-secondary'
                    }`}>
                      Risk: {flag.riskScore}%
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary mb-1">{flag.flagType.replace(/_/g, ' ')}</div>
                  <p className="text-sm text-text-secondary mb-3">{flag.explanation}</p>
                  {flag.parcel && (
                    <button 
                      onClick={() => handleFreeze(flag.parcel!.id)}
                      disabled={freezeLoading === flag.parcel!.id}
                      className="w-full py-1.5 bg-frozen-red/10 text-frozen-red hover:bg-frozen-red/20 rounded text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {freezeLoading === flag.parcel!.id 
                        ? <><Loader2 size={14} className="animate-spin" /> Freezing...</>
                        : 'Initiate Freeze'
                      }
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
