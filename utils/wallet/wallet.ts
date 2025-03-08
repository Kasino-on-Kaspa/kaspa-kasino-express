import { Keypair, RpcClient } from "@kcoin/kaspa-web3.js";
import { config } from "dotenv";
import { Wallet } from "kaspa-wasm";
config();

interface WalletProviderParams {
	rpc: RpcClient;
	currentHDIndex: number;
}

export class WalletProvider {
	rpc: RpcClient;
	currentHDIndex: number;
    wallet: Wallet;

	constructor(params: WalletProviderParams) {
		this.rpc = params.rpc;
		this.currentHDIndex = params.currentHDIndex;
		this.wallet = new Wallet({});
	}
}
