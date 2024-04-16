import { createConfig, http } from '@wagmi/core';
import { hardhat, sepolia } from '@wagmi/core/chains';
import { injected } from '@wagmi/connectors';

export const config = createConfig({
  chains: [hardhat, sepolia],
  connectors: [injected()],
  transports: {
    [hardhat.id]: http(hardhat.rpcUrls.default.http[0]),
    [sepolia.id]: http('https://rpc.sepolia.org'),
  },
});
