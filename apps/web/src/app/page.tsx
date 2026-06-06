"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Search, Globe, Scale, Key, FileText, Database, ShieldAlert, Cpu } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = '/api/backend';

export default function HomeDashboard() {
  const router = useRouter();
  
  // Dashboard statistics
  const [stats, setStats] = useState({
    totalParcels: 6,
    frozenParcels: 1,
    pendingParcels: 1,
    verifiedParcels: 4,
    activeCases: 1,
    highRiskFlags: 2,
    nriOwners: 1,
    pendingMutations: 2
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/parcels/stats`)
      .then(res => res.json())
      .then(data => {
        if (data.totalParcels !== undefined) {
          setStats(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const gateways = [
    {
      title: 'Public Citizen Portal',
      description: 'Search land parcels, view interactive GIS maps, inspect title chain histories, and download verified digital title certificates.',
      icon: Search,
      path: '/citizen',
      role: 'citizen',
      buttonText: 'Enter Public Portal',
      color: 'border-accent-blue/30 hover:border-accent-blue',
      iconColor: 'text-accent-blue',
      badge: 'Public Access'
    },
    {
      title: 'NRI Protection Portal',
      description: 'Allows Non-Resident Indian (NRI) owners to monitor their title listings, audit recent history logs, and manage alerts.',
      icon: Globe,
      path: '/login?role=nri',
      role: 'nri',
      buttonText: 'Enter NRI Portal',
      color: 'border-border-color hover:border-accent-blue/50',
      iconColor: 'text-accent-blue',
      badge: 'OCI Verified'
    },
    {
      title: 'High Court Terminal',
      description: 'Judicial docket overview for High Court judges to inspect active freezes and review injunction case histories.',
      icon: Scale,
      path: '/login?role=court',
      role: 'court',
      buttonText: 'Enter Court Portal',
      color: 'border-border-color hover:border-pending-amber/50',
      iconColor: 'text-pending-amber',
      badge: 'Judiciary View'
    },
    {
      title: 'Officer Workstation',
      description: 'Sub-Registrar and Collector workbench for mutation review, registration, and resolving flagged velocity fraud logs.',
      icon: Key,
      path: '/login',
      role: 'officer',
      buttonText: 'Staff Login',
      color: 'border-border-color hover:border-verified-green/50',
      iconColor: 'text-verified-green',
      badge: 'Password Protected'
    },
    {
      title: 'System Administrator',
      description: 'Consolidated admin console showing blockchain heights, recent transaction block commits, system audits, and metrics.',
      icon: Cpu,
      path: '/login?role=admin',
      role: 'admin',
      buttonText: 'Admin Login',
      color: 'border-border-color hover:border-pending-amber/50',
      iconColor: 'text-pending-amber',
      badge: 'Protected'
    }
  ];

  return (
    <div className="min-h-full min-screen bg-primary-navy text-text-primary flex flex-col">
      
      {/* Header Banner */}
      <header className="bg-surface-dark border-b border-border-color py-6 px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Shield size={32} className="text-accent-blue" />
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary uppercase">
              X-Lord Sovereignty Register
            </h1>
            <p className="text-xs text-text-secondary tracking-widest uppercase">
              Decentralized Land Trust & GIS Infrastructure
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-verified-green/10 border border-verified-green/20 px-3 py-1.5 rounded-full text-verified-green">
          <Database size={12} />
          <span>Blockchain Block Height: #{stats.totalParcels + 2}</span>
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto py-4">
          <h2 className="text-4xl font-serif font-bold text-text-primary mb-4">
            Sovereign Property Rights Verification
          </h2>
          <p className="text-text-secondary leading-relaxed">
            This platform secures land transaction lineage, automates GIS boundary validation, and integrates departmental roles under a simulated cryptographic block consensus.
          </p>
        </div>

        {/* Global Statistics Grid */}
        <section className="bg-surface-dark border border-border-color rounded-xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-blue via-verified-green to-pending-amber"></div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
            <Database size={16} className="text-accent-blue" /> Jurisdiction Ledger Statistics
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-4 bg-surface-mid rounded border border-border-color/40">
              <span className="text-xs text-text-secondary block">Active GIS Listings</span>
              <span className="text-3xl font-serif font-bold text-text-primary mt-1 block">
                {stats.totalParcels} Parcels
              </span>
            </div>
            <div className="p-4 bg-surface-mid rounded border border-border-color/40">
              <span className="text-xs text-text-secondary block">Judicial Injunctions</span>
              <span className="text-3xl font-serif font-bold text-frozen-red mt-1 block">
                {stats.activeCases} Frozen
              </span>
            </div>
            <div className="p-4 bg-surface-mid rounded border border-border-color/40">
              <span className="text-xs text-text-secondary block">Pending Mutations</span>
              <span className="text-3xl font-serif font-bold text-pending-amber mt-1 block">
                {stats.pendingMutations} Pending
              </span>
            </div>
            <div className="p-4 bg-surface-mid rounded border border-border-color/40">
              <span className="text-xs text-text-secondary block">Active Security Alerts</span>
              <span className="text-3xl font-serif font-bold text-pending-amber mt-1 block">
                {stats.highRiskFlags} Flags
              </span>
            </div>
          </div>
        </section>

        {/* Gateway Directory Cards */}
        <section className="space-y-6">
          <h3 className="text-lg font-serif font-bold text-text-primary border-b border-border-color pb-2">
            Institutional Gateway Access
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gateways.map(gate => {
              const GateIcon = gate.icon;
              return (
                <div 
                  key={gate.title} 
                  className={`bg-surface-dark border p-6 rounded-xl flex flex-col justify-between shadow hover:shadow-lg transition-all ${gate.color}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className={`p-2 bg-primary-navy rounded border border-border-color/60 ${gate.iconColor}`}>
                        <GateIcon size={24} />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest bg-surface-mid px-2 py-0.5 rounded text-text-secondary border border-border-color/50">
                        {gate.badge}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-serif font-bold mb-2 text-text-primary">
                      {gate.title}
                    </h4>
                    <p className="text-sm text-text-secondary leading-relaxed mb-6">
                      {gate.description}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => router.push(gate.path)}
                    className="w-full py-2 bg-surface-mid hover:bg-surface-light border border-border-color rounded text-sm font-bold text-text-primary transition-colors flex items-center justify-center gap-1.5"
                  >
                    {gate.buttonText} →
                  </button>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border-color py-6 text-center text-xs text-text-secondary mt-12 bg-surface-dark">
        <p>© 2026 Department of Revenue, Government of Karnataka. Powered by Sovereign Land Trust Ledger.</p>
      </footer>
    </div>
  );
}
