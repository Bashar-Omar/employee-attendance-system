export const OFFICE_LOCATION = {
  latitude: 30.128244,
  longitude: 31.374352,
  maxDistance: 200, // meters
}

/**
 * Calculates the distance between two coordinates in meters using the Haversine formula.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export function isWithinOffice(lat: number, lon: number): boolean {
  const distance = calculateDistance(
    lat,
    lon,
    OFFICE_LOCATION.latitude,
    OFFICE_LOCATION.longitude
  )
  return distance <= OFFICE_LOCATION.maxDistance
}

export function getLocationStatus(lat: number, lon: number): { status: "INSIDE" | "OUTSIDE"; distance: number } {
  const distance = calculateDistance(
    lat,
    lon,
    OFFICE_LOCATION.latitude,
    OFFICE_LOCATION.longitude
  )
  return {
    status: distance <= OFFICE_LOCATION.maxDistance ? "INSIDE" : "OUTSIDE",
    distance: Math.round(distance), // Round to nearest meter
  }
}
