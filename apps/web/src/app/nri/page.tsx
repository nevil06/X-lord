"use client";

import React, { useState, useEffect } from 'react';
import { Globe, Bell, Lock, Unlock, Users, Settings, AlertTriangle, ShieldCheck, FileClock, Smartphone, Mail, Map as MapIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = '/api/backend';

export default function NriDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nriOwner, setNriOwner] = useState<any>(null);
  const [parcels, setParcels] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [pendingMutations, setPendingMutations] = useState<any[]>([]);
  const [freezeProcessing, setFreezeProcessing] = useState<string | null>(null);

  useEffect(() => {
    const fetchNriData = async () => {
      try {
        // Find Anjali Desai from all parcels (since UUID is dynamic)
        const allParcelsRes = await fetch(`${API_BASE}/parcels/all`);
        const allParcelsData = await allParcelsRes.json();
        
        // Find the parcel owned by NRI
        const nriParcel = allParcelsData.parcels.find((p: any) => p.current_owner?.isNri);
        
        if (nriParcel && nriParcel.current_owner) {
          setNriOwner(nriParcel.current_owner);
          
          // Fetch alerts for this owner
          const alertsRes = await fetch(`${API_BASE}/nri/${nriParcel.current_owner.id}/alerts`);
          const alertsData = await alertsRes.json();
          
          setParcels(alertsData.parcels || []);
          setAlerts(alertsData.alerts || []);
          setPendingMutations(alertsData.pendingMutations || []);
        }
      } catch (err) {
        console.error("Failed to fetch NRI data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNriData();
  }, []);

  const toggleFreeze = async (parcelId: string, isFrozen: boolean) => {
    setFreezeProcessing(parcelId);
    try {
      if (isFrozen) {
        // Unfreeze
        await fetch(`${API_BASE}/court/unfreeze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parcelId,
            courtOrderNumber: 'OWNER-LIFT-' + Date.now(),
            resolutionSummary: 'NRI Owner voluntarily lifted freeze',
            officialId: 'NRI-SELF'
          })
        });
      } else {
        // Freeze
        await fetch(`${API_BASE}/court/freeze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parcelId,
            courtOrderNumber: 'OWNER-FREEZE-' + Date.now(),
            reason: 'Voluntary NRI Owner Freeze Protection',
            officialId: 'NRI-SELF'
          })
        });
      }
      
      // Refresh page data
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setFreezeProcessing(null);
    }
  };

  const simulateAlert = () => {
    alert("Simulated: SMS and WhatsApp sent to +1 415-555-1234 regarding an unauthorized boundary mutation attempt.");
  };

  if (loading) {
    return <div className="min-h-screen bg-primary-navy flex items-center justify-center text-text-primary">Loading NRI Profile...</div>;
  }

  if (!nriOwner) {
    return <div className="min-h-screen bg-primary-navy flex items-center justify-center text-text-primary">NRI Demo Owner not found in database.</div>;
  }

  // Combine alerts and mutations for the timeline
  const timelineEvents = [
    ...alerts.map(a => ({ type: 'FRAUD_FLAG', date: a.createdAt, desc: a.explanation, risk: a.riskScore })),
    ...pendingMutations.map(m => ({ type: 'MUTATION', date: m.createdAt, desc: `Pending ${m.mutationType} mutation request`, risk: 0 })),
    // Mock tax event for demo
    { type: 'TAX_DUE', date: new Date(Date.now() - 86400000 * 5).toISOString(), desc: 'Property tax due for current fiscal year', risk: 0 }
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-primary-navy text-text-primary font-sans">
      {/* Header */}
      <header className="bg-surface-dark border-b border-border-color py-4 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Globe className="text-accent-blue" size={28} />
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-text-primary">NRI Land Protection Portal</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-verified-green animate-pulse"></span>
              <span className="text-xs text-text-secondary uppercase font-bold tracking-wider">Live System Connected</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 bg-surface-mid hover:bg-surface-light border border-border-color rounded-full transition-colors">
            <Bell size={18} />
            {(alerts.length > 0 || pendingMutations.length > 0) && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-frozen-red rounded-full ring-2 ring-surface-dark"></span>
            )}
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-border-color">
            <div className="text-right">
              <div className="text-sm font-bold text-text-primary">{nriOwner.fullName}</div>
              <div className="text-xs text-text-secondary">{nriOwner.country}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-mid border-2 border-border-color flex items-center justify-center font-bold text-accent-blue">
              {nriOwner.fullName.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Profile & Caretaker */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Profile Card */}
          <div className="bg-surface-dark border border-border-color rounded-xl overflow-hidden shadow-xl">
            <div className="h-24 bg-gradient-to-r from-surface-mid to-surface-dark relative">
              <div className="absolute top-4 right-4 text-4xl">🇺🇸</div>
            </div>
            <div className="p-6 pt-0 relative">
              <div className="w-20 h-20 rounded-full border-4 border-surface-dark bg-surface-mid flex items-center justify-center font-serif text-3xl font-bold text-text-primary absolute -top-10">
                {nriOwner.fullName.charAt(0)}
              </div>
              <div className="mt-12">
                <h2 className="text-xl font-bold font-serif">{nriOwner.fullName}</h2>
                <p className="text-text-secondary text-sm">Overseas Citizen of India</p>
                
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border-color pb-2">
                    <span className="text-text-secondary">OCI Number</span>
                    <span className="font-mono">{nriOwner.ociNumber || 'OCI-9283746'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border-color pb-2">
                    <span className="text-text-secondary">Primary Contact</span>
                    <span>{nriOwner.phone || '+1 415-555-1234'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border-color pb-2">
                    <span className="text-text-secondary">Email</span>
                    <span>{nriOwner.email || 'anjali.d@example.com'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Notifications Panel */}
          <div className="bg-surface-dark border border-border-color rounded-xl p-6 shadow-xl">
            <h3 className="font-bold font-serif mb-4 flex items-center gap-2">
              <Smartphone size={18} className="text-accent-blue"/> Alert Channels
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-surface-mid rounded border border-border-color">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#25D366]/20 text-[#25D366] flex items-center justify-center">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-bold">WhatsApp Alerts</div>
                    <div className="text-xs text-text-secondary">Active to +1 415***</div>
                  </div>
                </div>
                <ShieldCheck size={18} className="text-verified-green" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-surface-mid rounded border border-border-color">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-accent-blue/20 text-accent-blue flex items-center justify-center">
                    <Mail size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Email Notifications</div>
                    <div className="text-xs text-text-secondary">anjali.d@ex***</div>
                  </div>
                </div>
                <ShieldCheck size={18} className="text-verified-green" />
              </div>

              <button 
                onClick={simulateAlert}
                className="w-full mt-2 py-2 border border-border-color bg-surface-mid hover:bg-surface-light rounded text-sm font-medium transition-colors"
              >
                Simulate Encroachment Alert
              </button>
            </div>
          </div>

          {/* Caretaker Management */}
          <div className="bg-surface-dark border border-border-color rounded-xl p-6 shadow-xl">
            <h3 className="font-bold font-serif mb-4 flex items-center gap-2">
              <Users size={18} className="text-accent-blue"/> Local Representative
            </h3>
            <div className="p-4 border border-border-color border-dashed rounded bg-surface-mid/50 text-center">
              <p className="text-sm text-text-secondary mb-3">No active local representative appointed.</p>
              <button className="text-sm text-accent-blue hover:text-blue-400 font-medium transition-colors">
                + Appoint Registered Caretaker
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Parcels & Alerts */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Parcels Grid */}
          <div className="bg-surface-dark border border-border-color rounded-xl p-6 shadow-xl">
            <h2 className="text-2xl font-serif font-bold mb-6">My Properties</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parcels.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-text-secondary bg-surface-mid rounded border border-border-color">
                  No properties found under this profile.
                </div>
              ) : parcels.map((parcel: any) => {
                const isFrozen = parcel.status === 'FROZEN';
                return (
                  <div key={parcel.id} className="border border-border-color rounded-lg bg-surface-mid overflow-hidden hover:border-accent-blue/50 transition-colors">
                    <div className="p-5 border-b border-border-color relative">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono font-bold text-accent-blue cursor-pointer hover:underline" onClick={() => router.push(`/lineage/${parcel.land_uid}`)}>
                          {parcel.land_uid}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          isFrozen ? 'bg-frozen-red/20 text-frozen-red' :
                          parcel.status === 'VERIFIED' ? 'bg-verified-green/20 text-verified-green' :
                          'bg-surface-light text-text-secondary'
                        }`}>
                          {parcel.status}
                        </span>
                      </div>
                      <div className="text-sm text-text-secondary flex justify-between">
                        <span>Survey: {parcel.survey_number}</span>
                        <span>{parcel.area_sqm} sqm</span>
                      </div>
                      <div className="text-sm text-text-secondary mt-1">Village: {parcel.village}</div>
                    </div>
                    
                    <div className="bg-surface-dark px-5 py-3 flex justify-between items-center">
                      <button 
                        disabled={true}
                        title="Self-Freeze protection is view-only on NRI portal. Enforcable by Sub-Registrar / Collector."
                        className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium bg-surface-mid text-text-secondary border border-border-color cursor-not-allowed"
                      >
                        {isFrozen ? <><Lock size={12} /> Legally Frozen</> : <><Unlock size={12} /> Active & Secured</>}
                      </button>
                      <button 
                        onClick={() => router.push(`/lineage/${parcel.land_uid}`)}
                        className="text-xs text-text-secondary hover:text-accent-blue transition-colors flex items-center gap-1"
                      >
                        <MapIcon size={12} /> View Map
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-surface-dark border border-border-color rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
              <FileClock size={20} className="text-accent-blue" /> Protection Feed
            </h2>
            
            {timelineEvents.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">No recent activity on your parcels.</div>
            ) : (
              <div className="space-y-4">
                {timelineEvents.map((event, i) => (
                  <div key={i} className="flex gap-4 p-4 border border-border-color rounded-lg bg-surface-mid">
                    <div className={`mt-1 flex-shrink-0 ${
                      event.type === 'FRAUD_FLAG' ? 'text-frozen-red' : 
                      event.type === 'MUTATION' ? 'text-pending-amber' : 
                      'text-accent-blue'
                    }`}>
                      {event.type === 'FRAUD_FLAG' ? <AlertTriangle size={20} /> : 
                       event.type === 'MUTATION' ? <FileClock size={20} /> : 
                       <Bell size={20} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm">
                          {event.type === 'FRAUD_FLAG' ? 'Security Alert Triggered' : 
                           event.type === 'MUTATION' ? 'Mutation Request' : 
                           'Account Notification'}
                        </h4>
                        <span className="text-xs text-text-secondary">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{event.desc}</p>
                      {event.risk > 0 && (
                        <div className="mt-2 text-xs font-mono text-frozen-red bg-frozen-red/10 px-2 py-1 rounded inline-block">
                          AI Risk Score: {event.risk}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
