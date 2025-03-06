import { NetworkId, RpcClient } from "@kcoin/kaspa-web3.js";
import { config } from "dotenv";
config();

export const rpcClient = new RpcClient({
	endpoint: process.env.KASPA_WSS_ENDPOINT!,
	networkId:
		process.env.NETWORK === "mainnet"
			? NetworkId.Mainnet
			: NetworkId.Testnet10,
});
