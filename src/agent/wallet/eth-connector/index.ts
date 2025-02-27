import { Contract, ethers, Interface } from 'ethers';
import { ERC20_ABI } from 'src/common/modules/ethereum/abis/erc20.abi';
import { NATIVE_TOKEN_ADDRESS } from 'src/constant/eth.constant';
import { EthereumBalanceParams, EthereumBalanceResult } from './types';
import { MULTICALL_ABI } from 'src/common/modules/ethereum/abis/multicall.abi';
import { ChainService } from 'src/chain/chain.service';
import { TokenService } from 'src/token/token.service';

export class EthConnector {
  constructor(
    private readonly tokenService: TokenService,
    private readonly chainService: ChainService,
  ) {}

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
            data: log.data,
          });

          if (parsedLog.name === 'Transfer') {
            const result = {
              toAddress: parsedLog.args[1], // 'to' address
              tokenAddress: transaction.to, // 'from' address
              amount: parsedLog.args[2].toString(), // transfer amount
              value: null,
              timestamp: block.timestamp * 1000,
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
        timestamp: block.timestamp * 1000,
      };

      return result;
    } catch (error) {
      return null;
    }
  }

  public async getTokenBalances(
    rpcUrl: string,
    multicallAddress: string,
    balanceParams: EthereumBalanceParams[],
  ) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const multicallContract = new Contract(
      multicallAddress,
      MULTICALL_ABI,
      provider,
    );

    const networkId = await this.getNetworkId(rpcUrl);
    const tokenMap = await this.tokenService.getAvailableTokenMap(
      networkId.toString(),
    );

    const calls = balanceParams.map((param) => {
      if (param.token === 'ETH') {
        return {
          target: multicallAddress,
          callData: this.getETHBalanceCallData(param.walletAddress),
        };
      } else {
        const token = tokenMap[param.token];
        if (!token) return { target: null, callData: null };
        return {
          target: token.address,
          callData: this.getERC20BalanceOfCallData(param.walletAddress),
        };
      }
    });

    const [blockNumber, balances] =
      await multicallContract.aggregate.staticCall(
        calls.filter((call) => !!call.target),
      );

    const formattedResults: EthereumBalanceResult[] = balances.map(
      (balance, index) => {
        const params = balanceParams[index];
        const token = tokenMap[params.token];
        const decimals = token ? token.decimals : 18;
        const formattedBal = ethers.formatUnits(balance, decimals);
        return {
          ...params,
          amount: Number(formattedBal),
        };
      },
    );

    return calls.map((call, index) => {
      const params = balanceParams[index];
      if (!call.target) return { ...params, amount: -1 };
      return formattedResults[index];
    });
  }

  public getERC20BalanceOfCallData(walletAddress: string) {
    const erc20Interface = new Interface(ERC20_ABI);
    return erc20Interface.encodeFunctionData('balanceOf', [walletAddress]);
  }

  public getETHBalanceCallData(walletAddress: string) {
    const multicallInterface = new Interface(MULTICALL_ABI);
    return multicallInterface.encodeFunctionData('getEthBalance', [
      walletAddress,
    ]);
  }

  public async getNetworkId(rpcUrl: string) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    return Number(network.chainId);
  }

  private getProvider(rpcUrl: string) {
    return new ethers.JsonRpcProvider(rpcUrl);
  }
}
