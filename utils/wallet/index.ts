import { NetworkId, Resolver, RpcClient } from "@kcoin/kaspa-web3.js";
import { config } from "dotenv";
config();

export const network = () => {
	return process.env.NETWORK === "mainnet"
		? NetworkId.Mainnet
		: NetworkId.Testnet10;
};

// const resolver = Resolver.createWithEndpoints([]);

export const rpcClient = new RpcClient({
	endpoint: process.env.KASPA_WSS_ENDPOINT!,
	networkId: network(),
});


