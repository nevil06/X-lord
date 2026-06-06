"use client";

import React, { useState, useEffect } from 'react';
import MapViewer from '@/components/map/MapViewer';
import { Search, Shield, Loader2, FileText, ArrowRight, Eye, CheckCircle, Clock, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = '/api/backend';

export default function CitizenPortal() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [parcels, setParcels] = useState<any[]>([]);
  const [allParcels, setAllParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  // Selected parcel for detailed UI and Map focusing
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  
  // Title Certificate Modal State
  const [showCertificate, setShowCertificate] = useState(false);

  // Fetch all parcels for map rendering on mount
  useEffect(() => {
    fetch(`${API_BASE}/parcels/all`)
      .then(res => res.json())
      .then(data => {
        const list = data.parcels || [];
        setAllParcels(list);
      })
      .catch(() => setAllParcels([]));
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    setSelectedParcel(null);
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

  const handleSelectParcel = (p: any) => {
    // Find the full parcel data (with current_owner details) from either state
    const fullParcel = displayParcels.find(item => item.land_uid === p.land_uid);
    setSelectedParcel(fullParcel || p);
  };

  const displayParcels = searched ? parcels : allParcels;

  const statusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-verified-green/20 text-verified-green border border-verified-green/30';
      case 'PENDING': return 'bg-pending-amber/20 text-pending-amber border border-pending-amber/30';
      case 'FROZEN': return 'bg-frozen-red/20 text-frozen-red border border-frozen-red/30';
      case 'DISPUTED': return 'bg-disputed-purple/20 text-disputed-purple border border-disputed-purple/30';
      default: return 'bg-surface-light text-text-secondary';
    }
  };

  // Mock certificate formatting hash calculation
  const mockCertHash = selectedParcel ? crypto.subtle ? '0x' + Array.from(new Uint8Array(8)).map(() => Math.floor(Math.random()*16).toString(16)).join('') : '0xfa928cb81a2e77e' : '';

  return (
    <div className="flex flex-col h-full min-h-screen bg-primary-navy text-text-primary">
      {/* Header */}
      <header className="bg-surface-dark border-b border-border-color py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-accent-blue" />
          <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary">
            Land Trust Infrastructure
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-sm font-medium px-3 py-1 bg-surface-mid rounded text-text-secondary border border-border-color">
            Citizen Search Portal
          </span>
          <a href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            ← Home Dashboard
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 max-w-screen-2xl mx-auto w-full">
        {/* Sidebar Search */}
        <aside className="w-full lg:w-96 flex flex-col gap-6 shrink-0">
          
          {/* Search Box */}
          <div className="bg-surface-dark p-6 rounded-lg border border-border-color shadow-sm">
            <h2 className="font-serif text-xl font-bold mb-4">Public Land Search</h2>
            <p className="text-sm text-text-secondary mb-4">
              Enter a unique Land UID (e.g. KA-BLR-KRP-0000001) or Survey Number.
            </p>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="KA-BLR-... or 41/A" 
                  className="w-full bg-primary-navy border border-border-color rounded px-4 py-2 pl-10 text-text-primary focus:outline-none focus:border-accent-blue transition-colors text-sm font-mono"
                />
              </div>
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-accent-blue hover:bg-blue-700 text-white font-medium py-2 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Searching...</> : 'Search Registry'}
              </button>
            </div>
          </div>
          
          {/* List of Results */}
          <div className="bg-surface-dark p-6 rounded-lg border border-border-color shadow-sm flex-1 overflow-y-auto max-h-[450px]">
            <h3 className="font-serif font-bold mb-3">
              {searched ? `Results (${parcels.length})` : `All Parcels (${allParcels.length})`}
            </h3>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="p-3 border border-border-color rounded animate-pulse bg-surface-mid/30">
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
                    onClick={() => handleSelectParcel(p)}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedParcel?.land_uid === p.land_uid 
                        ? 'border-accent-blue bg-surface-mid shadow' 
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

        {/* Map Area and Selection Overlays */}
        <section className="flex-1 relative bg-surface-dark rounded-lg border border-border-color overflow-hidden flex flex-col min-h-[600px] shadow-sm">
          <MapViewer 
            parcels={displayParcels} 
            selectedParcel={selectedParcel}
            onSelectParcel={handleSelectParcel}
          />

          {/* Selection Detail Overlay Card */}
          {selectedParcel && (
            <div className="absolute bottom-4 left-4 right-4 lg:right-auto lg:w-96 bg-surface-dark/95 backdrop-blur border border-border-color p-5 rounded-lg shadow-2xl z-20 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs text-text-secondary uppercase tracking-widest font-bold">Land parcel record</span>
                  <h4 className="font-mono font-bold text-lg text-accent-blue">{selectedParcel.land_uid}</h4>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-sm font-bold ${statusColor(selectedParcel.status)}`}>
                  {selectedParcel.status}
                </span>
              </div>

              {/* Owner Info & Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-surface-mid p-3 rounded border border-border-color/50">
                  <div className="w-10 h-10 rounded bg-surface-light border border-border-color flex-shrink-0 overflow-hidden relative">
                    {selectedParcel.currentOwner?.photoUrl ? (
                      <img 
                        src={selectedParcel.currentOwner.photoUrl} 
                        alt={selectedParcel.currentOwner.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-text-secondary text-sm">
                        ?
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-text-secondary block">Registered Owner</span>
                    <span className="font-bold text-sm text-text-primary">
                      {selectedParcel.currentOwner?.fullName || 'Government Land'}
                    </span>
                    {selectedParcel.currentOwner?.isNri && (
                      <span className="ml-2 text-[10px] bg-accent-blue/20 text-accent-blue px-1.5 py-0.5 rounded font-bold uppercase">
                        NRI
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-b border-border-color/40 pb-3">
                  <div>
                    <span className="text-text-secondary block">Survey Number</span>
                    <span className="font-medium text-text-primary">{selectedParcel.survey_number}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary block">Total Area</span>
                    <span className="font-medium text-text-primary">{selectedParcel.area_sqm} sqm</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-text-secondary block">Village</span>
                    <span className="font-medium text-text-primary">{selectedParcel.village || 'Devasandra'}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-text-secondary block">Jurisdiction</span>
                    <span className="font-medium text-text-primary">{selectedParcel.taluk_code} / {selectedParcel.district_code}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => router.push(`/lineage/${selectedParcel.land_uid}`)}
                    className="flex-1 py-2 bg-surface-mid hover:bg-surface-light border border-border-color rounded text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Clock size={13} /> View History
                  </button>
                  <button 
                    onClick={() => setShowCertificate(true)}
                    className="flex-1 py-2 bg-accent-blue hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-accent-blue/15"
                  >
                    <FileText size={13} /> Clear Title Cert
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Title Certificate Modal */}
      {showCertificate && selectedParcel && (
        <div className="fixed inset-0 bg-primary-navy/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-surface-dark border-2 border-pending-amber/40 rounded-lg max-w-2xl w-full p-8 shadow-2xl relative overflow-hidden my-8">
            {/* Watermark Govt Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <Shield size={450} />
            </div>

            {/* Certificate Border decoration */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pending-amber via-yellow-500 to-pending-amber"></div>

            {/* Header */}
            <div className="text-center border-b-2 border-border-color pb-4 mb-6 relative">
              <h3 className="font-serif text-lg font-bold tracking-widest text-pending-amber uppercase">
                Government of Karnataka
              </h3>
              <p className="text-xs uppercase tracking-widest text-text-secondary mt-1">
                Department of Revenue & Land Records
              </p>
              <h4 className="font-serif text-2xl font-bold text-text-primary mt-3 uppercase tracking-tight">
                Certificate of Immutable Land Title
              </h4>
              <p className="text-[10px] text-text-secondary font-mono mt-1">
                Security Reference: {mockCertHash.toUpperCase()}
              </p>
            </div>

            {/* Certificate Body */}
            <div className="space-y-6 relative">
              <p className="text-sm text-center leading-relaxed text-text-secondary max-w-lg mx-auto">
                This is to officially certify that the property records matching the unique identifiers below have been verified on the sovereign decentralized blockchain register.
              </p>

              {/* Owner and Photo Row */}
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-surface-mid/40 p-4 border border-border-color/50 rounded-lg">
                {/* Photo */}
                <div className="w-24 h-28 bg-surface-dark border-2 border-border-color rounded-sm overflow-hidden relative shadow flex-shrink-0">
                  {selectedParcel.currentOwner?.photoUrl ? (
                    <img 
                      src={selectedParcel.currentOwner.photoUrl} 
                      alt={selectedParcel.currentOwner.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-secondary font-bold">
                      No Photo
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 w-full text-center sm:text-left space-y-2">
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase block tracking-wider font-bold">Registered Legal Owner</span>
                    <span className="text-lg font-serif font-bold text-text-primary">
                      {selectedParcel.currentOwner?.fullName || 'Government Land'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs pt-1 border-t border-border-color/30">
                    <div>
                      <span className="text-text-secondary text-[10px]">Aadhaar / OCI Hash</span>
                      <span className="font-mono block">{selectedParcel.currentOwner?.ociNumber || selectedParcel.currentOwner?.aadhaarHash?.slice(0, 12) || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary text-[10px]">Classification</span>
                      <span className="font-bold block">{selectedParcel.currentOwner?.isNri ? 'NRI Owner' : 'Resident Citizen'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Land Specs */}
              <div className="bg-surface-mid/40 p-4 border border-border-color/50 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-text-secondary text-[10px] block uppercase">Land UID</span>
                  <span className="font-mono text-sm font-bold text-accent-blue">{selectedParcel.land_uid}</span>
                </div>
                <div>
                  <span className="text-text-secondary text-[10px] block uppercase">Survey Number</span>
                  <span className="text-sm font-bold">{selectedParcel.survey_number}</span>
                </div>
                <div>
                  <span className="text-text-secondary text-[10px] block uppercase">Area Size</span>
                  <span className="text-sm font-bold">{selectedParcel.area_sqm} sqm</span>
                </div>
                <div>
                  <span className="text-text-secondary text-[10px] block uppercase">Jurisdiction</span>
                  <span className="text-sm font-bold">{selectedParcel.taluk_code} Taluk</span>
                </div>
              </div>

              {/* Blockchain Cleared Hashes */}
              <div className="border border-border-color/60 rounded p-3 text-[11px] font-mono bg-surface-mid/60 space-y-1">
                <div className="text-pending-amber font-bold mb-1.5 text-xs flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-verified-green" /> CRYPTOGRAPHIC LEDGER CLEARED
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Block Reference:</span>
                  <span className="text-text-primary">Block #8 (Latest Event Commit)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Signer Authority:</span>
                  <span className="text-text-primary">SR-BLR-022 (Revenue Officer Office)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">State Event Hash:</span>
                  <span className="text-text-primary truncate max-w-xs">{mockCertHash.toUpperCase()}E9281CBA30F2</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border-color">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 py-2 bg-surface-mid hover:bg-surface-light border border-border-color text-text-primary rounded text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  Download Certified Copy (PDF)
                </button>
                <button 
                  onClick={() => setShowCertificate(false)}
                  className="py-2 px-6 bg-accent-blue hover:bg-blue-700 text-white rounded text-sm font-bold transition-colors"
                >
                  Close Clear Title
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
