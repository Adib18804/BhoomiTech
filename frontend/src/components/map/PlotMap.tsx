import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle } from 'lucide-react';
import mapService from '../../services/mapService';

// Fix Leaflet default marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PlotMapProps {
  geometry: any; // GeoJSON
  parcelId: string;
  dag: string;
  khatian: string;
  area: number;
  mouza: string;
}

function FitBounds({ geometry }: { geometry: any }) {
  const map = useMap();

  useEffect(() => {
    if (geometry) {
      const bounds = mapService.getBoundsFromGeometry(geometry);
      if (bounds) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [geometry, map]);

  return null;
}

export default function PlotMap({ geometry, parcelId, dag, khatian, area, mouza }: PlotMapProps) {
  const { t, i18n } = useTranslation();
  const geoJsonRef = useRef<L.GeoJSON>(null);

  const selectedPlotStyle = {
    fillColor: '#22c55e',
    fillOpacity: 0.3,
    color: '#15803d',
    weight: 3,
  };

  const onEachFeature = (_feature: any, layer: L.Layer) => {
    if (layer instanceof L.Path) {
      layer.setStyle(selectedPlotStyle);
    }

    const popupContent = `
      <div class="p-2">
        <p class="font-semibold text-sm">${t('map.selectedPlot')}</p>
        <p class="text-xs mt-1"><strong>${t('verification.landIdentifiers.dag')}:</strong> ${dag}</p>
        <p class="text-xs"><strong>${t('verification.landIdentifiers.khatian')}:</strong> ${khatian}</p>
        <p class="text-xs"><strong>${t('map.area')}:</strong> ${area} decimal</p>
        <p class="text-xs"><strong>${t('verification.landIdentifiers.mouza')}:</strong> ${mouza}</p>
        <p class="text-xs"><strong>${t('map.parcelId')}:</strong> ${parcelId}</p>
      </div>
    `;

    layer.bindPopup(popupContent);
  };

  const center = mapService.getCenterFromGeometry(geometry) || [23.8583, 90.2667];

  return (
    <div className="relative">
      {/* Synthetic Data Warning */}
      <div className="absolute top-3 sm:top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-[calc(100%-1.5rem)] max-w-md bg-yellow-100 border border-yellow-400 rounded-md px-3 py-2 shadow-lg">
        <div className="flex items-center justify-center gap-2 text-center">
          <AlertTriangle className="w-5 h-5 text-yellow-700 flex-shrink-0" />
          <span className={`text-sm font-semibold text-yellow-800 ${i18n.language === 'bn' ? 'font-bengali' : ''}`}>
            {t('map.syntheticData')}
          </span>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={17}
        className="h-[320px] sm:h-[420px] lg:h-[500px] w-full rounded-lg border-2 border-gray-300 overflow-hidden"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geometry && (
          <>
            <GeoJSON
              ref={geoJsonRef}
              data={geometry}
              onEachFeature={onEachFeature}
            />
            <FitBounds geometry={geometry} />
          </>
        )}
      </MapContainer>

      {/* Map Legend */}
      <div className="mt-4 p-4 bg-white border border-gray-200 rounded-md">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">{t('map.title')}</h4>
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          <div className="w-6 h-6 border-2 border-green-700 bg-green-200 rounded"></div>
          <span>{t('map.selectedPlot')}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Demonstration map with synthetic cadastral geometry
        </p>
      </div>
    </div>
  );
}
