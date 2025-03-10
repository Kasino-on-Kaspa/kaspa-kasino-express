import { rpcClient } from ".";

export class WalletBalanceProvider {

    public async getUtxos(address: string) {
        const utxos = await rpcClient.getUtxosByAddresses([address]);
        console.log(utxos)
        return utxos;
    }
    
}

const balanceProvider = new WalletBalanceProvider();

balanceProvider.getUtxos("kaspatest:qqn5uy8vud35alu6mcav3rrv6evr0lxhpcjmjzmd770x02l0yvr5y6r7uyt42",)