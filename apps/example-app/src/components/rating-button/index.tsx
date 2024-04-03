import { useEffect, useState } from "react";
import React from "react";
import getSDK from "@akashaorg/awf-sdk";

const DEFAULT_COUNT = 5;
const DEFAULT_ICON = "🔨";
const DEFAULT_UNSELECTED_COLOR = "grey";
const DEFAULT_COLOR = "yellow";

export type RatingProps = {
    count?: number | null;
    defaultRating?: number | null;
    icon?: string | null;
    color?: string | null;
    iconSize?: number | null;
    beamId?: string | null;
    ratingId?: String | null;
    onChange?: () => void;
  };

const RatingButton: React.FC<RatingProps> = (props) => {
  const { count, defaultRating, icon, color, iconSize, beamId, ratingId, onChange } = props;
  const [rating, setRating] = useState(defaultRating);
  const [temporaryRating, setTemporaryRating] = useState(0);
  const sdk = getSDK();

  useEffect(() => {
    setRating(defaultRating);
  }, [defaultRating]);

  let stars = Array(count || DEFAULT_COUNT).fill(icon || DEFAULT_ICON);

  const handleClick = async (rating) => {
    setRating(rating);
    if (defaultRating == -1) {
      const response = await sdk.services.gql.client.CreateUserRating({i: {content: {beamID: beamId, userRating: rating}}});
    } else {
      const response = await sdk.services.gql.client.UpdateUserRating({i: { id: ratingId, content: { beamID: beamId, userRating: rating }}});
    }
    onChange();
  };

  return (
    <div className="starsContainer">
      {stars.map((item, index) => {
        const isActiveColor =
          (rating || temporaryRating) &&
          (index < rating || index < temporaryRating);

        let elementColor = "";

        if (isActiveColor) {
          elementColor = color || DEFAULT_COLOR;
        } else {
          elementColor = DEFAULT_UNSELECTED_COLOR;
        }

        return (
          <div
            className="star"
            key={index}
            style={{
              fontSize: iconSize ? `${iconSize}px` : "28px",
              color: elementColor,
              filter: `${isActiveColor ? "grayscale(0%)" : "grayscale(100%)"}`,
            }}
            onMouseEnter={() => setTemporaryRating(index + 1)}
            onMouseLeave={() => setTemporaryRating(0)}
            onClick={() => handleClick(index + 1)}
          >
            {icon ? icon : DEFAULT_ICON}
          </div>
        );
      })}
    </div>
  );
}

export default RatingButton;
