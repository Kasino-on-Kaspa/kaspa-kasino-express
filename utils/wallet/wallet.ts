const { RPC } = require("@kaspa/grpc-node");
import { initKaspaFramework, Wallet } from "@kaspa/wallet";

interface KaspaWalletProviderParams {
	mnemonic: string;
	rpc: string;
	network: "kaspa" | "kaspadev" | "kaspareg" | "kaspatest" | "kaspasim";
	currentHDIndex: number;
}

class KaspaWalletProvider {
	wallet: Wallet;
	currentHDIndex: number;

	constructor(params: { wallet: Wallet; currentHDIndex: number }) {
		this.wallet = params.wallet;
		this.currentHDIndex = params.currentHDIndex;
		this.wallet.initAddressManager();
	}

	public static async Init(params: KaspaWalletProviderParams) {
		await initKaspaFramework();

		const wallet = Wallet.fromMnemonic(
			params.mnemonic,
			{
				network: params.network,
				rpc: new RPC({
					clientConfig: {
						host: params.rpc,
						reconnect: true,
						verbose: true,
					},
				}),
			},
			{
				syncOnce: false,
			}
		);

		return new KaspaWalletProvider({
			wallet,
			currentHDIndex: params.currentHDIndex,
		});
	}

	public createDepositAddress() {
		this.currentHDIndex++;
		const depositAddress = this.wallet.addressManager.getAddresses(
			1,
			"receive",
			this.currentHDIndex
		);
		return depositAddress[0];
	}

	public getDepositAddressByIndex(index: number) {
		return this.wallet.addressManager.getAddresses(1, "receive", index)[0];
	}
}

let WalletProvider: KaspaWalletProvider;

export async function getWalletProvider() {
	if (!WalletProvider) {
		WalletProvider = await KaspaWalletProvider.Init({
			mnemonic: process.env.MASTER_MNEMONIC!,
			rpc: process.env.KASPA_GRPC_ENDPOINT!,
			network: process.env
				.NETWORK as KaspaWalletProviderParams["network"],
			// TODO: This should be fetched from the database
			currentHDIndex: 0,
		});
	}
	return WalletProvider;
}
