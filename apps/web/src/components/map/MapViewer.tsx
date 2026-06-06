"use client";

import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

interface MapViewerProps {
  parcels: any[];
  selectedParcel?: any;
  onSelectParcel?: (parcel: any) => void;
}

export default function MapViewer({ parcels, selectedParcel, onSelectParcel }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [77.5946, 12.9716],
      zoom: 14
    });

    popup.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      
      if (!map.current) return;

      map.current.addSource('parcels', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.current.addLayer({
        id: 'parcel-polygons',
        type: 'fill',
        source: 'parcels',
        paint: {
          'fill-color': [
            'match',
            ['get', 'status'],
            'VERIFIED', '#0D6E4B',
            'PENDING', '#92400E',
            'FROZEN', '#7C1D1D',
            'DISPUTED', '#6B21A8',
            '#8B95A5'
          ],
          'fill-opacity': 0.65
        }
      });

      map.current.addLayer({
        id: 'parcel-lines',
        type: 'line',
        source: 'parcels',
        paint: {
          'line-color': '#E8ECF1',
          'line-width': 1.5
        }
      });

      map.current.on('click', 'parcel-polygons', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties;
        
        if (onSelectParcel) {
          // Send selection back up
          onSelectParcel({ land_uid: props.landUid });
        }
      });

      map.current.on('mouseenter', 'parcel-polygons', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'parcel-polygons', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update data source when parcels change
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    
    const source = map.current.getSource('parcels') as maplibregl.GeoJSONSource;
    if (source) {
      const features = parcels
        .filter(p => p.boundary_geojson)
        .map(p => ({
          type: 'Feature' as const,
          geometry: typeof p.boundary_geojson === 'string' 
            ? JSON.parse(p.boundary_geojson) 
            : p.boundary_geojson,
          properties: {
            id: p.id,
            landUid: p.land_uid,
            status: p.status,
            surveyNumber: p.survey_number,
            village: p.village || ''
          }
        }));

      source.setData({
        type: 'FeatureCollection' as const,
        features
      });
      
      // Auto-center
      if (features.length > 0 && features[0].geometry?.coordinates?.[0]?.[0]) {
        const firstCoord = features[0].geometry.coordinates[0][0];
        map.current.flyTo({ center: [firstCoord[0], firstCoord[1]], zoom: 14 });
      }
    }
  }, [parcels, mapLoaded]);

  // Handle selected parcel zooming
  useEffect(() => {
    if (!mapLoaded || !map.current || !selectedParcel || !popup.current) return;
    
    try {
      const geo = typeof selectedParcel.boundary_geojson === 'string' 
        ? JSON.parse(selectedParcel.boundary_geojson) 
        : selectedParcel.boundary_geojson;
      const coord = geo.coordinates?.[0]?.[0];
      
      if (coord) {
        map.current.flyTo({ center: [coord[0], coord[1]], zoom: 16 });
        
        const popupHtml = `
          <div style="background:var(--color-surface-dark); color:var(--color-text-primary); padding:12px; border-radius:4px; min-width:200px; border:1px solid var(--color-border-color);">
            <div style="font-family:monospace; font-size:14px; font-weight:bold; color:var(--color-accent-blue); margin-bottom:4px;">${selectedParcel.land_uid}</div>
            <div style="font-size:12px; color:var(--color-text-secondary); margin-bottom:4px;">Survey: ${selectedParcel.survey_number}</div>
            ${selectedParcel.village ? `<div style="font-size:12px; color:var(--color-text-secondary); margin-bottom:8px;">Village: ${selectedParcel.village}</div>` : ''}
            <span style="font-size:12px; font-weight:bold; padding:2px 8px; border-radius:4px; ${
              selectedParcel.status === 'VERIFIED' ? 'background:rgba(13,110,75,0.2); color:var(--color-verified-green); border:1px solid rgba(13,110,75,0.3);' :
              selectedParcel.status === 'PENDING' ? 'background:rgba(146,64,14,0.2); color:var(--color-pending-amber); border:1px solid rgba(146,64,14,0.3);' :
              selectedParcel.status === 'FROZEN' ? 'background:rgba(124,29,29,0.2); color:var(--color-frozen-red); border:1px solid rgba(124,29,29,0.3);' :
              'background:var(--color-surface-mid); color:var(--color-text-secondary); border:1px solid var(--color-border-color);'
            }">${selectedParcel.status}</span>
          </div>
        `;
        
        popup.current.setLngLat([coord[0], coord[1]])
          .setHTML(popupHtml)
          .addTo(map.current);
      }
    } catch (e) {
      console.error(e);
    }
  }, [selectedParcel, mapLoaded]);

  return (
    <div className="w-full h-full min-h-[500px] rounded-lg overflow-hidden border border-border-color shadow-lg relative">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-surface-dark/90 backdrop-blur-sm p-4 rounded border border-border-color shadow-xl text-sm z-10">
        <h4 className="font-serif font-bold text-text-primary mb-2">Parcel Status</h4>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-verified-green rounded-sm"></div> Verified</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-pending-amber rounded-sm"></div> Pending</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-frozen-red rounded-sm"></div> Frozen</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-disputed-purple rounded-sm"></div> Disputed</div>
        </div>
      </div>
    </div>
  );
}
