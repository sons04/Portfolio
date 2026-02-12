import * as THREE from "three";

export function latLonToVector3(lat: number, lon: number, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export function vector3ToLatLon(point: THREE.Vector3) {
  const p = point.clone().normalize();
  const lat = 90 - (Math.acos(p.y) * 180) / Math.PI;
  const lon = ((Math.atan2(p.z, -p.x) * 180) / Math.PI) - 180;
  // Normalize lon into [-180, 180]
  const lonNorm = ((lon + 540) % 360) - 180;
  return { lat, lon: lonNorm };
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

