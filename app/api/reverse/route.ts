import type { NextRequest } from "next/server";
import { stateCodeFor } from "@/lib/geocode";

type PhotonFeature = {
  properties: {
    name?: string;
    city?: string;
    district?: string;
    county?: string;
    state?: string;
    countrycode?: string;
  };
  geometry: { coordinates: [number, number] };
};

type NominatimResponse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    state?: string;
  };
};

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json({ error: "lat and lon required" }, { status: 400 });
  }

  // Photon reverse (OSM) — good for villages and small towns.
  try {
    const url = new URL("https://photon.komoot.io/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("limit", "1");
    url.searchParams.set("lang", "en");

    const res = await fetch(url, {
      headers: { "User-Agent": "AirMitra/0.1 (hackathon)" },
    });

    if (res.ok) {
      const data = (await res.json()) as { features?: PhotonFeature[] };
      const feature = data.features?.[0];

      if (feature?.properties.countrycode === "IN") {
        const name =
          feature.properties.city ??
          feature.properties.district ??
          feature.properties.name ??
          feature.properties.county;

        if (name) {
          const admin1 = feature.properties.state;
          const stateCode = stateCodeFor({
            admin1,
            latitude: lat,
            longitude: lon,
          });

          return Response.json(
            { name, admin1, stateCode, lat, lon },
            { headers: { "Cache-Control": "public, s-maxage=86400" } },
          );
        }
      }
    }
  } catch {
    /* fall through */
  }

  // Nominatim fallback.
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom", "14");

    const res = await fetch(url, {
      headers: { "User-Agent": "AirMitra/0.1 (hackathon)" },
    });

    if (res.ok) {
      const data = (await res.json()) as NominatimResponse;
      const address = data.address ?? {};
      const name =
        address.city ??
        address.town ??
        address.village ??
        address.suburb ??
        address.county;
      const admin1 = address.state;

      if (name && admin1) {
        const stateCode = stateCodeFor({
          admin1,
          latitude: lat,
          longitude: lon,
        });

        return Response.json(
          { name, admin1, stateCode, lat, lon },
          { headers: { "Cache-Control": "public, s-maxage=86400" } },
        );
      }
    }
  } catch {
    /* fall through */
  }

  return Response.json({ error: "No result" }, { status: 404 });
}
