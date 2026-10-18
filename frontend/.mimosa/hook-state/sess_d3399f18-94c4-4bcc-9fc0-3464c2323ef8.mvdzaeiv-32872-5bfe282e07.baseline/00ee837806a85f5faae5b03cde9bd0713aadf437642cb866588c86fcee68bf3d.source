import landService from './landService';

class MapService {
  async getPlotGeometry(parcelId: string) {
    try {
      const geometry = await landService.getGeometry(parcelId);
      return geometry;
    } catch (error) {
      console.error('Error fetching plot geometry:', error);
      throw error;
    }
  }

  getBoundsFromGeometry(geometry: any): [[number, number], [number, number]] | null {
    if (!geometry || !geometry.geometry || !geometry.geometry.coordinates) {
      return null;
    }

    const coordinates = geometry.geometry.coordinates[0];
    if (!coordinates || coordinates.length === 0) {
      return null;
    }

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    coordinates.forEach(([lng, lat]: [number, number]) => {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });

    return [
      [minLat, minLng],
      [maxLat, maxLng],
    ];
  }

  getCenterFromGeometry(geometry: any): [number, number] | null {
    const bounds = this.getBoundsFromGeometry(geometry);
    if (!bounds) return null;

    const [[minLat, minLng], [maxLat, maxLng]] = bounds;
    return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
  }
}

export default new MapService();
