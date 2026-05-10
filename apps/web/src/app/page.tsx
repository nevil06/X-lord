"use client";

import React, { useState, useEffect } from 'react';
import MapViewer from '@/components/map/MapViewer';
import { Search, Shield, Loader2 } from 'lucide-react';

const API_BASE = '/api/backend';

export default function CitizenPortal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [parcels, setParcels] = useState<any[]>([]);
  const [allParcels, setAllParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState<any>(null);

  // Fetch all parcels for map on mount
  useEffect(() => {
    fetch(`${API_BASE}/parcels/all`)
      .then(res => res.json())
      .then(data => setAllParcels(data.parcels || []))
      .catch(() => setAllParcels([]));
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API_BASE}/parcels/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setParcels(data.parcels || []);
    } catch (err) {
      console.error('Search failed:', err);
      setParcels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const displayParcels = searched ? parcels : allParcels;

  const statusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-verified-green/20 text-verified-green';
      case 'PENDING': return 'bg-pending-amber/20 text-pending-amber';
      case 'FROZEN': return 'bg-frozen-red/20 text-frozen-red';
      case 'DISPUTED': return 'bg-disputed-purple/20 text-disputed-purple';
      default: return 'bg-surface-light text-text-secondary';
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Header */}
      <header className="bg-surface-dark border-b border-border-color py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-accent-blue" />
          <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary">
            Land Trust Infrastructure
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-sm font-medium px-3 py-1 bg-surface-mid rounded text-text-secondary">
            Citizen Portal
          </span>
          <a href="/login" className="text-sm font-medium px-3 py-1.5 bg-accent-blue hover:bg-blue-700 rounded text-white transition-colors">
            Sign In
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 max-w-screen-2xl mx-auto w-full">
        {/* Sidebar Search */}
        <aside className="w-full lg:w-96 flex flex-col gap-6">
          <div className="bg-surface-dark p-6 rounded-lg border border-border-color shadow-sm">
            <h2 className="font-serif text-xl font-bold mb-4">Public Land Search</h2>
            <p className="text-sm text-text-secondary mb-4">
              Search the immutable registry by Land UID, survey number, or village.
            </p>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="KA-BLR-KRP-... or 41/A" 
                  className="w-full bg-primary-navy border border-border-color rounded px-4 py-2 pl-10 text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                />
              </div>
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-accent-blue hover:bg-blue-700 text-white font-medium py-2 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Searching...</> : 'Search Registry'}
              </button>
            </div>
          </div>
          
          <div className="bg-surface-dark p-6 rounded-lg border border-border-color shadow-sm flex-1 overflow-y-auto max-h-[600px]">
            <h3 className="font-serif font-bold mb-3">
              {searched ? `Results (${parcels.length})` : `All Parcels (${allParcels.length})`}
            </h3>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="p-3 border border-border-color rounded animate-pulse">
                    <div className="h-4 bg-surface-mid rounded w-3/4 mb-2" />
                    <div className="h-3 bg-surface-mid rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {displayParcels.length === 0 && searched && (
                  <p className="text-sm text-text-secondary">No parcels found for "{searchQuery}".</p>
                )}
                {displayParcels.map((p: any) => (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedParcel(p)}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedParcel?.id === p.id 
                        ? 'border-accent-blue bg-accent-blue/5' 
                        : 'border-border-color hover:bg-surface-mid'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-sm font-bold text-accent-blue">{p.land_uid}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${statusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary">Survey No: {p.survey_number}</div>
                    {p.village && <div className="text-xs text-text-secondary mt-0.5">Village: {p.village}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Map Area */}
        <section className="flex-1 relative bg-surface-dark rounded-lg border border-border-color overflow-hidden flex flex-col min-h-[600px]">
          <MapViewer 
            parcels={displayParcels} 
            selectedParcel={selectedParcel}
            onSelectParcel={setSelectedParcel}
          />
        </section>
      </main>
    </div>
  );
}
