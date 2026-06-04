import { describe, expect, it } from "vitest";

import { haversineMeters, pickNearestCourier } from "./proximity";

describe("haversineMeters", () => {
  it("calcula ~1.11 km por 0.01° de latitud", () => {
    const d = haversineMeters({ lat: 4.65, lng: -74.08 }, { lat: 4.66, lng: -74.08 });
    expect(d).toBeGreaterThan(1000);
    expect(d).toBeLessThan(1200);
  });

  it("distancia cero para el mismo punto", () => {
    const d = haversineMeters({ lat: 4.65, lng: -74.08 }, { lat: 4.65, lng: -74.08 });
    expect(d).toBe(0);
  });
});

describe("pickNearestCourier", () => {
  const origin = { lat: 4.65, lng: -74.08 };

  it("elige el repartidor activo más cercano", () => {
    const result = pickNearestCourier(origin, [
      { id: "lejos", lat: 4.7, lng: -74.1, isActive: true },
      { id: "cerca", lat: 4.651, lng: -74.081, isActive: true },
    ]);
    expect(result?.id).toBe("cerca");
  });

  it("ignora repartidores inactivos o sin ubicación", () => {
    const result = pickNearestCourier(origin, [
      { id: "inactivo", lat: 4.651, lng: -74.081, isActive: false },
      { id: "sin-ubic", lat: null, lng: null, isActive: true },
      { id: "valido", lat: 4.66, lng: -74.09, isActive: true },
    ]);
    expect(result?.id).toBe("valido");
  });

  it("devuelve null si no hay candidatos válidos", () => {
    const result = pickNearestCourier(origin, [
      { id: "x", lat: null, lng: null, isActive: true },
    ]);
    expect(result).toBeNull();
  });
});
