import React, { useEffect, useState } from 'react';
import type { RootComponentProps } from '@akashaorg/typings/lib/ui';
import Card from '@akashaorg/design-system-core/lib/components/Card';
import Text from '@akashaorg/design-system-core/lib/components/Text';
import { useGetBeamsByAuthorDidQuery } from '@akashaorg/ui-awf-hooks/lib/generated/apollo';
import { useGetLogin } from '@akashaorg/ui-awf-hooks';
import axios from 'axios';
import getSDK from "@akashaorg/awf-sdk";

const ExampleWidget: React.FC<RootComponentProps> = () => {
  const loginData = useGetLogin();
  const ethereumAddress = loginData?.data?.ethAddress;
  const authenticatedDID = loginData?.data?.id;
  const [ipfsHashes, setIpfsHashes] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [canMint, setCanMint] = useState(false);
  const sdk = getSDK();

  const { data, loading, error } = useGetBeamsByAuthorDidQuery({
    variables: { id: authenticatedDID, first: 100 },
  });

  const beams = React.useMemo(() => {
    return data && data.node && "akashaBeamList" in data.node ? data.node.akashaBeamList.edges : [];
  }, [data]);

  const computeUserRating = async () => {
    const beamIds = beams.map(beam => beam.node.id);
    console.log("beamIds:", beamIds);
    
    if (beamIds.length == 0) {
      return 0;
    }

    const response = await sdk.services.gql.client.GetUserRatings({ first: 100, filters: { where: { beamID: { in: beamIds }}}});
    console.log("userRatings: ", response.userRatingIndex.edges);

    const ratingsByBeamId = response.userRatingIndex.edges.reduce((acc, rating) => {
      if (!acc[rating.node.beamID]) {
         acc[rating.node.beamID] = [];
      }
      acc[rating.node.beamID].push(rating.node);
      return acc;
    }, {});
    console.log("ratingsByBeamId:", ratingsByBeamId);

    let sumOfAverages = 0;
    for (const beamId in ratingsByBeamId) {
      const ratings = ratingsByBeamId[beamId];
      const totalRating = ratings.reduce((sum, rating) => sum + rating.userRating, 0);
      const averageRating = parseInt((totalRating / ratings.length).toString());
      sumOfAverages += averageRating;
    }

    console.log("total user rating: ", sumOfAverages);
    setUserRating(sumOfAverages);
  };

  const aiRating = React.useMemo(() => {
    let aiRating = 0;

    for (const beam of beams) {
      if (beam.node.aiRating) {
        aiRating += beam.node.aiRating;
      }
    }

    console.log("total AI rating: ", aiRating);
    return aiRating;
  }, [beams]);

  const handleUpdateMintableNfts = async () => {
    try {
      console.log(aiRating);
      const response = await axios.post(`${process.env.API_ENDPOINT}/api/update-mintable-nfts`, {
        address: ethereumAddress,
        rating: aiRating
      });
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
      setCanMint(response.data.mintableNFTs.length > 0);
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

  useEffect(() => {
    computeUserRating();
  }, [beams]);

  return (
    <Card customStyle="flex place-self-center">
      <Text align="center">🔨🔥 GM ETH Bucharest! This is the Bubble Breaker! 🔥🔨</Text>
      <div className='flex-column'>
        <div className="nft-separator">
          <Text align="center">Total rating: {userRating + aiRating}</Text>
        </div>
        <div className="nft-separator">NFT Actions</div>
        <button className='nft-button' onClick={handleUpdateMintableNfts}>Update Mintable NFTs</button>
        <button className='nft-button' onClick={checkMintableNfts}>Check Mintable NFTs</button>
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
