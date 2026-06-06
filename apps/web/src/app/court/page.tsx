"use client";

import React, { useState, useEffect } from 'react';
import { Scale, Search, ShieldAlert, FileText, Download, ShieldCheck, FileWarning, Clock, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = '/api/backend';

export default function HighCourtTerminal() {
  const router = useRouter();
  const [activeCases, setActiveCases] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedParcel, setSearchedParcel] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Freeze Form State
  const [freezeOrderNum, setFreezeOrderNum] = useState('');
  const [freezeReason, setFreezeReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchActiveCases();
  }, []);

  const fetchActiveCases = async () => {
    try {
      const res = await fetch(`${API_BASE}/court/active`);
      const data = await res.json();
      setActiveCases(data.cases || []);
    } catch (err) {
      console.error('Failed to fetch active cases', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearchedParcel(null);
    try {
      const res = await fetch(`${API_BASE}/parcels/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.parcels && data.parcels.length > 0) {
        setSearchedParcel(data.parcels[0]);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action: 'freeze' | 'unfreeze') => {
    if (!searchedParcel || !freezeOrderNum || !freezeReason) return;
    setIsProcessing(true);
    
    try {
      await fetch(`${API_BASE}/court/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcelId: searchedParcel.id,
          courtOrderNumber: freezeOrderNum,
          reason: freezeReason,
          officialId: 'HC-JUDGE-001'
        })
      });
      
      // Reset and refresh
      setFreezeOrderNum('');
      setFreezeReason('');
      setSearchedParcel(null);
      setSearchQuery('');
      fetchActiveCases();
    } catch (err) {
      console.error(`Failed to ${action} parcel`, err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-navy font-sans text-text-primary">
      
      {/* HC Header */}
      <header className="bg-surface-dark border-b-2 border-pending-amber py-5 px-8 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-pending-amber flex items-center justify-center text-pending-amber">
            <Scale size={28} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-pending-amber uppercase">
              High Court of Karnataka
            </h1>
            <h2 className="text-sm text-text-secondary tracking-widest uppercase mt-1">
              Land Dispute & Injunction Terminal
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-4 border-l border-border-color pl-6">
          <div className="text-right">
            <div className="text-sm font-bold">Hon. Justice V. Sharma</div>
            <div className="text-xs text-text-secondary">Chamber 4B • Authorized</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        
        {/* Left Column: Action Terminal */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Parcel Lookup */}
          <div className="bg-surface-dark border border-border-color rounded-sm p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-accent-blue"></div>
            <h3 className="font-bold font-serif mb-4 flex items-center gap-2 text-lg">
              <Search size={20} className="text-accent-blue" /> Case / Parcel Lookup
            </h3>
            
            <div className="flex gap-2 mb-6">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter Parcel UID or Case No..." 
                className="flex-1 bg-surface-mid border border-border-color rounded-sm px-4 py-2 font-mono text-sm focus:border-accent-blue outline-none transition-colors"
              />
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-accent-blue hover:bg-blue-700 text-white px-4 py-2 rounded-sm font-medium transition-colors"
              >
                {loading ? <RefreshCcw className="animate-spin" size={20} /> : 'Search'}
              </button>
            </div>

            {searchedParcel && (
              <div className="border border-border-color rounded-sm bg-surface-mid p-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-xs text-text-secondary uppercase tracking-wider mb-1">Target Subject</div>
                    <div className="font-mono font-bold text-lg text-accent-blue">{searchedParcel.land_uid}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded-sm border ${
                    searchedParcel.status === 'FROZEN' ? 'bg-frozen-red/20 text-frozen-red border-frozen-red/50' : 
                    'bg-verified-green/20 text-verified-green border-verified-green/50'
                  }`}>
                    {searchedParcel.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-4 border-t border-b border-border-color py-3">
                  <div>
                    <span className="text-text-secondary block text-xs">Owner</span>
                    <span className="font-medium">{searchedParcel.current_owner?.fullName || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block text-xs">Survey No.</span>
                    <span className="font-medium">{searchedParcel.survey_number}</span>
                  </div>
                </div>

                {/* Freeze/Unfreeze Action Form (Auditor View-Only Mode) */}
                <div className="bg-surface-dark border border-border-color p-4 rounded-sm mt-4">
                  <h4 className="text-sm font-bold uppercase text-text-secondary mb-3 flex items-center gap-2">
                    <Scale size={16} /> Judicial Order Status
                  </h4>
                  <div className="space-y-3 bg-surface-mid p-3 rounded text-xs text-text-secondary leading-relaxed border border-border-color/60">
                    <p className="font-bold text-pending-amber uppercase tracking-wider mb-1">
                      ⚠️ Audit View-Only Mode
                    </p>
                    <p>
                      Injunction order execution and lifting are restricted to the authorized **District Collector (DC)** and **Sub-Registrar (SR)** workspaces.
                    </p>
                    {searchedParcel.status === 'FROZEN' ? (
                      <div className="mt-2 p-2 bg-frozen-red/10 border border-frozen-red/20 text-frozen-red rounded font-bold uppercase text-center">
                        Property is currently legally frozen
                      </div>
                    ) : (
                      <div className="mt-2 p-2 bg-verified-green/10 border border-verified-green/20 text-verified-green rounded font-bold uppercase text-center">
                        Property has no active injunctions
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Blockchain Export Tool */}
          <div className="bg-surface-dark border border-border-color rounded-sm p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-verified-green"></div>
            <h3 className="font-bold font-serif mb-2 flex items-center gap-2 text-lg">
              <FileText size={20} className="text-verified-green" /> Blockchain Audit Export
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Generate a cryptographically verified PDF report of an ownership chain for evidentiary use.
            </p>
            <button className="w-full flex items-center justify-center gap-2 bg-surface-mid hover:bg-surface-light border border-border-color py-2 rounded-sm transition-colors text-sm font-medium">
              <Download size={16} /> Export Verified Ledger (PDF)
            </button>
          </div>
        </div>

        {/* Right Column: Active Injunctions Docket */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface-dark border border-border-color rounded-sm shadow-xl h-full flex flex-col">
            <div className="p-6 border-b border-border-color flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-serif font-bold text-pending-amber">Active Injunction Docket</h2>
                <p className="text-text-secondary mt-1">Parcels currently under High Court freeze</p>
              </div>
              <div className="bg-frozen-red/10 border border-frozen-red/30 px-3 py-1 rounded-sm flex items-center gap-2 text-frozen-red font-bold text-sm">
                <ShieldAlert size={16} /> {activeCases.length} ACTIVE FREEZES
              </div>
            </div>
            
            <div className="p-0 flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-mid border-b border-border-color text-xs uppercase tracking-wider text-text-secondary sticky top-0">
                  <tr>
                    <th className="p-4 font-medium">Case No.</th>
                    <th className="p-4 font-medium">Parcel UID</th>
                    <th className="p-4 font-medium">Filing Date</th>
                    <th className="p-4 font-medium">Duration</th>
                    <th className="p-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color text-sm">
                  {activeCases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-text-secondary">
                        No active freezes on the docket.
                      </td>
                    </tr>
                  ) : activeCases.map((c: any) => {
                    const days = Math.floor((Date.now() - new Date(c.filingDate).getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={c.id} className="hover:bg-surface-mid/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-pending-amber">{c.caseNumber}</td>
                        <td className="p-4 font-mono text-accent-blue cursor-pointer hover:underline" onClick={() => router.push(`/lineage/${c.parcel?.land_uid}`)}>
                          {c.parcel?.land_uid}
                        </td>
                        <td className="p-4">{new Date(c.filingDate).toLocaleDateString()}</td>
                        <td className="p-4 flex items-center gap-2">
                          <Clock size={14} className="text-text-secondary" />
                          <span className={days > 90 ? 'text-frozen-red font-medium' : ''}>
                            {days} days
                          </span>
                        </td>
                        <td className="p-4">
                          <button 
                            onClick={() => {
                              setSearchQuery(c.parcel?.land_uid);
                              setSearchedParcel(c.parcel);
                              setFreezeOrderNum(c.caseNumber);
                            }}
                            className="text-xs bg-surface-light hover:bg-border-color px-2 py-1 rounded-sm transition-colors border border-border-color"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
