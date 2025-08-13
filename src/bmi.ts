// src/bmi.ts
export function toMetersFromCm(heightCm: number): number {
    return heightCm / 100;
  }
  
  export function toKgFromLb(weightLb: number): number {
    return weightLb * 0.45359237;
  }
  
  export function toInFromCm(heightCm: number): number {
    return heightCm / 2.54;
  }
  
  export function toLbFromKg(weightKg: number): number {
    return weightKg / 0.45359237;
  }
  
  export function computeBMI(weightKg: number, heightM: number): number {
    const bmi = weightKg / (heightM * heightM);
    return Math.round(bmi * 100) / 100; // 2 decimals
  }
  
  export function categoryFromBMI(bmi: number): "Underweight" | "Normal weight" | "Overweight" | "Obesity" {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obesity";
  }
  
  // Healthy range = BMI 18.5–24.9
  export function healthyWeightRangeKg(heightM: number): [number, number] {
    const min = 18.5 * heightM * heightM;
    const max = 24.9 * heightM * heightM;
    return [round2(min), round2(max)];
  }
  
  function round2(n: number): number {
    return Math.round(n * 100) / 100;
  }