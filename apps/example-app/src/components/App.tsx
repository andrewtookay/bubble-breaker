import React from 'react';
import type { RootComponentProps } from '@akashaorg/typings/lib/ui';
import SimpleEditor from './simple-editor';
import { CreateBeamMutation } from '@akashaorg/typings/lib/sdk/graphql-operation-types-new';
import { useGetBeamsQuery } from '@akashaorg/ui-awf-hooks/lib/generated/apollo';
import SimpleAntenna from './simple-antenna';
import Stack from '@akashaorg/design-system-core/lib/components/Stack';
import Image from '@akashaorg/design-system-core/lib/components/Image';
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
    <Stack direction="column" spacing="gap-4">
      <div className='bubble-breaker'>
        <div className='article-categories'>
          {["banking", "economy", "regulation", "Switzerland"].map(category => <span className="article-category">{category}</span>)}
        </div>
        <div className='article-title'>
        UBS faces stricter regulations amid Swiss banking plan, remains out of immediate danger
        </div>
        <Image src={"https://www.reuters.com/resizer/v2/2LCFF7TUBZLI7H7YGKURE54W6A.jpg?auth=e1025ee06c24228e423e6a0d36181aff6fdd3cb4b8a2e35adf8e3d09a79a2cc9&width=960&quality=80"} />
        <div className='article-body'>
        <br></br>
        <p>The Swiss government has outlined plans to impose stricter regulations on UBS and other systemically important banks, aiming to prevent a repeat of the financial crisis that occurred during the 2007-9 financial crisis. These plans, which were announced following the rescue of Credit Suisse, are part of a broader effort to ensure the stability of the Swiss banking sector. </p>
        <br></br>
        <p>The government's recommendations, which include 22 measures for direct implementation, are designed to tighten capital requirements for banks deemed "too big to fail" (TBTF). However, the government has not specified the extent of these stricter requirements.</p>
        <br></br>
        <p>The proposed regulations come amid concerns that UBS, which is now twice the size of Switzerland's annual economic output, could pose a significant risk to the country's financial stability. If UBS were to fail, there would be no local rivals capable of absorbing it, potentially leading to a bailout and nationalization that could severely impact public finances.</p>
        <br></br>
        <p>The Swiss government has committed to implementing these measures quickly, with plans to present two packages for consideration in the first half of 2025. One package would involve changes at the ordinance level, which can be approved by the government, while the other would be subject to parliamentary review.</p>
        </div>
      </div>
      <SimpleEditor onPublish={handleNewBeamPublished} />
      <SimpleAntenna
        beams={beams}
        loading={loading}
        handleFetchMore={handleFetchMore}
      />
    </Stack>
  );
};

export default ExampleAppRoot;
