import { createConfig, http } from '@wagmi/core'
import { sepolia } from '@wagmi/core/chains'
import { injected } from '@wagmi/connectors'

export const config = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http('https://rpc2.sepolia.org'),
  },
});
