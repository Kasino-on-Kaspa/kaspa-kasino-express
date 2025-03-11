import { Keypair } from "@kcoin/kaspa-web3.js";

export class WalletGenerator {
	public generateKeypair() {
		return Keypair.random()
	}
}