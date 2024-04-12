import { createConfig, http } from '@wagmi/core';
import { defineChain } from 'viem';
import { sepolia } from '@wagmi/core/chains';
import { injected } from '@wagmi/connectors';

export const localhost = defineChain({
  id: 31_337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
});

export const config = createConfig({
  chains: [localhost, sepolia],
  connectors: [injected()],
  transports: {
    [localhost.id]: http(localhost.rpcUrls.default.http[0]),
    [sepolia.id]: http('https://rpc2.sepolia.org'),
  },
});
