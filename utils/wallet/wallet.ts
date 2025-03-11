import { Keypair, NetworkType } from "@kcoin/kaspa-web3.js";

export class WalletHandler {
	public static generateKeypair() {
		return Keypair.random();
	}

	public static verifyMessage(
		message: string,
		signature: string,
		publicKey: string
	) {
		const kp = Keypair.fromPublicKeyHex(publicKey);
		return kp.verifyMessage(
			new Uint8Array(Buffer.from(signature, "hex")),
			new Uint8Array(Buffer.from(message, "utf-8"))
		);
	}

	public static isAddressOfPubkey(address: string, publicKey: string) {
		const kp = Keypair.fromPublicKeyHex(publicKey);
		return (
			kp
				.toAddress(
					process.env.NETWORK === "kaspa"
						? NetworkType.Mainnet
						: NetworkType.Testnet
				)
				.toString() === address
		);
	}
}
