import React from 'react';
import type { RootComponentProps } from '@akashaorg/typings/lib/ui';
import SimpleEditor from './simple-editor';
import { CreateBeamMutation } from '@akashaorg/typings/lib/sdk/graphql-operation-types-new';
import { useGetBeamsQuery } from '@akashaorg/ui-awf-hooks/lib/generated/apollo';
import SimpleAntenna from './simple-antenna';
import Stack from '@akashaorg/design-system-core/lib/components/Stack';
import { SortOrder } from '@akashaorg/typings/lib/sdk/graphql-types-new';

const ExampleAppRoot: React.FC<RootComponentProps> = (props) => {
  const handleNewBeamPublished = (
    beamData: CreateBeamMutation['createAkashaBeam']['document']
  ) => {
    console.log('new beam published:', beamData);
    handleFetchLatestPublished();
  };

  const { data, loading, error, fetchMore } = useGetBeamsQuery({
    variables: { first: 10, sorting: { createdAt: SortOrder.Desc } },
  });

  const beams = React.useMemo(() => {
    return data?.akashaBeamIndex?.edges || [];
  }, [data]);

  const handleFetchLatestPublished = () => {
    fetchMore({
      variables: {
        before: beams[0]?.cursor,
        first: 1,
      },
    });
  };

  const handleFetchMore = () => {
    fetchMore({
      variables: {
        after: data?.akashaBeamIndex?.pageInfo?.endCursor,
      },
    });
  };

  return (
    <>
    <Stack direction="column" spacing="gap-4">
      <div className='bubble-article'>
        <div className='article-title'>
          In your bubble!
        </div>
        <div className='article-body'>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </div>
      </div>
      <div className='bubble-article'>
        <div className='article-title'>
          Oh, yeah, give me that dopamine-rushing, self-centered confirmation!
        </div>
        <div className='article-body'>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </div>
      </div>
      <div className='bubble-article'>
        <div className='article-title'>
          My bubble is so cool, and you're still in Web2
        </div>
        <div className='article-body'>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </div>
      </div>
      <div className='bubble-article'>
        <div className='article-title'>
          And yet, you're still here
        </div>
        <div className='article-body'>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </div>
      </div>
      <div className='bubble-breaker'>
        <div className='article-title'>GM! Why is ETH Bucharest so lit!?</div>
        <div className='article-body'>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </div>
      </div>
      <SimpleEditor onPublish={handleNewBeamPublished} />
      <SimpleAntenna
        beams={beams}
        loading={loading}
        handleFetchMore={handleFetchMore}
      />
    </Stack>
    </>
  );
};

export default ExampleAppRoot;
