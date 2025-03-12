export interface User {
  id: string;
  address: string;
  xOnlyPublicKey: string;
  username: string | null;
  wallet: string;
  balance: number;
  createdAt: Date;
}

export interface UpdateUserDto {
  username?: string;
}
