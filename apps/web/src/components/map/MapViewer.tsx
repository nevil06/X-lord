"use client";

import React, { useState, useEffect } from 'react';
import Map, { Source, Layer, FillLayer, Popup } from 'react-map-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

interface MapViewerProps {
  parcels: any[];
  selectedParcel?: any;
  onSelectParcel?: (parcel: any) => void;
}

export default function MapViewer({ parcels, selectedParcel, onSelectParcel }: MapViewerProps) {
  const [viewState, setViewState] = useState({
    longitude: 77.5946,
    latitude: 12.9716,
    zoom: 14
  });

  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [popupInfo, setPopupInfo] = useState<any>(null);

  useEffect(() => {
    if (parcels && parcels.length > 0) {
      const features = parcels
        .filter(p => p.boundary_geojson)
        .map(p => ({
          type: 'Feature',
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

      setGeoJsonData({
        type: 'FeatureCollection',
        features
      });
      
      // Auto-center map on first parcel
      if (features.length > 0 && features[0].geometry?.coordinates?.[0]?.[0]) {
        const firstCoord = features[0].geometry.coordinates[0][0];
        if (firstCoord && firstCoord.length === 2) {
          setViewState(prev => ({
            ...prev,
            longitude: firstCoord[0],
            latitude: firstCoord[1]
          }));
        }
      }
    } else {
      setGeoJsonData(null);
    }
  }, [parcels]);

  // Pan to selected parcel
  useEffect(() => {
    if (selectedParcel?.boundary_geojson) {
      try {
        const geo = typeof selectedParcel.boundary_geojson === 'string' 
          ? JSON.parse(selectedParcel.boundary_geojson) 
          : selectedParcel.boundary_geojson;
        const coord = geo.coordinates?.[0]?.[0];
        if (coord) {
          setViewState(prev => ({ ...prev, longitude: coord[0], latitude: coord[1], zoom: 16 }));
          setPopupInfo({
            longitude: coord[0],
            latitude: coord[1],
            landUid: selectedParcel.land_uid,
            status: selectedParcel.status,
            surveyNumber: selectedParcel.survey_number,
            village: selectedParcel.village
          });
        }
      } catch {}
    }
  }, [selectedParcel]);

  const polygonLayer: FillLayer = {
    id: 'parcel-polygons',
    type: 'fill',
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
  };

  const lineLayer = {
    id: 'parcel-lines',
    type: 'line',
    paint: {
      'line-color': '#E8ECF1',
      'line-width': 1.5
    }
  };

  return (
    <div className="w-full h-full min-h-[500px] rounded-lg overflow-hidden border border-border-color shadow-lg relative">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={MAP_STYLE}
        mapLib={maplibregl}
        interactiveLayerIds={['parcel-polygons']}
        onClick={(e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const props = feature.properties;
            // Find the matching parcel from our data
            const match = parcels.find(p => p.land_uid === props?.landUid);
            if (match && onSelectParcel) {
              onSelectParcel(match);
            }
            if (feature.geometry.type === 'Polygon') {
              const coord = (feature.geometry as any).coordinates[0][0];
              setPopupInfo({
                longitude: coord[0],
                latitude: coord[1],
                landUid: props?.landUid,
                status: props?.status,
                surveyNumber: props?.surveyNumber,
                village: props?.village
              });
            }
          }
        }}
      >
        {geoJsonData && (
          <Source id="parcels" type="geojson" data={geoJsonData}>
            <Layer {...(polygonLayer as any)} />
            <Layer {...(lineLayer as any)} />
          </Source>
        )}

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            closeOnClick={false}
            onClose={() => setPopupInfo(null)}
            anchor="bottom"
          >
            <div className="bg-surface-dark text-text-primary p-3 rounded min-w-[200px]">
              <div className="font-mono text-sm font-bold text-accent-blue mb-1">{popupInfo.landUid}</div>
              <div className="text-xs text-text-secondary mb-1">Survey: {popupInfo.surveyNumber}</div>
              {popupInfo.village && <div className="text-xs text-text-secondary mb-2">Village: {popupInfo.village}</div>}
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                popupInfo.status === 'VERIFIED' ? 'bg-verified-green/20 text-verified-green' :
                popupInfo.status === 'PENDING' ? 'bg-pending-amber/20 text-pending-amber' :
                popupInfo.status === 'FROZEN' ? 'bg-frozen-red/20 text-frozen-red' :
                'bg-surface-light text-text-secondary'
              }`}>
                {popupInfo.status}
              </span>
            </div>
          </Popup>
        )}
      </Map>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-surface-dark/90 backdrop-blur-sm p-4 rounded border border-border-color shadow-xl text-sm">
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
