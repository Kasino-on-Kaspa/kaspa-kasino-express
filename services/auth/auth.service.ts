import { NetworkType } from "@kcoin/kaspa-web3.js";
import { sign, verify } from "jsonwebtoken";
// import { verifyMessage } from "kaspa-wasm";
import { WalletHandler } from "../../utils/wallet/wallet";
import { DB } from "../../database";
import { users } from "../../schema/users.schema";
import { eq } from "drizzle-orm";
import { wallets } from "../../schema/wallets.schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Should be in env
const REFRESH_SECRET = process.env.REFRESH_SECRET || "your-refresh-secret-key"; // Should be in env
const JWT_EXPIRY = "15m"; // Short-lived access token
const REFRESH_EXPIRY = "7d"; // Long-lived refresh token

export interface AuthRequest {
	message: string;
	signature: string;
	publicKey: string;
	address: string;
	nonce: string;
	expiry: number;
}

export interface JWTPayload {
	address: string;
	nonce: string;
	expiry: number;
	publicKey: string;
	iat?: number;
	exp?: number;
}

export interface TokenPair {
	accessToken: string;
	refreshToken: string;
}

export class AuthService {
	async verifyKaspaSignature(data: AuthRequest): Promise<boolean> {
		try {
			// TODO: !!! Test impl !!!
			const isVerified = WalletHandler.verifyMessage(
				data.message,
				data.signature,
				data.publicKey
			);

			if (!isVerified) {
				console.error("Signature verification failed");
				return false;
			}
			return true;
		} catch (error) {
			console.error("Error verifying Kaspa signature:", error);
			return false;
		}
	}

	generateTokenPair(payload: Omit<JWTPayload, "iat" | "exp">): TokenPair {
		const accessToken = sign(payload, JWT_SECRET, {
			expiresIn: JWT_EXPIRY,
		});
		const refreshToken = sign(payload, REFRESH_SECRET, {
			expiresIn: REFRESH_EXPIRY,
		});

		return { accessToken, refreshToken };
	}

	verifyToken(token: string): JWTPayload | null {
		try {
			return verify(token, JWT_SECRET) as JWTPayload;
		} catch (error) {
			console.error("Error verifying JWT:", error);
			return null;
		}
	}

	verifyRefreshToken(token: string): JWTPayload | null {
		try {
			return verify(token, REFRESH_SECRET) as JWTPayload;
		} catch (error) {
			console.error("Error verifying refresh token:", error);
			return null;
		}
	}

	refreshAccessToken(refreshToken: string): string | null {
		const payload = this.verifyRefreshToken(refreshToken);
		console.log(payload);
		if (!payload) return null;

		// Generate new access token with the same payload
		const { iat, exp, ...rest } = payload;
		return sign(rest, JWT_SECRET, { expiresIn: JWT_EXPIRY });
	}

	async getUserByAddress(
		address: string
	): Promise<typeof users.$inferSelect | null> {
		const user = await DB.select()
			.from(users)
			.where(eq(users.address, address));

		if (user[0]) {
			return user[0];
		}

		return null;
	}

	async createUser(
		address: string,
		xOnlyPublicKey: string
	): Promise<boolean> {
		const kp = WalletHandler.generateKeypair();

		const newWallet = await DB.insert(wallets)
			.values({
				address: kp
					.toAddress(
						process.env.NETWORK === "kaspa"
							? NetworkType.Mainnet
							: NetworkType.Testnet
					)
					.toString(),
				xOnlyPublicKey: kp.xOnlyPublicKey!,
				privateKey: kp.privateKey!,
			})
			.returning();

		const user = await DB.insert(users).values({
			address: address,
			xOnlyPublicKey: xOnlyPublicKey,
			wallet: newWallet[0].id,
		});

		return true;
	}
}

export const authService = new AuthService();
