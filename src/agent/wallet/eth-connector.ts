import { ethers } from 'ethers';
import { ERC20_ABI } from 'src/common/modules/ethereum/abis/erc20.abi';
import { NATIVE_TOKEN_ADDRESS } from 'src/constant/eth.constant';

export class EthConnector {
  private getProvider(rpcUrl: string) {
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  async getTransferHistory(rpcUrl: string, transactionHash: string) {
    try {
      const provider = this.getProvider(rpcUrl);
      const transaction = await provider.getTransaction(transactionHash);
      const block = await provider.getBlock(transaction.blockNumber);
      const receipt = await provider.getTransactionReceipt(transactionHash);

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      const contractInterface = new ethers.Interface(ERC20_ABI);

      // Try to find and parse ERC20 transfer event
      for (const log of receipt.logs) {
        try {
          const parsedLog = contractInterface.parseLog({
            topics: log.topics,
            data: log.data
          });

          if (parsedLog.name === 'Transfer') {
            const result = {
              toAddress: parsedLog.args[1], // 'to' address
              tokenAddress: transaction.to, // 'from' address
              amount: parsedLog.args[2].toString(), // transfer amount
              value: null,
              timestamp: block.timestamp * 1000
            };

            return result;
          }
        } catch {
          continue; // Not a Transfer event, skip to next log
        }
      }

      // If no ERC20 transfer found, check for native token transfer
      const result = {
        toAddress: transaction.to,
        tokenAddress: NATIVE_TOKEN_ADDRESS,
        amount: null,
        value: transaction.value.toString(),
        timestamp: block.timestamp * 1000
      }

      return result;

    } catch (error) {
      return null;
    }
  }
}
