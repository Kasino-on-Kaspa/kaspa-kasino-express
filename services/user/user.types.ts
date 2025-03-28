export interface User {
  id: string;
  address: string;
  xOnlyPublicKey: string;
  username: string | null;
  wallet: string;
  createdAt: Date;
  referralCode?: string;
  referredBy?: string | null;
}

export interface UpdateUserDto {
  username?: string;
}
