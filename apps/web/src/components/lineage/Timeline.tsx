"use client";

import React from 'react';
import { FileText, ArrowRight, ShieldCheck, AlertCircle, Link } from 'lucide-react';

interface TimelineEvent {
  id: string;
  eventType: string;
  eventDate: string;
  fromOwner?: { fullName: string };
  toOwner?: { fullName: string };
  blockRef?: string;
  verifierId?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  if (!events || events.length === 0) {
    return <div className="p-4 text-text-secondary">No lineage history available.</div>;
  }

  return (
    <div className="relative border-l-2 border-border-color ml-4 mt-6">
      {events.map((event, index) => {
        const isTransfer = event.eventType === 'TRANSFER' || event.eventType === 'SALE';
        const isDispute = event.eventType === 'DISPUTE' || event.eventType === 'FREEZE';
        const isGenesis = event.eventType === 'GRANT' || event.eventType === 'REGISTRATION';

        return (
          <div key={event.id} className="mb-8 ml-6 relative">
            {/* Timeline Dot */}
            <span className={`absolute -left-9 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-surface-dark ${
              isDispute ? 'bg-frozen-red' : isGenesis ? 'bg-accent-blue' : 'bg-verified-green'
            }`}>
              {isDispute ? <AlertCircle size={12} className="text-white" /> : <ShieldCheck size={12} className="text-white" />}
            </span>

            <div className="bg-surface-mid p-4 rounded-lg border border-border-color shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-text-primary uppercase tracking-wide text-sm">{event.eventType}</h3>
                <time className="text-xs text-text-secondary">
                  {new Date(event.eventDate).toLocaleDateString()}
                </time>
              </div>

              {isTransfer && event.fromOwner && event.toOwner && (
                <div className="flex items-center gap-2 text-sm text-text-primary mb-3 bg-surface-dark p-2 rounded">
                  <span>{event.fromOwner.fullName}</span>
                  <ArrowRight size={14} className="text-text-secondary" />
                  <span className="font-bold">{event.toOwner.fullName}</span>
                </div>
              )}

              {event.blockRef && (
                <div className="mt-3 pt-3 border-t border-border-color flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-text-secondary">
                    <FileText size={12} />
                    <span>Verified by: {event.verifierId || 'System'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-accent-blue bg-accent-blue/10 px-2 py-1 rounded cursor-pointer hover:bg-accent-blue/20">
                    <Link size={12} />
                    <span className="font-mono">Block #{event.blockRef}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
