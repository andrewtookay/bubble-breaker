import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  BlockInstanceMethods,
  ContentBlockModes,
  ContentBlockRootProps,
} from '@akashaorg/typings/lib/ui';
import { useRootComponentProps } from '@akashaorg/ui-awf-hooks';
import getSDK from '@akashaorg/awf-sdk';
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, dangerouslyAllowBrowser: true });
const DEFAULT_BLOCK_TYPE = 'text-block';

export const useEditorBlocks = () => {
  const { getExtensionsPlugin } = useRootComponentProps();
  const [errors, setErrors] = useState<string[]>([]);

  const availableBlocks = React.useMemo(
    () => getExtensionsPlugin().contentBlockStore.getInfos(),
    [getExtensionsPlugin]
  );

  const [blocksInUse, setBlocksInUse] = React.useState<
    (ContentBlockRootProps['blockInfo'] & {
      appName: string;
      blockRef: React.RefObject<BlockInstanceMethods>;
      key: number;
      status?: 'success' | 'pending' | 'error';
      response?: { blockID: string; error?: string };
      disablePublish?: boolean;
    })[]
  >([]);

  useLayoutEffect(() => {
    const defaultTextBlock = availableBlocks.find(
      (bl) => bl.propertyType === DEFAULT_BLOCK_TYPE
    );
    if (availableBlocks.length && !blocksInUse.length) {
      setBlocksInUse([
        {
          ...defaultTextBlock,
          order: 0,
          mode: ContentBlockModes.EDIT,
          blockRef: React.createRef<BlockInstanceMethods>(),
          key: 0,
        },
      ]);
    }
  }, [availableBlocks, blocksInUse.length]);

  const createBeam = useCallback(async () => {
    const sdk = getSDK();
    if (blocksInUse.length) {
      try {
        const blk = await blocksInUse[0].blockRef.current?.createBlock({
          nsfw: false,
        });

        // get the title and content fields from blk

        const completion = await openai.chat.completions.create({
          messages: [{ role: "system", content: "You are a comment curator for an emerging social media platform that validates healthy and argumented conversation. You will receive a title and content, you have to first give it an approval, and then a rating. If the title and comment do not seem argumented or they are hateful or seem like an unhealthy conversation, do not approve them. Then, rate the message from 0 to 5, judging by number of sources listed, general flow of message, cleanliness and so on. Your returned message should be of the format { \"approval\": true/false, \"rating\": 0 to 5 (without decimals) }" },
                     { role: "user", content: `Title: ${blk.response.title} Content: ${blk.response.content}`}
                    ],
          model: "gpt-3.5-turbo",
        });

        console.log(completion.choices[0].message.content);
        let ratingAndApproval = JSON.parse(completion.choices[0].message.content);
        if (!ratingAndApproval) {
          ratingAndApproval = { approval: false, rating: 0};
        }

        console.log("before CreateBeam", ratingAndApproval);
        const response = await sdk.services.gql.client.CreateBeam({
          i: {
            content: {
              content: [{ blockID: blk.response.blockID, order: 0 }],
              active: true,
              createdAt: new Date().toISOString(),
              approval: ratingAndApproval.approval,
              aiRating: ratingAndApproval.rating
            },
          },
        });
        console.log("after CreateBeam", response);

        setBlocksInUse([]);
        return response.createAkashaBeam.document;
      } catch (err) {
        setErrors([err.message]);
      }
    }
  }, [blocksInUse, setBlocksInUse, setErrors]);

  return {
    availableBlocks,
    blocksInUse,
    createBeam,
    errors,
  };
};
