import React, { useEffect } from 'react';
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
  }, [data, authenticatedDID]);

  console.log(ownRating, ethereumAddress, authenticatedDID);

  const apiUri = "https://dull-feet-beam.loca.lt";

  const handleUpdateMintableNfts = async () => {
    try {
      const response = await axios.post(`${apiUri}/api/update-mintable-nfts`, {
        address: ethereumAddress,
        rating: ownRating
      });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCheckMintableNfts = async () => {
    try {
      const response = await axios.post(`${apiUri}/api/can-mint`, {
        address: ethereumAddress
      });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMintNfts = async () => {
    try {
      const response = await axios.post(`${apiUri}/api/mint-nft`, {
        address: ethereumAddress
      });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card customStyle="flex place-self-center">
      <Text align="center">🔨🔥 GM ETH Bucharest! This is the Bubble Breaker! 🔥🔨</Text>
      <button onClick={handleUpdateMintableNfts}>Update Mintable NFTs</button>
      <button onClick={handleCheckMintableNfts}>Check Mintable NFTs</button>
      <button onClick={handleMintNfts}>Mint NFTs</button>
      <div className='my-nfts'>
        <img src='https://gateway.pinata.cloud/ipfs/QmbJwT5XarQEAwCKDAKBHu9K7CrgiG8fnzMzop4zdpVW2c' width={100} height={100}/>
      </div>
    </Card>
  );
};
export default ExampleWidget;
