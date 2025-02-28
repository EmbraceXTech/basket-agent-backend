import ParaServer, {
  Environment,
  OAuthMethod,
  WalletType,
} from '@getpara/server-sdk';
import { ethers, parseUnits } from 'ethers';
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
import { eq } from 'drizzle-orm/sql';
import ClaimPregensDto from './dto/claim.dto';
import { ChainService } from 'src/chain/chain.service';
import { EthConnector } from './eth-connector';
import { MOCK_AMM_ABI } from 'src/common/modules/ethereum/abis/mock-amm.abi';
import { MINTABLE_ERC20_ABI } from 'src/common/modules/ethereum/abis/mintable-erc20.abi';

export class ParaConnector {
  private paraClient: ParaServer;
  private baseTokenSymbol = 'USDC';
  private nativeTokenSymbol = 'ETH';
  constructor(
    private db: NodePgDatabase<typeof schema>,
    private priceService: PriceService,
    private tokenService: TokenService,
    private agentService: AgentService,
    private chainService: ChainService,
    private ethConnector: EthConnector,
  ) {
    this.paraClient = new ParaServer(Environment.BETA, config.paraApiKey);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createAgentWallet(chainId?: string) {
    return this._createParaWallet();
  }

  private async _createParaWallet() {
    const randomString = Math.random().toString(36).substring(2, 15);
    const customIDWithRandom = 'agent-' + randomString;
    try {
      const pregenWallet = await this.paraClient.createPregenWallet({
        type: WalletType.EVM,
        pregenIdentifier: customIDWithRandom,
        pregenIdentifierType: 'CUSTOM_ID',
      });
      const userShare = this.paraClient.getUserShare();
      return {
        address: pregenWallet.address,
        userShare,
        walletId: pregenWallet.id,
      };
    } catch (error) {
      throw new Error('Error creating pre-generated wallet: ' + error);
    }
  }

  async findWalleKeytByAgentId(agentId: string) {
    const result = await this.db.query.walletKeysTable.findFirst({
      where: eq(schema.walletKeysTable.agentId, +agentId),
    });
    return result;
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
    const walletKey = await this.findWalleKeytByAgentId(agentId);
    const userShare = walletKey.userShare;
    this.paraClient.setUserShare(userShare);
  }

  private async _getSigner(agentId?: string) {
    await this._fetchUserShare(agentId);
    const agent = await this.agentService.findOne(agentId);
    const chainInfo = await this.chainService.getChainInfo(
      Number(agent.chainId),
    );
    const [rpcUrl] = chainInfo.rpc;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const walletId = (await this.findWalleKeytByAgentId(agentId)).walletId;
    const ethersSigner = new ParaEthersSigner(
      this.paraClient as any,
      provider,
      walletId,
    );
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
    const usdcInfo = await this.tokenService.getBasedToken(agent.chainId);
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

    const erc20Tokens = [
      ...selectedTokens,
      {
        tokenSymbol: usdcInfo.symbol,
        tokenAddress: usdcInfo.address as `0x${string}`,
      },
    ].filter(
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
    tokenSymbol,
    to,
    amount,
    chainId,
  }: {
    signer: ethers.Signer;
    tokenSymbol: string;
    to: string;
    amount: number;
    chainId?: string;
  }) {
    const tokenAvaiable = await this.tokenService.getAvailableTokenMap(chainId);
    const decimals = tokenAvaiable[tokenSymbol].decimals;
    const tokenAddress = tokenAvaiable[tokenSymbol].address;
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
      const receipt = await this._transferEther({
        signer,
        amount,
        to: recipientAddress,
      });
      return receipt.hash;
    } else if (assetId === 'usdc') {
      const agent = await this.agentService.findOne(agentId);
      const receipt = await this._transferToken({
        signer,
        tokenSymbol: assetId,
        to: recipientAddress,
        amount,
        chainId: agent.chainId,
      });
      return receipt.hash;
    }
  }

  async buyAsset(agentId: string, buyDto: BuyDto) {
    const signer = await this._getSigner(agentId);
    const agent = await this.agentService.findOne(agentId);
    const tokenMap = await this.tokenService.getAvailableTokenMap(
      agent.chainId,
    );
    const ammAddress = await this.chainService.getAmmAddress(
      Number(agent.chainId),
    );

    const usdcTokenInfo = tokenMap['usdc'];
    const outputTokenInfo = tokenMap[buyDto.tokenAddress.toLowerCase()];

    const [outputTokenPriceRes] = await this.priceService.getPrices([
      outputTokenInfo.symbol.toUpperCase(),
    ]);
    const outputTokenPrice = outputTokenPriceRes.price;
    const inputAmount = buyDto.usdAmount;
    const outputAmount = inputAmount / outputTokenPrice;

    const parsedInputAmount = parseUnits(
      inputAmount.toFixed(usdcTokenInfo.decimals),
      usdcTokenInfo.decimals,
    );
    const parsedOutputAmount = parseUnits(
      outputAmount.toFixed(outputTokenInfo.decimals),
      outputTokenInfo.decimals,
    );

    const usdcContract = new ethers.Contract(
      usdcTokenInfo.address,
      ERC20_ABI,
      signer,
    );
    const allowance = await usdcContract.allowance(
      agent.walletKey.address,
      ammAddress,
    );

    if (allowance < parsedInputAmount) {
      const tx = await usdcContract.approve(ammAddress, ethers.MaxUint256);
      await tx.wait();
    }

    const contract = new ethers.Contract(ammAddress, MOCK_AMM_ABI, signer);
    const tx = await contract.swap(
      usdcTokenInfo.address,
      outputTokenInfo.address,
      parsedInputAmount,
      parsedOutputAmount,
    );
    const receipt = await tx.wait();
    return receipt.hash as string;
  }

  async sellAsset(agentId: string, sellDto: SellDto) {
    const signer = await this._getSigner(agentId);
    const agent = await this.agentService.findOne(agentId);
    const tokenMap = await this.tokenService.getAvailableTokenMap(
      agent.chainId,
    );
    const ammAddress = await this.chainService.getAmmAddress(
      Number(agent.chainId),
    );

    const inputTokenInfo = tokenMap[sellDto.tokenAddress.toLowerCase()];
    const usdcTokenInfo = tokenMap['usdc'];

    const [inputTokenPriceRes] = await this.priceService.getPrices([
      inputTokenInfo.symbol.toUpperCase(),
    ]);
    const inputTokenPrice = inputTokenPriceRes.price;
    const inputAmount = sellDto.tokenAmount;
    const outputAmount = inputAmount / inputTokenPrice;

    const parsedInputAmount = parseUnits(
      inputAmount.toFixed(inputTokenInfo.decimals),
      inputTokenInfo.decimals,
    );
    const parsedOutputAmount = parseUnits(
      outputAmount.toFixed(usdcTokenInfo.decimals),
      usdcTokenInfo.decimals,
    );

    const inputTokenContract = new ethers.Contract(
      inputTokenInfo.address,
      ERC20_ABI,
      signer,
    );
    const allowance = await inputTokenContract.allowance(
      agent.walletKey.address,
      ammAddress,
    );

    if (allowance < parsedInputAmount) {
      const tx = await inputTokenContract.approve(
        ammAddress,
        ethers.MaxUint256,
      );
      await tx.wait();
    }

    const contract = new ethers.Contract(ammAddress, MOCK_AMM_ABI, signer);
    const tx = await contract.swap(
      inputTokenInfo.address,
      usdcTokenInfo.address,
      parsedInputAmount,
      parsedOutputAmount,
    );
    const receipt = await tx.wait();
    return receipt.hash as string;
  }

  async getWalletAddress(agentId: string) {
    const agent = await this.agentService.findOne(agentId);
    return agent.walletKey.address;
  }

  async faucet(agentId: string, token: string) {
    const agent = await this.agentService.findOne(agentId);
    const tokenInfos = await this.tokenService.getAvailableTokenMap(
      agent.chainId,
    );

    const tokenInfo = tokenInfos[token.toLowerCase()];
    const signer = await this._getSigner(agentId);
    const contract = new ethers.Contract(
      tokenInfo.address,
      MINTABLE_ERC20_ABI,
      signer,
    );
    const tx = await contract.mint(
      agent.walletKey.address,
      ethers.parseUnits('10', tokenInfo.decimals),
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async claimPregenWallet(
    agentId: string,
    { identifier, identifierType, userId }: ClaimPregensDto,
  ) {
    await this.paraClient.setUserId(userId);
    const wallet = await this.findWalleKeytByAgentId(agentId);
    await this.paraClient.updatePregenWalletIdentifier({
      walletId: wallet.walletId,
      newPregenIdentifier: identifier,
      newPregenIdentifierType: identifierType as
        | 'EMAIL'
        | 'PHONE'
        | 'CUSTOM_ID'
        | OAuthMethod.TWITTER
        | OAuthMethod.DISCORD
        | OAuthMethod.TELEGRAM,
    });

    try {
      await this.paraClient.claimPregenWallets({
        pregenIdentifier: identifier,
        pregenIdentifierType: identifierType as
          | 'EMAIL'
          | 'PHONE'
          | 'CUSTOM_ID'
          | OAuthMethod.TWITTER
          | OAuthMethod.DISCORD
          | OAuthMethod.TELEGRAM,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // console.error(error);
    }
    await this.agentService.delete(agentId, false);
  }
}
