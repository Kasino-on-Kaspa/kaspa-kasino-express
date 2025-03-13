// Currency constants
// 10^8 SOMPI = 1 KAS

// Utility functions for currency conversion
export function kasToSompi(kas: string): bigint {
  return BigInt(Math.floor(parseFloat(kas) * 100000000));
}

export function sompiToKas(sompi: bigint): string {
  return (Number(sompi) / 100000000).toFixed(8);
}

// Format a SOMPI amount for display (as KAS with 8 decimal places)
export function formatBalance(sompiAmount: bigint): string {
  return (Number(sompiAmount) / 100000000).toFixed(8);
} 