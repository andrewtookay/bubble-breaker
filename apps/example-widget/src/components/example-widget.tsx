import React, { useEffect, useState } from 'react';
import Card from '@akashaorg/design-system-core/lib/components/Card';
import Text from '@akashaorg/design-system-core/lib/components/Text';
import { useGetBeamsByAuthorDidQuery } from '@akashaorg/ui-awf-hooks/lib/generated/apollo';
import { useGetLogin } from '@akashaorg/ui-awf-hooks';
import axios from 'axios';
import getSDK from '@akashaorg/awf-sdk';
import { GQL_EVENTS } from '@akashaorg/typings/lib/sdk';
import { Eip1193Provider, ethers } from 'ethers';
import { Subscription } from 'rxjs';
import { abi } from '../contract-abi';
import {
  type BaseError,
  useSignMessage,
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract
} from 'wagmi';

const contractConfig = {
  address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
  abi,
} as const;

const ExampleWidget: React.FC = () => {
  const loginData = useGetLogin();
  const ethereumAddress = loginData?.data?.ethAddress;
  const authenticatedDID = loginData?.data?.id;
  const [ipfsHashes, setIpfsHashes] = useState([]);
  const [totalRating, setTotalRating] = useState(0);
  const [canMint, setCanMint] = useState(false);
  const [canUpdateMintable, setCanUpdateMintable] = useState(false);
  const sdk = getSDK();
  const { signMessageAsync } = useSignMessage();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const { isConnected, address, chain, chainId } = useAccount();
  const [totalMinted, setTotalMinted] = React.useState(0n);


  const {
    data: hash,
    error,
    writeContract: mint,
    isPending: isMintLoading,
    isSuccess: isMintStarted,
    error: mintError,
  } = useWriteContract();

  const { data: getNextIdData } = useReadContract({
    ...contractConfig,
    functionName: 'getNextId',
  });

  const {
    data: txData,
    isSuccess: txSuccess,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  });

  React.useEffect(() => {
    if (getNextIdData) {
      setTotalMinted(getNextIdData as bigint);
    }
  }, [getNextIdData]);

  const isMinted = txSuccess;

  const { data, refetch } = useGetBeamsByAuthorDidQuery({
    variables: { id: authenticatedDID, first: 100 },
  });

  const beams = React.useMemo(() => {
    return data && data.node && 'akashaBeamList' in data.node
      ? data.node.akashaBeamList.edges
      : [];
  }, [data]);

  const createUserCreateBeamSub = (): Subscription => {
    return sdk.api.globalChannel.subscribe({
      next: (eventData: {
        data: { uuid: string; [key: string]: unknown };
        event: GQL_EVENTS.MUTATION;
      }) => {
        if (eventData.data && eventData.data.variables) {
          console.log(
            'in example-widget event: ',
            eventData.data.variables[0].type.type.name.value
          );
          if (
            eventData.data.variables[0].type.type.name.value ==
            'CreateAkashaBeamInput'
          ) {
            // TODO_BB also listen for CreateUserRatingInput due to user rating own posts? should we even allow rating your own post?
            refetch();
          }
        }
      },
    });
  };

  useEffect(() => {
    const userCreateBeamSub = createUserCreateBeamSub();
    // recompute total rating every 20 seconds
    const beamRefetchInterval = setInterval(() => {
      refetch();
    }, 20000);

    return () => {
      if (userCreateBeamSub) {
        userCreateBeamSub.unsubscribe();
      }
      if (beamRefetchInterval) {
        clearInterval(beamRefetchInterval);
      }
    };
  }, []);

  const computeTotalRating = async () => {
    let aiRating = 0;

    for (const beam of beams) {
      if (beam.node.aiRating) {
        aiRating += beam.node.aiRating;
      }
    }

    console.log('total AI rating: ', aiRating);
    const beamIds = beams.map((beam) => beam.node.id);
    console.log('user beamIds:', beamIds);

    if (beamIds.length == 0) {
      setTotalRating(60);
      return;
    }

    const response = await sdk.services.gql.client.GetUserRatings({
      first: 100,
      filters: { where: { beamID: { in: beamIds } } },
    });
    console.log('userRatings: ', response.userRatingIndex.edges);

    const ratingsByBeamId = response.userRatingIndex.edges.reduce(
      (acc: any, rating: any) => {
        if (!acc[rating.node.beamID]) {
          acc[rating.node.beamID] = [];
        }
        acc[rating.node.beamID].push(rating.node);
        return acc;
      },
      {}
    );
    console.log('ratingsByBeamId:', ratingsByBeamId);

    let userRating = 0;
    for (const beamId in ratingsByBeamId) {
      const ratings = ratingsByBeamId[beamId];
      const totalRating = ratings.reduce(
        (sum: number, rating: any) => sum + rating.userRating,
        0
      );
      const averageRating = parseInt((totalRating / ratings.length).toString());
      userRating += averageRating;
    }

    console.log('user rating: ', userRating);
    console.log('total rating: ', aiRating + userRating);
    setTotalRating(aiRating + userRating);
  };

  // TODO_BB display error message and loading
  const updateMintableNfts = async () => {
    try {
      const signature = await signMessageAsync({
        account: ethereumAddress,
        message: 'Bubble Breaker',
      });
      console.log('Wagmi signature:', signature);

      const response = await axios.post(
        `${process.env.API_ENDPOINT}/api/update-mintable-nfts`,
        {
          address: ethereumAddress,
          signature: signature,
          rating: totalRating,
        }
      );

      console.log('update mintable NFTs result:', response.data);
      if (response.data.result == 'updated') {
        mintNfts();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const checkMintableNfts = async () => {
    try {
      const response = await axios.post(
        `${process.env.API_ENDPOINT}/api/can-mint`,
        {
          address: ethereumAddress,
        }
      );
      console.log('Check result:', response.data);
      setCanMint(response.data.mintableNFTs.length > 0);
    } catch (error) {
      console.error(error);
    }
  };

  const mintNfts = async () => {
    console.log('mint clicked');
    console.log(mounted, isConnected, isMinted, ethereumAddress);
    console.log(address, chain);
    
    if (mounted && isConnected && !isMinted) {
      mint?.({
        ...contractConfig,
        functionName: 'safeMint',
        args: [
           address,
           'https://bronze-famous-coyote-943.mypinata.cloud/ipfs/QmQgqgvA6d1tgmSYQaNWe4WMTyGuGVPxtmnxkYhudvgGoZ',
           'Breakey',
        ]
       });
    }
    // try {
    //   const response = await axios.post(`${process.env.API_ENDPOINT}/api/mint-nft`, {
    //     address: ethereumAddress
    //   });

    //   console.log("Mint result:", response.data);
    //   setIpfsHashes((prevState) => [...prevState, ...response.data.ipfsHashes]);
    //   setCanMint(false);
    // } catch (error) {
    //   console.error(error);
    // }
  };

  const updateNfts = async () => {
    try {
      const response = await axios.post(
        `${process.env.API_ENDPOINT}/api/get-minted-nfts`,
        {
          addresses: [ethereumAddress],
        }
      );

      console.log('Update NFTs result:', response.data);
      setIpfsHashes(response.data[ethereumAddress]);
    } catch (error) {
      console.error(error);
    }
  };

  const signMessageEthers = async () => {
    const provider = new ethers.BrowserProvider(
      window.ethereum as unknown as Eip1193Provider
    );
    const signer = provider.getSigner();
    const signature = await (await signer).signMessage('Bubble Breaker');
    console.log('Ethers signature:', signature);
    return signature;
  };

  const updateCanUpdateMintable = () => {
    let numMintable = 0;

    if (totalRating > 60) {
      numMintable = 3;
    } else if (totalRating > 30) {
      numMintable = 2;
    } else if (totalRating > 10) {
      numMintable = 1;
    }

    setCanUpdateMintable(numMintable > ipfsHashes.length);
  };

  useEffect(() => {
    console.log('latest IPFS hashes:', ipfsHashes);
  }, [ipfsHashes]);

  useEffect(() => {
    if (ethereumAddress) {
      refetch();
      checkMintableNfts();
      updateNfts();
    }
  }, [ethereumAddress]);

  useEffect(() => {
    computeTotalRating();
  }, [beams]);

  useEffect(() => {
    updateCanUpdateMintable();
  }, [ipfsHashes, totalRating]);

  return (
    <Card customStyle="flex place-self-center">
      <Text align="center">💭 GM, Bubble Breaker! 🔨</Text>
      <div className="flex-column">
        {totalRating != 0 && (
          <div className="nft-separator">
            <Text align="center">Total rating: {totalRating}</Text>
          </div>
        )}
        {canUpdateMintable && (
          <button className="nft-button" onClick={updateMintableNfts}>
            Mint NFTs
          </button>
        )}
        {
          <button className="nft-button" onClick={mintNfts}>
            Mint NFTs
          </button>
        }
        {ipfsHashes.length != 0 && (
          <>
            <div className="nft-separator">Your NFTs</div>
            <div className="nft-row">
              {ipfsHashes.map((ipfsHash) => (
                <img
                  src={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`}
                  width={90}
                  height={90}
                />
              ))}
            </div>
          </>
        )}
        {
        error && ( 
        <div>Error: {(error as BaseError).shortMessage || error.message}</div> 
      )} 
      </div>
    </Card>
  );
};

export default ExampleWidget;
