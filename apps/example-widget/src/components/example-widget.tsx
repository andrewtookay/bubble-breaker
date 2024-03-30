import React, { useEffect, useState } from 'react';
import type { RootComponentProps } from '@akashaorg/typings/lib/ui';
import Card from '@akashaorg/design-system-core/lib/components/Card';
import Text from '@akashaorg/design-system-core/lib/components/Text';
import { useGetBeamsByAuthorDidQuery } from '@akashaorg/ui-awf-hooks/lib/generated/apollo';
import { useGetLogin } from '@akashaorg/ui-awf-hooks';
import axios from 'axios';

const ExampleWidget: React.FC<RootComponentProps> = () => {
  const loginData = useGetLogin();
  const ethereumAddress = loginData?.data?.ethAddress;
  const authenticatedDID = loginData?.data?.id;
  const [ipfsHashes, setIpfsHashes] = useState([]);
  const [canMint, setCanMint] = useState(false);

  const { data, loading, error } = useGetBeamsByAuthorDidQuery({
    variables: { id: authenticatedDID, first: 100 },
  });

  const ownRating = React.useMemo(() => {
    if (data && data.node && "akashaBeamList" in data.node) {
      let ownRating = 0;

      for (const beam of data.node.akashaBeamList.edges) {
        if (beam.node.aiRating) {
          ownRating += beam.node.aiRating;
        }
        if (beam.node.userRating) {
          ownRating += beam.node.userRating;
        }
      }

      return ownRating;
    } else 
    return 0;
  }, [data]);

  const handleUpdateMintableNfts = async () => {
    try {
      const response = await axios.post(`${process.env.API_ENDPOINT}/api/update-mintable-nfts`, {
        address: ethereumAddress,
        rating: ownRating
      });
      checkMintableNfts();
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const checkMintableNfts = async () => {
    try {
      const response = await axios.post(`${process.env.API_ENDPOINT}/api/can-mint`, {
        address: ethereumAddress
      });
      console.log(response.data);
      setCanMint(response.data.length > 0);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMintNfts = async () => {
    try {
      const response = await axios.post(`${process.env.API_ENDPOINT}/api/mint-nft`, {
        address: ethereumAddress
      });
      console.log(response.data.ipfsHashes);
      setIpfsHashes((prevState) => [...prevState, ...response.data.ipfsHashes]);
    } catch (error) {
      console.error(error);
    }
  };

  const updateNfts = async () => {
    try {
      const response = await axios.post(`${process.env.API_ENDPOINT}/api/get-minted-nfts`, {
        addresses: [ethereumAddress]
      });
      console.log(response.data[ethereumAddress]);
      setIpfsHashes(response.data[ethereumAddress]);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    console.log(ipfsHashes);
  }, [ipfsHashes]);

  useEffect(() => {
    if (ethereumAddress) {
      checkMintableNfts();
      updateNfts();
    }
  }, [ethereumAddress]);

  return (
    <Card customStyle="flex place-self-center">
      <Text align="center">🔨🔥 GM ETH Bucharest! This is the Bubble Breaker! 🔥🔨</Text>
      <div className='flex-column'>
        <div className="nft-separator">NFT Actions</div>
        <button className='nft-button' onClick={handleUpdateMintableNfts}>Update Mintable NFTs</button>
        { canMint && <button className='nft-button' onClick={handleMintNfts}>Mint NFTs</button> }
        <div className="nft-separator">Your NFTs</div>
        <div className='nft-row'>
          {ipfsHashes.map(ipfsHash => <img src={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`} width={90} height={90}/>)}
        </div>
      </div>
    </Card>
  );
};
export default ExampleWidget;
