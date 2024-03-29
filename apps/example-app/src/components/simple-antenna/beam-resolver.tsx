import React, { useEffect, useState } from 'react';
import EntryCardLoading from '@akashaorg/design-system-components/lib/components/Entry/EntryCardLoading';
import EntryCard from '@akashaorg/design-system-components/lib/components/Entry/EntryCard';
import ContentBlockRenderer from './content-block-renderer';
import { EntityTypes } from '@akashaorg/typings/lib/ui';
import {
  hasOwn,
  mapBeamEntryData,
  useRootComponentProps,
  sortByKey,
  transformSource,
  useGetLogin,
} from '@akashaorg/ui-awf-hooks';
import {
  useGetBeamByIdQuery,
  useGetProfileByDidQuery,
} from '@akashaorg/ui-awf-hooks/lib/generated/apollo';
import RatingButton from '../rating-button';
import getSDK from "@akashaorg/awf-sdk";

export type BeamResolverProps = {
  beamId: string;
};
const BeamResolver: React.FC<BeamResolverProps> = (props) => {
  const { beamId } = props;
  const [userRating, setUserRating] = useState(0);

  /**
   * this hook is used to fetch the authenticated user's credentials
   * it will return an object with 2 props:
   * id - the user's ceramic derived DID (decentralised identifier)
   * ethAddress - the ethAddress from which the DID was derived
   */
  const { data } = useGetLogin();
  const authenticatedDID = data?.id;
  const sdk = getSDK();

  useEffect(() => {
    computeUserRating();
  }, [beamId]);

  async function computeUserRating() {
    const response = await sdk.services.gql.client.GetUserRatings({ first: 100, filters: { where: { beamID: { equalTo: beamId}}}});
    console.log(response);
  }

  /**
   * this hook will fetch the content of a beam (an entry) by its id
   */
  const beamReq = useGetBeamByIdQuery({
    variables: {
      id: beamId,
    },
    fetchPolicy: 'cache-first',
    skip: !beamId,
  });

  const entryData =
    beamReq.data?.node && hasOwn(beamReq.data.node, 'id')
      ? beamReq.data.node
      : null;

  console.log(entryData);

  /**
   * this mapping is used to adapt the data coming from the hook
   * with the data used by the UI component
   */
  const processedEntryData = mapBeamEntryData(entryData);

  /**
   * fetch the profile data of the author of the beam
   */
  const {
    data: profileDataReq,
    error,
    loading,
  } = useGetProfileByDidQuery({
    variables: { id: processedEntryData?.authorId },
    fetchPolicy: 'cache-first',
  });

  const { akashaProfile: profileData }: any =
    profileDataReq?.node && hasOwn(profileDataReq.node, 'akashaProfile')
      ? profileDataReq.node
      : { akashaProfile: null };

  /**
   * this plugin is used to navigate between apps
   */
  const { getRoutingPlugin } = useRootComponentProps();
  const navigateTo = getRoutingPlugin().navigateTo;
  const onAvatarClick = (id: string) => {
    navigateTo({
      appName: '@akashaorg/app-profile',
      getNavigationUrl: (routes) => `${routes.rootRoute}/${id}`,
    });
  };

  const handleContentClick = () => {
    return;
  };

  /**
   * in the case there are multiple content blocks
   * this creates a new array with the blocks sorted
   * with the original order they were published in
   */
  const sortedEntryContent = React.useMemo(() => {
    if (processedEntryData?.content) {
      return sortByKey(processedEntryData?.content, 'order');
    }
    return [];
  }, [processedEntryData?.content]);

  if (beamReq.loading) return <EntryCardLoading />;

  return (
    <>
      <EntryCard
        entryData={processedEntryData}
        authorProfile={{ data: profileData, loading, error }}
        locale={'en'}
        profileAnchorLink="/@akashaorg/app-profile"
        sortedContents={sortedEntryContent}
        isViewer={authenticatedDID === processedEntryData?.authorId}
        showHiddenContent={true}
        isLoggedIn={!!authenticatedDID}
        itemType={EntityTypes.BEAM}
        transformSource={transformSource}
        onAvatarClick={onAvatarClick}
        actionsRight={
          <div className='bottom-row'>
            <div>
              <div>{"approval" in (entryData as any) && entryData["approval"]}</div>
              <div className='ai-rating'>🤖 {"aiRating" in (entryData as any) && entryData["aiRating"]}✖️🔨</div>
            </div>
            <RatingButton beamId={beamId}></RatingButton>
            {/* <Extension
            name={`example-app-fav_${beamId}`}
            extensionData={{
              itemId: beamId,
            }} /> */}
          </div>
        }
      >
        {({ blockID }) => (
          <ContentBlockRenderer
            blockID={blockID}
            onContentClick={handleContentClick}
          />
        )}
      </EntryCard>
    </>
  );
};

export default BeamResolver;
