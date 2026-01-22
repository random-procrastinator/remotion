import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
  Sequence,
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

  let animatedFrame = frame;
  
  // Pause from frame 46 to 55 (10 frames)
  if (frame >= 46 && frame <= 55) {
    animatedFrame = 45;
  } else if (frame > 55) {
    animatedFrame = frame - 10;
  }
  
  // Pause from frame 65 to 75 (10 frames) - adjust the offset
  if (frame >= 65 && frame <= 75) {
    animatedFrame = 55;
  } else if (frame > 75) {
    animatedFrame = frame - 20;
  }
  
  // Pause from frame 85 to 95 (10 frames) - keep consistent offset
  if (frame >= 85 && frame <= 95) {
    animatedFrame = 65;  // Changed from 75 to 65
  } else if (frame > 95) {
    animatedFrame = frame - 30;
  }

  // Animation from frame 30 to 120, then stay at 1
  let progress = interpolate(animatedFrame, [30, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  // Keep progress at 1 after frame 120
  if (frame > 120) {
    progress = 1;
  }

  const maskOffset = pathLength * (1 - progress);
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
        opacity: pathLength === 0 ? 0 : opacity,
        transform: "rotate(-45deg)",
        transformOrigin: "center",
      }}
    >
      <defs>
        <mask id="circleMask">
          <rect width="1005" height="1012" fill="black" />
          <path
            ref={pathRef}
            d="M680.857 34.7576C938.531 132.536 1067.41 422.64 968.716 682.725C870.023 942.81 581.132 1074.39 323.458 976.607C65.7853 878.829 -63.0936 588.724 35.5994 328.64C134.292 68.5551 423.184 -63.0204 680.857 34.7576Z"
            stroke="white"
            strokeWidth="8"
            strokeMiterlimit="10"
            strokeDasharray={`${pathLength} ${pathLength}`}
            strokeDashoffset={maskOffset}
            strokeLinecap="round"
          />
        </mask>
        <clipPath id="clip0_42_14">
          <rect width="1004.28" height="1011.27" fill="white" />
        </clipPath>
      </defs>

      <g clipPath="url(#clip0_42_14)" mask="url(#circleMask)">
        <path
          d="M680.857 34.7576C938.531 132.536 1067.41 422.64 968.716 682.725C870.023 942.81 581.132 1074.39 323.458 976.607C65.7853 878.829 -63.0936 588.724 35.5994 328.64C134.292 68.5551 423.184 -63.0204 680.857 34.7576Z"
          stroke="white"
          strokeWidth="8"
          strokeMiterlimit="10"
          strokeDasharray="25 20"
          strokeLinecap="round"
        />
      </g>
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

  // First circle pop: frame 46-55
  const popScale1 = interpolate(frame, [46, 50, 55], [0, 1.5, 1.5], { 
    extrapolateRight: "clamp" 
  });

  // Second circle pop: frame 65-75
  const popScale2 = interpolate(frame, [65, 69, 75], [0, 1.5, 1.5], { 
    extrapolateRight: "clamp" 
  });

  // Third circle pop: frame 85-95
  const popScale3 = interpolate(frame, [85, 89, 95], [0, 1.5, 1.5], { 
    extrapolateRight: "clamp" 
  });

  // Opacity for circles (appears when they're supposed to pop)
  const circleOpacity1 = frame >= 46 ? 1 : 0;
  const circleOpacity2 = frame >= 65 ? 1 : 0;
  const circleOpacity3 = frame >= 85 ? 1 : 0;

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
          width: "70%",
          height: "90%",
          transformOrigin: "center center",
        }}
      >
        <DottedCircleAnimation />
      </div>

      {/* First solid fill circle at frame 46 onwards */}
      {frame >= 46 && (
        <AbsoluteFill
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: circleOpacity1,
          }}
        >
          <Img
            src={staticFile('solidfillcircle.svg')}
            style={{
              transform: `scale(${frame >= 46 && frame <= 55 ? popScale1 : 1.5})`,
              marginLeft: -1420,
              marginTop: -600,
            }}
          />
        </AbsoluteFill>
      )}

      {/* Second solid fill circle at frame 65 onwards */}
      {frame >= 65 && (
        <AbsoluteFill
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: circleOpacity2,
          }}
        >
          <Img
            src={staticFile('solidfillcircle.svg')}
            style={{
              transform: `scale(${frame >= 65 && frame <= 75 ? popScale2 : 1.5})`,
              marginLeft: -1150,
              marginTop: -50,
            }}
          />
        </AbsoluteFill>
      )}

      {/* Third solid fill circle at frame 85 onwards */}
      {frame >= 85 && (
        <AbsoluteFill
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: circleOpacity3,
          }}
        >
          <Img
            src={staticFile('solidfillcircle.svg')}
            style={{
              transform: `scale(${frame >= 85 && frame <= 95 ? popScale3 : 1.5})`,
              marginLeft: -1325,
              marginTop: 550,
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};