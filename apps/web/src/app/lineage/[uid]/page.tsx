import React from 'react';
import { notFound } from 'next/navigation';
import Timeline from '@/components/lineage/Timeline';
import { AlertCircle, Map as MapIcon, Share2, Download, ShieldCheck, FileText } from 'lucide-react';

// Define types based on what we expect from the API
interface ParcelData {
  id: string;
  land_uid: string;
  survey_number: string;
  village: string;
  taluk_code: string;
  district_code: string;
  area_sqm: number;
  status: string;
  boundary_geojson: any;
  currentOwner: {
    fullName: string;
    isNri: boolean;
  };
}

interface LineageEvent {
  id: string;
  eventType: string;
  eventDate: string;
  fromOwner?: { fullName: string };
  toOwner?: { fullName: string };
  blockRef?: string;
  verifierId?: string;
  documentHash?: string;
}

export default async function LineagePage({ params }: { params: { uid: string } }) {
  const uid = params.uid;

  // Fetch the lineage data
  const res = await fetch(`http://localhost:4000/api/lineage/${uid}`, { cache: 'no-store' });
  
  if (!res.ok) {
    if (res.status === 404) return notFound();
    throw new Error('Failed to fetch lineage data');
  }

  const data = await res.json();
  const parcel = data.parcel as ParcelData;
  const events = data.events as LineageEvent[];

  // Determine if there is a fraud flag or active freeze
  const isFrozen = parcel.status === 'FROZEN';
  const hasActiveDispute = parcel.status === 'DISPUTE';
  
  // Calculate mock encumbrance and tax (for demo)
  const encumbrance = isFrozen ? 'Active Court Dispute' : 'NIL';
  const taxStatus = isFrozen ? 'PENDING' : 'PAID UP TO 2024';

  return (
    <div className="min-h-screen bg-primary-navy p-6 pt-24 font-sans text-text-primary">
      <div className="max-w-7xl mx-auto">
        
        {/* Warning Banner for Frozen/Disputed Parcels */}
        {(isFrozen || hasActiveDispute) && (
          <div className="mb-6 bg-frozen-red/20 border border-frozen-red rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-frozen-red shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-frozen-red">WARNING: THIS PARCEL IS {parcel.status}</h3>
              <p className="text-sm text-text-secondary mt-1">
                This property is currently under a legal freeze or active dispute. No mutations, sales, or transfers can be processed until the issue is resolved by the relevant authorities.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-end mb-8 border-b border-border-color pb-6">
          <div>
            <h1 className="text-4xl font-serif font-bold text-text-primary">Ownership Lineage</h1>
            <p className="text-text-secondary mt-2">Verified Chain of Title & Blockchain Record</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-mid border border-border-color rounded hover:bg-surface-light text-sm transition-colors">
              <Share2 size={16} /> Share Link
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent-blue rounded hover:bg-blue-700 text-sm font-bold text-white transition-colors shadow-lg shadow-accent-blue/20">
              <Download size={16} /> Export Certified Lineage
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANEL: Parcel Intelligence */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface-dark border border-border-color rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <ShieldCheck size={120} />
              </div>
              
              <div className="mb-6 relative z-10">
                <h2 className="font-mono text-3xl font-bold text-accent-blue tracking-tight">{parcel.land_uid}</h2>
                <div className="flex gap-2 mt-3">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    parcel.status === 'VERIFIED' ? 'bg-verified-green/20 text-verified-green border border-verified-green/30' :
                    parcel.status === 'PENDING' ? 'bg-pending-amber/20 text-pending-amber border border-pending-amber/30' :
                    parcel.status === 'FROZEN' ? 'bg-frozen-red/20 text-frozen-red border border-frozen-red/30' :
                    'bg-surface-light text-text-secondary border border-border-color'
                  }`}>
                    {parcel.status}
                  </span>
                  {parcel.currentOwner?.isNri && (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-accent-blue/20 text-accent-blue border border-accent-blue/30">
                      NRI OWNER
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-mid p-3 rounded border border-border-color">
                    <div className="text-xs text-text-secondary mb-1">Current Owner</div>
                    <div className="font-bold">{parcel.currentOwner?.fullName || 'Unknown'}</div>
                  </div>
                  <div className="bg-surface-mid p-3 rounded border border-border-color">
                    <div className="text-xs text-text-secondary mb-1">Area</div>
                    <div className="font-bold">{parcel.area_sqm} sqm</div>
                  </div>
                </div>

                <div className="bg-surface-mid p-4 rounded border border-border-color">
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-text-secondary">Survey Number</div>
                    <div className="font-medium text-right">{parcel.survey_number}</div>
                    
                    <div className="text-text-secondary">Village</div>
                    <div className="font-medium text-right">{parcel.village}</div>
                    
                    <div className="text-text-secondary">Taluk/District</div>
                    <div className="font-medium text-right">{parcel.taluk_code} / {parcel.district_code}</div>
                  </div>
                </div>

                <div className="bg-surface-mid p-4 rounded border border-border-color">
                  <h3 className="text-sm font-bold border-b border-border-color pb-2 mb-3">Legal & Financial</h3>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-text-secondary">Encumbrance (EC)</div>
                    <div className={`font-medium text-right ${encumbrance === 'NIL' ? 'text-verified-green' : 'text-frozen-red'}`}>
                      {encumbrance}
                    </div>
                    
                    <div className="text-text-secondary">Property Tax</div>
                    <div className="font-medium text-right text-verified-green">{taxStatus}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* GIS Mini-Map Placeholder */}
            <div className="bg-surface-dark border border-border-color rounded-xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <MapIcon className="text-accent-blue" size={20} />
                <h3 className="font-bold">GIS Boundary Mapping</h3>
              </div>
              <div className="aspect-video bg-surface-mid rounded border border-border-color flex items-center justify-center relative overflow-hidden">
                {/* A simplified representation of the parcel boundary for the UI */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'radial-gradient(var(--color-border-color) 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}></div>
                <div className="relative z-10 p-4 border-2 border-accent-blue bg-accent-blue/10 rounded polygon-shape">
                  <span className="text-xs font-mono text-accent-blue">{parcel.land_uid}</span>
                </div>
                <style dangerouslySetInnerHTML={{__html: `
                  .polygon-shape { clip-path: polygon(10% 10%, 90% 20%, 80% 90%, 20% 80%); width: 150px; height: 120px; display: flex; align-items: center; justify-content: center; }
                `}} />
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Lineage Timeline */}
          <div className="lg:col-span-7 bg-surface-dark border border-border-color rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6 border-b border-border-color pb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-accent-blue" size={24} />
                <h2 className="text-xl font-serif font-bold">Immutable Ledger</h2>
              </div>
              <div className="text-sm text-text-secondary">
                {events.length} Historical Records
              </div>
            </div>
            
            <div className="pl-4">
              <Timeline events={events} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
