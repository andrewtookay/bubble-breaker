import React from 'react';
import type { RootComponentProps } from '@akashaorg/typings/lib/ui';
import { config } from '../wagmi.config';
import { WagmiProvider } from 'wagmi';
import ExampleWidget from './example-widget';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const UserNftsWrapper: React.FC<RootComponentProps> = () => {
  return (
    <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}> 
          <ExampleWidget/>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default UserNftsWrapper;
