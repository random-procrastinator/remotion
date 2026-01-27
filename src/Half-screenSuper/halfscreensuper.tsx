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

type Circle = {
  start: number;
  end: number;
  marginLeft: number;
  marginTop: number;
};

const DottedCircleAnimation: React.FC<{ circles: Circle[] }> = ({ circles }) => {
  const frame = useCurrentFrame();
  const maskPathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (maskPathRef.current) {
      const length = maskPathRef.current.getTotalLength();
      setPathLength(length);
    }
  }, []);

  const animationStartFrame = 30;
  const baseAnimationDuration = 90;
  
  const totalPauseDuration = circles.reduce(
    (acc, circle) => acc + (circle.end - circle.start),
    0
  );

  const animationEndFrame = animationStartFrame + baseAnimationDuration + totalPauseDuration;

  // FIX: Completely rewritten pause logic
  // Check if current frame is within ANY pause period
  let isPaused = false;
  let accumulatedPauseBefore = 0;

  for (const circle of circles) {
    if (frame >= circle.start && frame < circle.end) {
      // Currently in a pause - keep progress frozen at the start of pause
      isPaused = true;
      break;
    }
    
    if (frame >= circle.end) {
      // This pause has ended, add to accumulated offset
      accumulatedPauseBefore += (circle.end - circle.start);
    }
  }

  // Calculate the "real" animation frame without pauses
  let animatedFrame: number;
  
  if (isPaused) {
    // During pause: freeze at the frame where pause started
    const pauseCircle = circles.find(c => frame >= c.start && frame < c.end);
    animatedFrame = pauseCircle!.start - accumulatedPauseBefore;
  } else {
    // Not paused: subtract all accumulated pause durations
    animatedFrame = frame - accumulatedPauseBefore;
  }

  // Calculate progress for the stroke animation
  let progress = interpolate(
    animatedFrame,
    [animationStartFrame, animationStartFrame + baseAnimationDuration],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  if (frame > animationEndFrame) {
    progress = 1;
  }

  // Calculate mask offset - reveals as progress increases
  const maskOffset = pathLength > 0 ? pathLength * (1 - progress) : 0;
  
  // Fade in opacity at the start
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
            ref={maskPathRef}
            d="M680.857 34.7576C938.531 132.536 1067.41 422.64 968.716 682.725C870.023 942.81 581.132 1074.39 323.458 976.607C65.7853 878.829 -63.0936 588.724 35.5994 328.64C134.292 68.5551 423.184 -63.0204 680.857 34.7576Z"
            stroke="white"
            strokeWidth="8"
            strokeMiterlimit="10"
            strokeDasharray={pathLength > 0 ? pathLength : "0"}
            strokeDashoffset={maskOffset}
            strokeLinecap="round"
            fill="none"
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
          strokeWidth="14"
          strokeMiterlimit="0"
          strokeDasharray="25 22"
          strokeLinecap="square"
          fill="none"
        />
      </g>
    </svg>
  );
};

export const HalfScreenSuper: React.FC<{ count?: number }> = ({ count = 5 }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const allCircles: Circle[] = [
    { start: 46, end: 55, marginLeft: -1420, marginTop: -600 },
    { start: 65, end: 75, marginLeft: -1150, marginTop: -50 },
    { start: 85, end: 95, marginLeft: -1325, marginTop: 550 },
    { start: 105, end: 115, marginLeft: -1050, marginTop: 850 },
    { start: 125, end: 135, marginLeft: -1400, marginTop: 950 },
  ];

  const circles = allCircles.slice(0, count);

  const entranceProgress = spring({
    frame,
    fps,
    config: {
      damping: 200,
    },
    durationInFrames: 45,
  });

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
          width: "70%",
          height: "90%",
          transformOrigin: "center center",
        }}
      >
        <DottedCircleAnimation circles={circles} />
      </div>

      {circles.map((circle, index) => {
        const popScale = interpolate(frame, [circle.start, circle.start + 4, circle.end], [0, 1.5, 1.5], { 
          extrapolateRight: "clamp" 
        });

        const circleOpacity = frame >= circle.start ? 1 : 0;
        
        const scale = (frame >= circle.start && frame <= circle.end) ? popScale : 1.5;

        return (
          frame >= circle.start && (
            <AbsoluteFill
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: circleOpacity,
              }}
            >
              <Img
                src={staticFile('solidfillcircle.svg')}
                style={{
                  transform: `scale(${scale})`,
                  marginLeft: circle.marginLeft,
                  marginTop: circle.marginTop,
                }}
              />
            </AbsoluteFill>
          )
        );
      })}
    </AbsoluteFill>
  );
};