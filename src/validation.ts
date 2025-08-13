// src/validation.ts
export type Units = "metric" | "imperial";

export type NormalizedInputs = {
  weightKg: number;
  heightM: number;
  inputsEcho: Record<string, number | string>;
};

const LIMITS = {
  metric: {
    minWeightKg: 20,
    maxWeightKg: 300,
    minHeightCm: 100,
    maxHeightCm: 250,
  },
  imperial: {
    minWeightLb: 44,
    maxWeightLb: 660,
    minHeightIn: 39,
    maxHeightIn: 98,
  },
};

export function parseQuery(query: URLSearchParams): NormalizedInputs {
  // metric: weight_kg, height_cm
  // imperial: weight_lb, height_in
  const weightKgStr = query.get("weight_kg");
  const heightCmStr = query.get("height_cm");
  const weightLbStr = query.get("weight_lb");
  const heightInStr = query.get("height_in");

  if (weightKgStr && heightCmStr) {
    const weightKg = toNumber(weightKgStr, "weight_kg");
    const heightCm = toNumber(heightCmStr, "height_cm");
    validateMetric(weightKg, heightCm);
    return {
      weightKg,
      heightM: heightCm / 100,
      inputsEcho: { weight_kg: weightKg, height_cm: heightCm, units: "metric" },
    };
  }

  if (weightLbStr && heightInStr) {
    const weightLb = toNumber(weightLbStr, "weight_lb");
    const heightIn = toNumber(heightInStr, "height_in");
    validateImperial(weightLb, heightIn);
    const weightKg = weightLb * 0.45359237;
    const heightM = (heightIn * 2.54) / 100;
    return {
      weightKg: round2(weightKg),
      heightM: round2(heightM),
      inputsEcho: { weight_lb: weightLb, height_in: heightIn, units: "imperial" },
    };
  }

  throw badRequest("Provide either (weight_kg,height_cm) or (weight_lb,height_in)");
}

export async function parseBody(req: Request): Promise<NormalizedInputs> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    throw badRequest("Invalid JSON body");
  }
  const { weight, height, units } = body || {};
  if (units !== "metric" && units !== "imperial") {
    throw badRequest('Missing/invalid "units": "metric" | "imperial"');
  }
  if (typeof weight !== "number" || typeof height !== "number") {
    throw badRequest('"weight" and "height" must be numbers');
  }

  if (units === "metric") {
    validateMetric(weight, height);
    return {
      weightKg: weight,
      heightM: height / 100,
      inputsEcho: { weight_kg: weight, height_cm: height, units },
    };
  } else {
    validateImperial(weight, height);
    const weightKg = weight * 0.45359237;
    const heightM = (height * 2.54) / 100;
    return {
      weightKg: round2(weightKg),
      heightM: round2(heightM),
      inputsEcho: { weight_lb: weight, height_in: height, units },
    };
  }
}

function validateMetric(weightKg: number, heightCm: number) {
  const L = LIMITS.metric;
  if (!isFinite(weightKg) || !isFinite(heightCm)) throw badRequest("Inputs must be finite numbers");
  if (weightKg < L.minWeightKg || weightKg > L.maxWeightKg)
    throw badRequest(`weight_kg must be between ${L.minWeightKg} and ${L.maxWeightKg}`);
  if (heightCm < L.minHeightCm || heightCm > L.maxHeightCm)
    throw badRequest(`height_cm must be between ${L.minHeightCm} and ${L.maxHeightCm}`);
}

function validateImperial(weightLb: number, heightIn: number) {
  const L = LIMITS.imperial;
  if (!isFinite(weightLb) || !isFinite(heightIn)) throw badRequest("Inputs must be finite numbers");
  if (weightLb < L.minWeightLb || weightLb > L.maxWeightLb)
    throw badRequest(`weight_lb must be between ${L.minWeightLb} and ${L.maxWeightLb}`);
  if (heightIn < L.minHeightIn || heightIn > L.maxHeightIn)
    throw badRequest(`height_in must be between ${L.minHeightIn} and ${L.maxHeightIn}`);
}

function toNumber(s: string, name: string): number {
  const n = Number(s);
  if (!isFinite(n)) throw badRequest(`${name} must be a number`);
  return n;
}

function badRequest(msg: string): Error {
  // We’ll catch and map to 400 in route handlers
  const e = new Error(msg);
  // @ts-ignore mark
  e.status = 400;
  return e;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}