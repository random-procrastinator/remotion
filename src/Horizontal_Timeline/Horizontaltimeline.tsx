import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
  spring,
} from "remotion";
import { z } from "zod";

// Schema for individual timeline items
const timelineItemSchema = z.object({
  id: z.number(),
  icon: z.string().describe("SVG filename without extension"),
  size: z.number().min(30).max(200).default(80),
  labelText: z.string().optional(),
});

// Schema for title styling
const titleStyleSchema = z.object({
  text: z.string(),
  fontSize: z.number().min(12).max(120).default(48),
  color: z.string().default("#FFFFFF"),
  fontFamily: z.string().default("Arial, sans-serif"),
  fontWeight: z
    .enum([
      "normal",
      "bold",
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
    ])
    .default("bold"),
  topOffset: z.number().default(60),
});

// Schema for line/path styling
const lineStyleSchema = z.object({
  color: z.string().default("#FFA500"),
  strokeWidth: z.number().min(1).max(30).default(10),
  dotSize: z.number().min(2).max(30).default(10),
  gapSize: z.number().min(2).max(50).default(15),
  yOffset: z.number().default(80).describe("Vertical offset from center"),
});

// Schema for circle/node styling
const circleStyleSchema = z.object({
  backgroundColor: z.string().default("#FFFFFF"),
  iconScale: z
    .number()
    .min(0.3)
    .max(1)
    .default(0.6)
    .describe("Icon size relative to circle"),
});

// Schema for label styling
const labelStyleSchema = z.object({
  fontSize: z.number().min(10).max(48).default(20),
  color: z.string().default("#FFFFFF"),
  fontFamily: z.string().default("Arial, sans-serif"),
  fontWeight: z
    .enum([
      "normal",
      "bold",
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
    ])
    .default("bold"),
  offsetY: z.number().default(30).describe("Distance below the circle"),
  width: z.number().default(160),
});

// Schema for animation timing
const animationTimingSchema = z.object({
  titleDuration: z.number().min(10).max(60).default(30),
  circleGrowDuration: z.number().min(5).max(30).default(10),
  circleSettleDuration: z.number().min(3).max(20).default(5),
  labelFadeInDuration: z.number().min(3).max(20).default(5),
  pauseDuration: z.number().min(5).max(30).default(15),
  // NEW: Animation variant/easing type
  easingType: z
    .enum(["linear", "smooth", "bouncy", "snappy", "spring"])
    .default("linear")
    .describe("Animation easing style"),
});

// Main schema for the timeline component
export const horizontalTimelineSchema = z.object({
  // Required data
  items: z.array(timelineItemSchema).min(1).max(10),

  // Title configuration
  title: titleStyleSchema.optional().default({
    text: "Timeline",
    fontSize: 48,
    color: "#FFFFFF",
    fontFamily: "Arial, sans-serif",
    fontWeight: "bold",
    topOffset: 60,
  }),

  // Styling options
  backgroundColor: z.string().default("#000000"),
  lineStyle: lineStyleSchema.optional().default({
    color: "#FFA500",
    strokeWidth: 10,
    dotSize: 10,
    gapSize: 15,
    yOffset: 80,
  }),
  circleStyle: circleStyleSchema.optional().default({
    backgroundColor: "#FFFFFF",
    iconScale: 0.6,
  }),
  labelStyle: labelStyleSchema.optional().default({
    fontSize: 20,
    color: "#FFFFFF",
    fontFamily: "Arial, sans-serif",
    fontWeight: "bold",
    offsetY: 30,
    width: 160,
  }),

  // Animation timing
  animationTiming: animationTimingSchema.optional().default({
    titleDuration: 30,
    circleGrowDuration: 10,
    circleSettleDuration: 5,
    labelFadeInDuration: 5,
    pauseDuration: 15,
    easingType: "linear",
  }),
});

// Export the type for external use
export type HorizontalTimelineProps = z.infer<typeof horizontalTimelineSchema>;

// Helper function to get spring config based on easing type
const getSpringConfig = (easingType: string) => {
  switch (easingType) {
    case "smooth":
      return { damping: 200 }; // Smooth, no bounce
    case "bouncy":
      return { damping: 8 }; // Bouncy entrance
    case "snappy":
      return { damping: 20, stiffness: 200 }; // Snappy, minimal bounce
    case "spring":
      return { damping: 10, stiffness: 100 }; // Default spring with bounce
    case "linear":
    default:
      return null; // Use interpolate instead
  }
};

// Circle component props with styling options
interface CircleProps {
  startFrame: number;
  x: number;
  y: number;
  size: number;
  iconName: string;
  labelText?: string;
  // Styling props
  iconScale: number;
  labelStyle: z.infer<typeof labelStyleSchema>;
  animationTiming: z.infer<typeof animationTimingSchema>;
  fps: number;
}

const Circle: React.FC<CircleProps> = ({
  startFrame,
  x,
  y,
  size,
  iconName,
  labelText,
  iconScale,
  labelStyle,
  animationTiming,
  fps,
}) => {
  const frame = useCurrentFrame();

  if (frame < startFrame) {
    return null;
  }

  const frameSinceStart = frame - startFrame;
  const {
    circleGrowDuration,
    circleSettleDuration,
    labelFadeInDuration,
    easingType,
  } = animationTiming;

  const springConfig = getSpringConfig(easingType);
  let scale = 0;

  if (springConfig) {
    // Use spring animation for non-linear easing types
    const springValue = spring({
      frame: frameSinceStart,
      fps,
      config: springConfig,
      durationInFrames: circleGrowDuration + circleSettleDuration,
    });
    scale = springValue;
  } else {
    // Use linear interpolate (original behavior)
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

  // Calculate opacity for label text fade-in
  const labelStartFrame =
    startFrame + circleGrowDuration + circleSettleDuration;
  let labelOpacity = 0;

  if (frame >= labelStartFrame) {
    const labelFrameSinceStart = frame - labelStartFrame;
    labelOpacity = interpolate(
      labelFrameSinceStart,
      [0, labelFadeInDuration],
      [0, 1],
      {
        extrapolateRight: "clamp",
      },
    );
  }

  const iconSize = size * iconScale;

  return (
    <>
      {/* Solid fill circle background */}
      <Img
        src={staticFile("solidfillcircle.svg")}
        width={size}
        height={size}
        style={{
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2,
          transform: `scale(${scale})`,
        }}
      />

      {/* Icon centered in the circle */}
      <Img
        src={staticFile(`${iconName}.svg`)}
        width={iconSize}
        height={iconSize}
        style={{
          position: "absolute",
          left: x - iconSize / 2,
          top: y - iconSize / 2,
          transform: `scale(${scale})`,
          objectFit: "contain",
        }}
      />

      {/* Label text below the circle */}
      {labelText && (
        <div
          style={{
            position: "absolute",
            left: x - labelStyle.width / 2,
            top: y + size / 2 + labelStyle.offsetY,
            width: labelStyle.width,
            textAlign: "center",
            fontSize: `${labelStyle.fontSize}px`,
            fontWeight: labelStyle.fontWeight,
            color: labelStyle.color,
            opacity: labelOpacity,
            fontFamily: labelStyle.fontFamily,
          }}
        >
          {labelText}
        </div>
      )}
    </>
  );
};

export const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({
  items,
  title,
  backgroundColor = "#000000",
  lineStyle,
  circleStyle,
  labelStyle,
  animationTiming,
}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames, fps } = useVideoConfig();

  const titleConfig = title ?? {
    text: "Timeline",
    fontSize: 48,
    color: "#FFFFFF",
    fontFamily: "Arial, sans-serif",
    fontWeight: "bold" as const,
    topOffset: 60,
  };

  const lineConfig = lineStyle ?? {
    color: "#FFA500",
    strokeWidth: 10,
    dotSize: 10,
    gapSize: 15,
    yOffset: 80,
  };

  const circleConfig = circleStyle ?? {
    backgroundColor: "#FFFFFF",
    iconScale: 0.6,
  };

  const labelConfig = labelStyle ?? {
    fontSize: 20,
    color: "#FFFFFF",
    fontFamily: "Arial, sans-serif",
    fontWeight: "bold" as const,
    offsetY: 30,
    width: 160,
  };

  const timingConfig = animationTiming ?? {
    titleDuration: 30,
    circleGrowDuration: 10,
    circleSettleDuration: 5,
    labelFadeInDuration: 5,
    pauseDuration: 15,
    easingType: "linear" as const,
  };

  const count = items.length;
  const padding = 0;
  const pathY = height / 2 + lineConfig.yOffset;
  const pathStart = padding;
  const pathEnd = width - padding;
  const pathWidth = pathEnd - pathStart;

  const path = `M ${pathStart}, ${pathY} L ${pathEnd}, ${pathY}`;
  const pathLength = pathWidth;

  const totalPauseDuration = count * timingConfig.pauseDuration;
  const drawDuration = durationInFrames - totalPauseDuration;

  if (drawDuration <= 0) {
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          color: "red",
          fontSize: 24,
          backgroundColor,
        }}
      >
        Duration too short for {count} items.
      </AbsoluteFill>
    );
  }

  // Generate circle positions from items
  const circlePositions = items.map((item, i) => {
    const xPercent = ((i + 1) / (count + 1)) * 100;
    const x = pathStart + (xPercent / 100) * pathWidth;
    return {
      x,
      y: pathY,
      size: item.size,
      iconName: item.icon,
      id: item.id,
      labelText: item.labelText,
    };
  });

  // Calculate when each circle's animation should start
  const circleStartFrames = circlePositions.map((pos, index) => {
    const drawProgress = (pos.x - pathStart) / pathWidth;
    const drawTime = drawProgress * drawDuration;
    const previousPauses = index * timingConfig.pauseDuration;
    return drawTime + previousPauses;
  });

  // Calculate time spent in pauses up to current frame
  let timeSpentInPauses = 0;
  for (let i = 0; i < count; i++) {
    const circleReachFrame = circleStartFrames[i];
    if (frame >= circleReachFrame + timingConfig.pauseDuration) {
      timeSpentInPauses += timingConfig.pauseDuration;
    } else if (frame >= circleReachFrame) {
      timeSpentInPauses += frame - circleReachFrame;
      break;
    }
  }

  // Calculate line drawing progress
  const timeSpentDrawing = frame - timeSpentInPauses;
  const drawProgress = Math.min(timeSpentDrawing / drawDuration, 1);
  const currentDrawnLength = drawProgress * pathLength;

  // Dynamic stroke-dasharray for dotted line
  const patternSize = lineConfig.dotSize + lineConfig.gapSize;
  const fullPatterns = Math.floor(currentDrawnLength / patternSize);
  const remainder = currentDrawnLength % patternSize;

  const dashArray = [];
  for (let i = 0; i < fullPatterns; i++) {
    dashArray.push(lineConfig.dotSize, lineConfig.gapSize);
  }
  dashArray.push(remainder, pathLength);

  const dashArrayString = dashArray.join(" ");

  // Title animation
  let titleOpacity = 0;
  let titleScale = 0;

  if (frame < timingConfig.titleDuration) {
    titleOpacity = interpolate(
      frame,
      [0, timingConfig.titleDuration * 0.7],
      [0, 1],
      {
        extrapolateRight: "clamp",
      },
    );
    titleScale = interpolate(frame, [0, timingConfig.titleDuration], [0.8, 1], {
      extrapolateRight: "clamp",
    });
  } else {
    titleOpacity = 1;
    titleScale = 1;
  }

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: titleConfig.topOffset,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: `${titleConfig.fontSize}px`,
          fontWeight: titleConfig.fontWeight,
          color: titleConfig.color,
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          fontFamily: titleConfig.fontFamily,
        }}
      >
        {titleConfig.text}
      </div>

      {/* SVG path for dotted line */}
      <svg width={width} height={height}>
        <path
          d={path}
          stroke={lineConfig.color}
          strokeWidth={lineConfig.strokeWidth}
          fill="none"
          strokeDasharray={dashArrayString}
        />
      </svg>

      {/* Circles with icons and labels */}
      {circlePositions.map((pos, i) => (
        <Circle
          key={pos.id}
          startFrame={circleStartFrames[i]}
          x={pos.x}
          y={pos.y}
          size={pos.size}
          iconName={pos.iconName}
          labelText={pos.labelText}
          iconScale={circleConfig.iconScale}
          labelStyle={labelConfig}
          animationTiming={timingConfig}
          fps={fps}
        />
      ))}
    </AbsoluteFill>
  );
};
