/**
 * Body Fat Percentage Calculation Protocols
 * 
 * Implements scientific protocols for body fat estimation using skinfold measurements:
 * - Pollock 3-site (Men & Women)
 * - Pollock 7-site (Men & Women)
 * - Guedes (Men & Women)
 */

export type Gender = 'male' | 'female';
export type Protocol = 'pollock3' | 'pollock7' | 'guedes';

export interface SkinfoldData {
  // Pollock 3 - Male: chest, abdominal, thigh
  // Pollock 3 - Female: triceps, suprailiac, thigh
  triceps?: number;
  chest?: number;
  abdominal?: number;
  suprailiac?: number;
  thigh?: number;
  
  // Additional for Pollock 7
  subscapular?: number;
  axillary?: number;
  
  // For Guedes - uses triceps, suprailiac, abdominal (male) or triceps, suprailiac, thigh (female)
}

export interface CalculationResult {
  bodyDensity: number;
  bodyFatPercentage: number;
  leanMass: number;
  fatMass: number;
  protocol: string;
}

/**
 * Converts body density to body fat percentage using Siri equation
 * %Fat = (495 / Density) - 450
 */
function densityToBodyFat(density: number): number {
  return (495 / density) - 450;
}

/**
 * Pollock 3-Site Protocol for Men
 * Sites: Chest, Abdominal, Thigh
 * DC = 1.10938 - 0.0008267(X) + 0.0000016(X²) - 0.0002574(Age)
 * where X = sum of 3 skinfolds
 */
function pollock3Male(chest: number, abdominal: number, thigh: number, age: number): number {
  const sum = chest + abdominal + thigh;
  return 1.10938 - (0.0008267 * sum) + (0.0000016 * sum * sum) - (0.0002574 * age);
}

/**
 * Pollock 3-Site Protocol for Women
 * Sites: Triceps, Suprailiac, Thigh
 * DC = 1.0994921 - 0.0009929(X) + 0.0000023(X²) - 0.0001392(Age)
 * where X = sum of 3 skinfolds
 */
function pollock3Female(triceps: number, suprailiac: number, thigh: number, age: number): number {
  const sum = triceps + suprailiac + thigh;
  return 1.0994921 - (0.0009929 * sum) + (0.0000023 * sum * sum) - (0.0001392 * age);
}

/**
 * Pollock 7-Site Protocol for Men
 * Sites: Chest, Axillary, Triceps, Subscapular, Abdominal, Suprailiac, Thigh
 * DC = 1.112 - 0.00043499(X) + 0.00000055(X²) - 0.00028826(Age)
 */
function pollock7Male(
  chest: number, axillary: number, triceps: number, subscapular: number,
  abdominal: number, suprailiac: number, thigh: number, age: number
): number {
  const sum = chest + axillary + triceps + subscapular + abdominal + suprailiac + thigh;
  return 1.112 - (0.00043499 * sum) + (0.00000055 * sum * sum) - (0.00028826 * age);
}

/**
 * Pollock 7-Site Protocol for Women
 * DC = 1.097 - 0.00046971(X) + 0.00000056(X²) - 0.00012828(Age)
 */
function pollock7Female(
  chest: number, axillary: number, triceps: number, subscapular: number,
  abdominal: number, suprailiac: number, thigh: number, age: number
): number {
  const sum = chest + axillary + triceps + subscapular + abdominal + suprailiac + thigh;
  return 1.097 - (0.00046971 * sum) + (0.00000056 * sum * sum) - (0.00012828 * age);
}

/**
 * Guedes Protocol for Men (Brazilian population)
 * Sites: Triceps, Suprailiac, Abdominal
 * DC = 1.17136 - 0.06706 * log10(X)
 */
function guedesMale(triceps: number, suprailiac: number, abdominal: number): number {
  const sum = triceps + suprailiac + abdominal;
  return 1.17136 - (0.06706 * Math.log10(sum));
}

/**
 * Guedes Protocol for Women (Brazilian population)
 * Sites: Triceps, Suprailiac, Thigh
 * DC = 1.1665 - 0.07063 * log10(X)
 */
function guedesFemale(triceps: number, suprailiac: number, thigh: number): number {
  const sum = triceps + suprailiac + thigh;
  return 1.1665 - (0.07063 * Math.log10(sum));
}

/**
 * Calculate body fat percentage using the specified protocol
 */
export function calculateBodyFat(
  protocol: Protocol,
  gender: Gender,
  age: number,
  weight: number,
  skinfolds: SkinfoldData
): CalculationResult | null {
  let density: number;
  let protocolName: string;

  try {
    switch (protocol) {
      case 'pollock3':
        if (gender === 'male') {
          if (!skinfolds.chest || !skinfolds.abdominal || !skinfolds.thigh) return null;
          density = pollock3Male(skinfolds.chest, skinfolds.abdominal, skinfolds.thigh, age);
          protocolName = 'Pollock 3 Dobras (Masculino)';
        } else {
          if (!skinfolds.triceps || !skinfolds.suprailiac || !skinfolds.thigh) return null;
          density = pollock3Female(skinfolds.triceps, skinfolds.suprailiac, skinfolds.thigh, age);
          protocolName = 'Pollock 3 Dobras (Feminino)';
        }
        break;

      case 'pollock7':
        if (!skinfolds.chest || !skinfolds.axillary || !skinfolds.triceps ||
            !skinfolds.subscapular || !skinfolds.abdominal || !skinfolds.suprailiac || !skinfolds.thigh) {
          return null;
        }
        if (gender === 'male') {
          density = pollock7Male(
            skinfolds.chest, skinfolds.axillary, skinfolds.triceps, skinfolds.subscapular,
            skinfolds.abdominal, skinfolds.suprailiac, skinfolds.thigh, age
          );
          protocolName = 'Pollock 7 Dobras (Masculino)';
        } else {
          density = pollock7Female(
            skinfolds.chest, skinfolds.axillary, skinfolds.triceps, skinfolds.subscapular,
            skinfolds.abdominal, skinfolds.suprailiac, skinfolds.thigh, age
          );
          protocolName = 'Pollock 7 Dobras (Feminino)';
        }
        break;

      case 'guedes':
        if (gender === 'male') {
          if (!skinfolds.triceps || !skinfolds.suprailiac || !skinfolds.abdominal) return null;
          density = guedesMale(skinfolds.triceps, skinfolds.suprailiac, skinfolds.abdominal);
          protocolName = 'Guedes (Masculino)';
        } else {
          if (!skinfolds.triceps || !skinfolds.suprailiac || !skinfolds.thigh) return null;
          density = guedesFemale(skinfolds.triceps, skinfolds.suprailiac, skinfolds.thigh);
          protocolName = 'Guedes (Feminino)';
        }
        break;

      default:
        return null;
    }

    const bodyFatPercentage = densityToBodyFat(density);
    const fatMass = (bodyFatPercentage / 100) * weight;
    const leanMass = weight - fatMass;

    return {
      bodyDensity: Number(density.toFixed(5)),
      bodyFatPercentage: Number(bodyFatPercentage.toFixed(1)),
      leanMass: Number(leanMass.toFixed(1)),
      fatMass: Number(fatMass.toFixed(1)),
      protocol: protocolName,
    };
  } catch (error) {
    console.error('Error calculating body fat:', error);
    return null;
  }
}

/**
 * Get required skinfold sites for a protocol and gender
 */
export function getRequiredSkinfolds(protocol: Protocol, gender: Gender): string[] {
  switch (protocol) {
    case 'pollock3':
      return gender === 'male' 
        ? ['chest', 'abdominal', 'thigh']
        : ['triceps', 'suprailiac', 'thigh'];
    case 'pollock7':
      return ['chest', 'axillary', 'triceps', 'subscapular', 'abdominal', 'suprailiac', 'thigh'];
    case 'guedes':
      return gender === 'male'
        ? ['triceps', 'suprailiac', 'abdominal']
        : ['triceps', 'suprailiac', 'thigh'];
    default:
      return [];
  }
}

/**
 * Labels for skinfold sites in Portuguese
 */
export const skinfoldLabels: Record<string, string> = {
  triceps: 'Tríceps',
  chest: 'Peitoral',
  abdominal: 'Abdominal',
  suprailiac: 'Suprailíaca',
  thigh: 'Coxa',
  subscapular: 'Subescapular',
  axillary: 'Axilar Média',
};

/**
 * Get body fat classification based on percentage and gender
 */
export function getBodyFatClassification(percentage: number, gender: Gender): {
  classification: string;
  color: string;
} {
  if (gender === 'male') {
    if (percentage < 6) return { classification: 'Essencial', color: 'text-blue-500' };
    if (percentage < 14) return { classification: 'Atleta', color: 'text-emerald-500' };
    if (percentage < 18) return { classification: 'Fitness', color: 'text-green-500' };
    if (percentage < 25) return { classification: 'Aceitável', color: 'text-yellow-500' };
    return { classification: 'Obesidade', color: 'text-red-500' };
  } else {
    if (percentage < 14) return { classification: 'Essencial', color: 'text-blue-500' };
    if (percentage < 21) return { classification: 'Atleta', color: 'text-emerald-500' };
    if (percentage < 25) return { classification: 'Fitness', color: 'text-green-500' };
    if (percentage < 32) return { classification: 'Aceitável', color: 'text-yellow-500' };
    return { classification: 'Obesidade', color: 'text-red-500' };
  }
}
