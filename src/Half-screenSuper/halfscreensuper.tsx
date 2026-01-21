import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from "remotion";
import React, { useEffect, useRef, useState } from "react";

const DottedCircleAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  // Animation from frame 30 to 120
  const progress = interpolate(frame, [30, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const strokeDashoffset = interpolate(progress, [0, 1], [pathLength, 0]);
  const opacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <svg
      width="1005"
      height="1012"
      viewBox="0 0 1005 1012"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        opacity: pathLength === 0 ? 0 : opacity, // Hide until path length is calculated and then fade in
      }}
    >
      <g clipPath="url(#clip0_42_14)">
        <path
          ref={pathRef}
          d="M968.716 682.725C1067.41 422.64 938.531 132.536 680.857 34.7576C423.184 -63.0204 134.292 68.5551 35.5994 328.64C-63.0936 588.724 65.7853 878.829 323.458 976.607C581.132 1074.39 870.023 942.81 968.716 682.725Z"
          stroke="white"
          strokeWidth="5"
          strokeMiterlimit="10"
          strokeDasharray={pathLength}
          strokeDashoffset={strokeDashoffset}
        />
      </g>
      <defs>
        <clipPath id="clip0_42_14">
          <rect width="1004.28" height="1011.27" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const HalfScreenSuper: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  // Animate the entrance of the graphic
  const entranceProgress = spring({
    frame,
    fps,
    config: {
      damping: 200,
    },
    durationInFrames: 45,
  });

  // Slide in from the left
  const translateX = interpolate(entranceProgress, [0, 1], [-width, 0]);

  return (
    <AbsoluteFill>
      <Img
        src={staticFile("side-super.svg")}
        style={{
          position: "absolute",
          height: "100%",
          objectFit: "contain",
          transform: `translateX(${translateX}px)`,
        }}
      />
      
      <div
        style={{
          position: "absolute",
          left: "-40%",
          top: "5%",
          //opacity: circleOpacity,
          // transform: `translateX(${circleX}px) scale(${circleScale}) rotate(50deg)`,
          width: "70%",
          height: "90%",
          transformOrigin: "center center",
        }}
      >
        <DottedCircleAnimation />
      </div>
    </AbsoluteFill>
  );
};
