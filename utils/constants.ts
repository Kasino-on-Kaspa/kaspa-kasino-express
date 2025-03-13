// Currency constants
export const SOMPI_PER_KAS = 100000000; // 10^8 SOMPI = 1 KAS

// Utility functions for currency conversion
export function kasToSompi(kas: number): number {
  return Math.floor(kas * SOMPI_PER_KAS);
}

export function sompiToKas(sompi: number): number {
  return sompi / SOMPI_PER_KAS;
}

// Format a SOMPI amount for display (as KAS with 8 decimal places)
export function formatBalance(sompiAmount: number): string {
  return (sompiAmount / SOMPI_PER_KAS).toFixed(8);
} 