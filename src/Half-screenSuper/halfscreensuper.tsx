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
import { z } from "zod";

// Schema for animation timing
const animationTimingSchema = z.object({
  entranceDuration: z.number().min(10).max(90).default(45),
  circleGrowDuration: z.number().min(5).max(30).default(10),
  circleSettleDuration: z.number().min(3).max(20).default(5),
  pauseDuration: z.number().min(5).max(30).default(10),
  easingType: z
    .enum(["linear", "smooth", "bouncy", "snappy", "spring"])
    .default("linear")
    .describe("Animation easing style"),
});

// Schema for circle styling
const circleStyleSchema = z.object({
  size: z.number().min(20).max(200).default(60),
  icon: z.string().default("solidfillcircle"),
});

// Main schema for the HalfScreenSuper component
export const halfScreenSuperSchema = z.object({
  // Number of circles to display
  count: z.number().min(1).max(10).default(5),

  // Circle styling
  circleStyle: circleStyleSchema.optional().default({
    size: 60,
    icon: "solidfillcircle",
  }),

  // Animation timing
  animationTiming: animationTimingSchema.optional().default({
    entranceDuration: 45,
    circleGrowDuration: 10,
    circleSettleDuration: 5,
    pauseDuration: 10,
    easingType: "linear",
  }),
});

// Export the type for external use
export type HalfScreenSuperProps = z.infer<typeof halfScreenSuperSchema>;

// Helper function to get spring config based on easing type
const getSpringConfig = (easingType: string) => {
  switch (easingType) {
    case "smooth":
      return { damping: 200 };
    case "bouncy":
      return { damping: 8 };
    case "snappy":
      return { damping: 20, stiffness: 200 };
    case "spring":
      return { damping: 10, stiffness: 100 };
    case "linear":
    default:
      return null;
  }
};

// Circle component with consistent animation - positioned using SVG coordinates
interface CircleNodeProps {
  startFrame: number;
  cx: number; // SVG coordinate x
  cy: number; // SVG coordinate y
  size: number;
  icon: string;
  animationTiming: z.infer<typeof animationTimingSchema>;
  fps: number;
}

const CircleNode: React.FC<CircleNodeProps> = ({
  startFrame,
  cx,
  cy,
  size,
  icon,
  animationTiming,
  fps,
}) => {
  const frame = useCurrentFrame();

  if (frame < startFrame) {
    return null;
  }

  const frameSinceStart = frame - startFrame;
  const { circleGrowDuration, circleSettleDuration, easingType } =
    animationTiming;

  const springConfig = getSpringConfig(easingType);
  let scale = 0;

  if (springConfig) {
    // Use spring animation
    const springValue = spring({
      frame: frameSinceStart,
      fps,
      config: springConfig,
      durationInFrames: circleGrowDuration + circleSettleDuration,
    });
    scale = springValue;
  } else {
    // Use linear interpolate
    if (frameSinceStart < circleGrowDuration) {
      scale = interpolate(frameSinceStart, [0, circleGrowDuration], [0, 1.2], {
        extrapolateRight: "clamp",
      });
    } else if (frameSinceStart < circleGrowDuration + circleSettleDuration) {
      scale = interpolate(
        frameSinceStart,
        [circleGrowDuration, circleGrowDuration + circleSettleDuration],
        [1.2, 1],
        {
          extrapolateRight: "clamp",
        },
      );
    } else {
      scale = 1;
    }
  }

  // Render as SVG image element for precise positioning
  return (
    <image
      href={staticFile(`${icon}.svg`)}
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: `${cx}px ${cy}px`,
        transformBox: "fill-box",
      }}
    />
  );
};

// Dotted circle path animation component with integrated circle nodes
const DottedCircleAnimation: React.FC<{
  circleStartFrames: number[];
  circlePositions: { cx: number; cy: number; progress: number }[];
  pauseDuration: number;
  baseAnimationDuration: number;
  animationStartFrame: number;
  circleSize: number;
  circleIcon: string;
  animationTiming: z.infer<typeof animationTimingSchema>;
  fps: number;
  maxDrawProgress: number; // How far to draw the line (0-1, based on last circle position)
}> = ({
  circleStartFrames,
  circlePositions,
  pauseDuration,
  baseAnimationDuration,
  animationStartFrame,
  circleSize,
  circleIcon,
  animationTiming,
  fps,
  maxDrawProgress,
}) => {
  const frame = useCurrentFrame();
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
    }
  }, []);

  const count = circleStartFrames.length;

  // Calculate time spent in pauses up to current frame
  let timeSpentInPauses = 0;
  for (let i = 0; i < count; i++) {
    const circleReachFrame = circleStartFrames[i];
    if (frame >= circleReachFrame + pauseDuration) {
      timeSpentInPauses += pauseDuration;
    } else if (frame >= circleReachFrame) {
      timeSpentInPauses += frame - circleReachFrame;
      break;
    }
  }

  // Calculate drawing progress (same as HorizontalTimeline)
  const timeSpentDrawing = frame - timeSpentInPauses - animationStartFrame;
  // Only draw up to maxDrawProgress (where the last circle is)
  const drawProgress =
    Math.max(0, Math.min(timeSpentDrawing / baseAnimationDuration, 1)) *
    maxDrawProgress;

  // Calculate the actual length to draw (only up to the last circle position)
  const maxDrawLength = pathLength * maxDrawProgress;
  const currentDrawnLength = (drawProgress / maxDrawProgress) * maxDrawLength;

  // Dynamic stroke-dasharray for dotted line (same as HorizontalTimeline)
  const dotSize = 25;
  const gapSize = 22;
  const patternSize = dotSize + gapSize;
  const fullPatterns = Math.floor(currentDrawnLength / patternSize);
  const remainder = currentDrawnLength % patternSize;

  const dashArray: number[] = [];
  for (let i = 0; i < fullPatterns; i++) {
    dashArray.push(dotSize, gapSize);
  }
  dashArray.push(remainder, pathLength);

  const dashArrayString = dashArray.join(" ");

  const opacity = interpolate(
    frame,
    [animationStartFrame, animationStartFrame + 20],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

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
      {/* Dotted path that draws progressively */}
      <path
        ref={pathRef}
        d="M680.857 34.7576C938.531 132.536 1067.41 422.64 968.716 682.725C870.023 942.81 581.132 1074.39 323.458 976.607C65.7853 878.829 -63.0936 588.724 35.5994 328.64C134.292 68.5551 423.184 -63.0204 680.857 34.7576Z"
        stroke="white"
        strokeWidth="14"
        strokeLinecap="square"
        fill="none"
        strokeDasharray={dashArrayString}
      />

      {/* Circle nodes positioned directly on the arc path */}
      {circlePositions.map((pos, i) => (
        <CircleNode
          key={i}
          startFrame={circleStartFrames[i]}
          cx={pos.cx}
          cy={pos.cy}
          size={circleSize}
          icon={circleIcon}
          animationTiming={animationTiming}
          fps={fps}
        />
      ))}
    </svg>
  );
};

const calculateCirclePositions = (
  count: number,
): { cx: number; cy: number; progress: number }[] => {
  const centerX = 502;
  const centerY = 506;
  const radius = 467;

  const pathStartAngle = Math.atan2(34.7576 - centerY, 680.857 - centerX);

  // After the -45deg rotation, only the LEFT side semicircle is visible
  // The visible arc is approximately 180 degrees (half circle)
  const visibleArcSpan = Math.PI; // 180 degrees

  // Distribute circles evenly within the visible arc
  // Each circle takes equal space, including margins at start and end
  const positions: { cx: number; cy: number; progress: number }[] = [];

  for (let i = 0; i < count; i++) {
    // Position circles evenly - first circle at 1/(count+1), last at count/(count+1)
    const arcProgress = (i + 1) / (count + 1);
    const angle = pathStartAngle + arcProgress * visibleArcSpan;

    // Calculate position on the arc using SVG coordinates directly
    const cx = centerX + radius * Math.cos(angle);
    const cy = centerY + radius * Math.sin(angle);

    // Progress is relative to the full path (semicircle = 0.5 of full circle)
    // But since we're only drawing up to the last circle, we normalize within the visible portion
    const progress = arcProgress;

    positions.push({ cx, cy, progress });
  }

  return positions;
};

// Calculate the maximum draw progress based on circle count
// This determines where the dotted line should stop (at the last circle)
const calculateMaxDrawProgress = (count: number): number => {
  // The last circle is at position count/(count+1) along the visible semicircle
  // Semicircle is 50% of the full path
  const lastCircleArcProgress = count / (count + 1);
  // Convert to full path progress (semicircle is ~50% of full path)
  return lastCircleArcProgress * 0.5;
};

export const HalfScreenSuper: React.FC<HalfScreenSuperProps> = ({
  count = 5,
  circleStyle,
  animationTiming,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();

  // Apply defaults
  const styleConfig = circleStyle ?? {
    size: 60,
    icon: "solidfillcircle",
  };

  const timingConfig = animationTiming ?? {
    entranceDuration: 45,
    circleGrowDuration: 10,
    circleSettleDuration: 5,
    pauseDuration: 10,
    easingType: "linear" as const,
  };

  // Animation starts after entrance
  const animationStartFrame = Math.floor(timingConfig.entranceDuration * 0.7);

  // Calculate total pause duration and draw duration
  const totalPauseDuration = count * timingConfig.pauseDuration;
  const baseAnimationDuration =
    durationInFrames - animationStartFrame - totalPauseDuration;

  // Calculate circle positions along the visible semicircle arc
  const circlePositions = calculateCirclePositions(count);

  // Calculate how far the line should draw (stops at the last circle)
  const maxDrawProgress = calculateMaxDrawProgress(count);

  // Calculate when each circle should start animating (same logic as HorizontalTimeline)
  const circleStartFrames = circlePositions.map((pos, index) => {
    // Time to draw the arc up to this circle (relative to maxDrawProgress)
    const drawTime = pos.progress * baseAnimationDuration;
    // Add pauses from all previous circles
    const previousPauses = index * timingConfig.pauseDuration;
    return animationStartFrame + drawTime + previousPauses;
  });

  // Entrance animation for the side super
  const entranceProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: timingConfig.entranceDuration,
  });

  const translateX = interpolate(entranceProgress, [0, 1], [-width, 0]);

  return (
    <AbsoluteFill>
      {/* Side super background */}
      <Img
        src={staticFile("side-super.svg")}
        style={{
          position: "absolute",
          height: "100%",
          objectFit: "contain",
          transform: `translateX(${translateX}px)`,
        }}
      />

      {/* Dotted circle animation container with integrated circle nodes */}
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
        <DottedCircleAnimation
          circleStartFrames={circleStartFrames}
          circlePositions={circlePositions}
          pauseDuration={timingConfig.pauseDuration}
          baseAnimationDuration={baseAnimationDuration}
          animationStartFrame={animationStartFrame}
          circleSize={styleConfig.size}
          circleIcon={styleConfig.icon}
          animationTiming={timingConfig}
          fps={fps}
          maxDrawProgress={maxDrawProgress}
        />
      </div>
    </AbsoluteFill>
  );
};
