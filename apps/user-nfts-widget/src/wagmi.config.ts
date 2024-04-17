import { createConfig, http } from '@wagmi/core';
import { hardhat, sepolia } from '@wagmi/core/chains';
import { injected } from '@wagmi/connectors';
import getSdk from '@akashaorg/awf-sdk';

const connector = injected({
  target() {
    return {
      id: 'windowProvider',
      name: 'Window Provider',
      provider: getSdk().services.common.web3.walletProvider as any,
    };
  },
});

export const config = createConfig({
  chains: [hardhat, sepolia],
  connectors: [connector],
  transports: {
    [hardhat.id]: http(hardhat.rpcUrls.default.http[0]),
    [sepolia.id]: http('https://rpc.sepolia.org'),
  },
});
