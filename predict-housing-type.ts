import fetch from "cross-fetch";

type _HousingType = "RENT_STABILIZED" | "NYCHA" | "MARKET_RATE";

export type HousingType = _HousingType | "INVALID" | "ERROR";

export const HOUSING_TYPES = new Set<HousingType>([
  "RENT_STABILIZED",
  "NYCHA",
  "MARKET_RATE",
  "INVALID",
  "ERROR",
]);

// This is a partial typing of https://demo.justfix.nyc/nycx/.
type PredictResult = {
  result?: {
    predicted_housing_type: null | _HousingType;
  } | null;
};

export function validateHousingType(value: string): HousingType {
  if (HOUSING_TYPES.has(value as HousingType)) {
    return value as HousingType;
  }
  throw new Error(`"${value}" is not a valid housing type result`);
}

export async function predictHousingType(
  address: string
): Promise<HousingType> {
  if (!address.trim()) return "INVALID";

  const search = new URLSearchParams();
  search.set("text", address);

  try {
    const res = await fetch(`https://demo.justfix.nyc/nycx/address?${search}`);
    if (!res.ok) {
      // TODO: Log the error.
      return "ERROR";
    }

    const json: PredictResult = await res.json();

    if (!json.result) {
      return "INVALID";
    }

    if (!json.result.predicted_housing_type) {
      // The API can't tell what our housing type is; for now we'll just
      // treat it as being market rate.
      return "MARKET_RATE";
    }
    return json.result.predicted_housing_type;
  } catch (e) {
    console.error(e);
    return "ERROR";
  }
}
