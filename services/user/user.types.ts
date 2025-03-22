export interface User {
  id: string;
  address: string;
  xOnlyPublicKey: string;
  username: string | null;
  wallet: string;
  balance: bigint;
  createdAt: Date;
  referrelCode?: string;
  referredBy?: string;
}

export interface UpdateUserDto {
  username?: string;
}
