import ParaServer, { Environment, WalletType } from '@getpara/server-sdk';
import { ethers } from 'ethers';
import { ParaEthersSigner } from '@getpara/ethers-v6-integration';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import * as schema from 'src/db/schema';
import { config } from 'src/config';
import { WithdrawTokenDto } from './dto/withdraw-token.dto';
import { SellDto } from './dto/sell.dto';
import { BuyDto } from './dto/buy.dto';
import { PriceService } from 'src/price/price.service';
import { TokenService } from 'src/token/token.service';
import { AgentService } from '../agent.service';
import { ERC20_ABI } from 'src/common/modules/ethereum/abis/erc20.abi';
import { BaseConnector } from './base-connector';

export class ParaConnector extends BaseConnector {
  private paraClient: ParaServer;
  private baseTokenSymbol = 'USDC';
  private nativeTokenSymbol = 'ETH';
  constructor(
    private db: NodePgDatabase<typeof schema>,
    private priceService: PriceService,
    private tokenService: TokenService,
    private agentService: AgentService,
  ) {
    super();
    this.paraClient = new ParaServer(Environment.BETA, config.paraApiKey);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createAgentWallet(chainIdHex?: string) {
    return this._createParaWallet();
  }

  private async _createParaWallet() {
    const customIDWithRandom = 'agent-' + Math.random();
    try {
      const pregenWallet = await this.paraClient.createPregenWallet({
        type: WalletType.EVM,
        pregenIdentifier: customIDWithRandom,
        pregenIdentifierType: 'CUSTOM_ID',
      });
      const userShare = this.paraClient.getUserShare();
      return {
        walletAddress: pregenWallet.address,
        userShare,
        walletId: pregenWallet.id,
      };
    } catch (error) {
      throw new Error('Error creating pre-generated wallet: ' + error);
    }
  }

  // NOTE: not working
  // private async _claimParaWallet(agentId: string) {
  //   const userShare = '';
  //   const newIdentifier = '';
  //   const newIdentifierType = 'CUSTOM_ID';
  //   const walletId = '';
  //   this.paraClient.setUserShare(userShare);
  //   await this.paraClient.updatePregenWalletIdentifier({
  //     walletId,
  //     newPregenIdentifier: newIdentifier,
  //     newPregenIdentifierType: newIdentifierType,
  //   });
  //   // Claim the wallet
  //   const recoverySecret = await this.paraClient.claimPregenWallets({
  //     pregenIdentifier: newIdentifier,
  //     pregenIdentifierType: newIdentifierType,
  //   });
  //   return recoverySecret ?? null;
  // }

  // set user share
  private async _fetchUserShare(agentId?: string) {
    if (!this.paraClient.getUserShare()) {
      // TODO: fetch user share from DB
      console.log('fetching user share from DB with agentId: ', agentId);
      const userShare = '';
      this.paraClient.setUserShare(userShare);
    }
  }

  private async _getSigner(chainId?: string, agentId?: string) {
    await this._fetchUserShare(agentId);
    const rpcUrl = config.baseRpcUrl;
    const provider = new ethers.JsonRpcProvider(
      rpcUrl ?? 'https://ethereum-sepolia-rpc.publicnode.com',
    );
    const ethersSigner = new ParaEthersSigner(this.paraClient as any, provider);
    return ethersSigner;
  }

  private async _getEtherAmount(signer: ethers.Signer) {
    const provider = signer.provider;
    if (!provider) {
      throw new Error('Signer does not have a provider');
    }
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const formattedBalance = ethers.formatUnits(balance, 18);
    return formattedBalance;
  }

  private async _getTokenAmounts(
    signer: ethers.Signer,
    tokenInfos: Array<{ tokenSymbol: string; tokenAddress: `0x${string}` }>,
  ): Promise<
    Array<{ tokenSymbol: string; tokenAddress: `0x${string}`; amount: number }>
  > {
    const address = await signer.getAddress();
    const provider = signer.provider;

    if (!provider) {
      throw new Error('Signer does not have a provider');
    }

    // Create multicall batch requests
    const balanceCalls = tokenInfos.map((tokenInfo) => {
      const contract = new ethers.Contract(
        tokenInfo.tokenAddress,
        ERC20_ABI,
        provider,
      );
      return contract.balanceOf.staticCall(address);
    });

    const decimalsCalls = tokenInfos.map((tokenInfo) => {
      const contract = new ethers.Contract(
        tokenInfo.tokenAddress,
        ERC20_ABI,
        provider,
      );
      return contract.decimals.staticCall();
    });

    // Execute all calls in parallel
    const [balances, decimals] = await Promise.all([
      Promise.all(balanceCalls),
      Promise.all(decimalsCalls),
    ]);

    // Format balances with appropriate decimals
    const formattedBalances = balances.map((balance, index) =>
      Number(ethers.formatUnits(balance, decimals[index])),
    );

    // Return array of token info with amounts
    return tokenInfos.map((tokenInfo, index) => ({
      tokenSymbol: tokenInfo.tokenSymbol,
      tokenAddress: tokenInfo.tokenAddress,
      amount: formattedBalances[index],
    }));
  }

  private async _listTokenSelected(agentId: string) {
    const agent = await this.agentService.findOne(agentId);
    if (!agent || !agent.selectedTokens || agent.selectedTokens.length === 0) {
      return { nativeToken: null, erc20Tokens: [] };
    }

    const selectedTokens = agent.selectedTokens.map((token) =>
      JSON.parse(token),
    ) as Array<{
      tokenSymbol: string;
      tokenAddress: `0x${string}`;
    }>;

    // Separate native token (ETH) from ERC20 tokens
    // Assuming the native token doesn't have a contract address or has a special identifier
    const nativeToken = selectedTokens.find(
      (token) =>
        token.tokenSymbol.toUpperCase() === this.nativeTokenSymbol ||
        token.tokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    );

    const erc20Tokens = selectedTokens.filter(
      (token) =>
        token.tokenSymbol.toUpperCase() !== this.nativeTokenSymbol &&
        token.tokenAddress !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    );

    return { nativeToken, erc20Tokens };
  }

  private async _transferEther({
    signer,
    amount,
    to,
  }: {
    signer: ethers.Signer;
    amount: number;
    to: string;
  }) {
    const tx = await signer.sendTransaction({
      to,
      value: ethers.parseEther(amount.toString()),
    });
    const receipt = await tx.wait();
    return receipt;
  }

  private async _transferToken({
    signer,
    tokenAddress,
    to,
    amount,
    chainId,
  }: {
    signer: ethers.Signer;
    tokenAddress: string;
    to: string;
    amount: number;
    chainId?: string;
  }) {
    const tokenAvaiable = await this.tokenService.getAvailableTokenMap(chainId);
    const decimals = tokenAvaiable[tokenAddress].decimals;
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await contract.transfer(
      to,
      ethers.parseUnits(amount.toString(), decimals),
    );
    const receipt = await tx.wait();
    return receipt;
  }

  async getBalance(agentId: string): Promise<{
    tokens: (string | number)[][];
    tokenValues: (string | number)[][];
    balance: number;
  }> {
    try {
      const signer = await this._getSigner(agentId);
      const { erc20Tokens } = await this._listTokenSelected(agentId);
      // get ether balance
      const etherAmount = await this._getEtherAmount(signer);
      // get token amount
      const tokenAmount = await this._getTokenAmounts(signer, erc20Tokens);
      // get token price
      const tokenPrices = await this.priceService.getPrices([
        ...erc20Tokens
          .map((token) => token.tokenSymbol.toUpperCase())
          .filter((token) => token !== this.baseTokenSymbol),
        this.nativeTokenSymbol,
      ]);
      // calculate token value in USD
      const erc20TokenValues = tokenAmount.map((token) => [
        token.tokenSymbol.toUpperCase(),
        token.amount *
          (token.tokenSymbol.toUpperCase() === this.baseTokenSymbol
            ? 1
            : (tokenPrices.find(
                (price) =>
                  price.token.toUpperCase() === token.tokenSymbol.toUpperCase(),
              )?.price ?? 0)),
      ]);
      const nativeTokenValueInUSD =
        Number(etherAmount) *
        (tokenPrices.find(
          (price) => price.token.toUpperCase() === this.nativeTokenSymbol,
        )?.price ?? 0);
      const balance = erc20TokenValues.reduce(
        (acc, token) => acc + +token[1],
        nativeTokenValueInUSD,
      );
      return {
        tokens: [
          ...tokenAmount.map((token) => [
            token.tokenSymbol.toUpperCase(),
            token.amount,
          ]),
          [this.nativeTokenSymbol, Number(etherAmount)],
        ],
        tokenValues: [
          ...erc20TokenValues,
          [this.nativeTokenSymbol, nativeTokenValueInUSD],
        ], // token amount and value in USD
        balance, // total balance in USD
      };
    } catch (e) {
      throw e;
    }
  }

  async withdraw(agentId: string, withdrawTokenDto: WithdrawTokenDto) {
    const { assetId, amount, recipientAddress } = withdrawTokenDto;
    const signer = await this._getSigner(agentId);
    if (assetId === 'eth') {
      return this._transferEther({ signer, amount, to: recipientAddress });
    } else if (assetId === 'usdc') {
      const agent = await this.agentService.findOne(agentId);
      return this._transferToken({
        signer,
        tokenAddress: assetId,
        to: recipientAddress,
        amount,
        chainId: agent.chainId,
      });
    }
  }

  // TODO: implement
  async buyAsset(agentId: string, buyDto: BuyDto) {
    // const { tokenAddress, usdAmount } = buyDto;
    const agent = await this.agentService.findOne(agentId);
    const tokenMap = await this.tokenService.getAvailableTokenMap(
      agent.chainId,
    );
    // swap usdc to token
    return;
    // return this.trade(
    //   agentId,
    //   tokenMap['usdc'].address,
    //   buyDto.tokenAddress,
    //   buyDto.usdAmount,
    // );
  }

  // TODO: implement
  async sellAsset(agentId: string, sellDto: SellDto) {
    const { tokenAddress, tokenAmount } = sellDto;
    const agent = await this.agentService.findOne(agentId);
    const tokenMap = await this.tokenService.getAvailableTokenMap(
      agent.chainId,
    );
    // swap token to usdc
    return;
    // return this.trade(
    //   agentId,
    //   sellDto.tokenAddress,
    //   tokenMap['usdc'].address,
    //   sellDto.tokenAmount,
    // );
  }

  async getWalletAddress(agentId: string) {
    const agent = await this.agentService.findOne(agentId);
    return agent.walletKey.address;
  }

  async faucet(agentId: string, token: string) {
    return { agentId, token };
  }
}
