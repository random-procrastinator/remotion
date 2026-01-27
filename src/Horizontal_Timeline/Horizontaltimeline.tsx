import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';
import { z } from 'zod';

// Schema definitions
const visualDataItemSchema = z.object({
  id: z.number(),
  icon: z.string(), // SVG filename without extension
  size: z.number().min(30).max(200),
  labelText: z.string().optional(),
  iconLibrary: z.string().optional(),
});

const metadataSchema = z.object({
  title: z.string(),
});

const timelineDataSchema = z.object({
  metadata: metadataSchema,
  visualData: z.array(visualDataItemSchema),
});

// This is the schema that Remotion uses for the form
export const timelineSchemaFromData = z.object({
  data: timelineDataSchema,
});

// This is what the component actually receives from Remotion
type TimelineComponentProps = z.infer<typeof timelineSchemaFromData>;

interface CircleProps {
  startFrame: number;
  x: number;
  y: number;
  size: number;
  iconName: string;
  labelText?: string;
}

const Circle: React.FC<CircleProps> = ({
  startFrame,
  x,
  y,
  size,
  iconName,
  labelText,
}) => {
  const frame = useCurrentFrame();

  if (frame < startFrame) {
    return null;
  }

  const frameSinceStart = frame - startFrame;
  const growDuration = 10;
  const settleDuration = 5;

  let scale = 0;

  if (frameSinceStart < growDuration) {
    scale = interpolate(frameSinceStart, [0, growDuration], [0, 1.2], {
      extrapolateRight: 'clamp',
    });
  } else if (frameSinceStart < growDuration + settleDuration) {
    scale = interpolate(
      frameSinceStart,
      [growDuration, growDuration + settleDuration],
      [1.2, 1],
      {
        extrapolateRight: 'clamp',
      }
    );
  } else {
    scale = 1;
  }

  // Calculate opacity for label text fade-in
  const labelFadeInDuration = 5;
  const labelStartFrame = startFrame + growDuration + settleDuration;
  let labelOpacity = 0;

  if (frame >= labelStartFrame) {
    const labelFrameSinceStart = frame - labelStartFrame;
    labelOpacity = interpolate(
      labelFrameSinceStart,
      [0, labelFadeInDuration],
      [0, 1],
      {
        extrapolateRight: 'clamp',
      }
    );
  }

  return (
    <>
      {/* Solid fill circle background */}
      <Img
        src={staticFile('solidfillcircle.svg')}
        width={size}
        height={size}
        style={{
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          transform: `scale(${scale})`,
        }}
      />

      {/* Icon centered in the circle */}
      <Img
        src={staticFile(`${iconName}.svg`)}
        width={size * 0.6} // Icon takes 60% of circle size
        height={size * 0.6}
        style={{
          position: 'absolute',
          left: x - (size * 0.6) / 2,
          top: y - (size * 0.6) / 2,
          transform: `scale(${scale})`,
          objectFit: 'contain',
        }}
      />

      {/* Label text below the circle */}
      {labelText && (
        <div
          style={{
            position: 'absolute',
            left: x - 80,
            top: y + size / 2 + 30,
            width: 160,
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            opacity: labelOpacity,
            fontFamily: 'Arial, sans-serif',
          }}
        >
          {labelText}
        </div>
      )}
    </>
  );
};

// Component accepts the full props object with 'data' key
export const HorizontalTimelineFromSchema: React.FC<TimelineComponentProps> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const { metadata, visualData } = data;
  const count = visualData.length;

  const padding = 0;
  const pathY = height / 2 + 80; // Shift down to make room for title
  const pathStart = padding;
  const pathEnd = width - padding;
  const pathWidth = pathEnd - pathStart;

  const path = `M ${pathStart}, ${pathY} L ${pathEnd}, ${pathY}`;
  const pathLength = pathWidth;

  const pauseDuration = 15; // Pause for circle animation (grow + settle)
  const totalPauseDuration = count * pauseDuration;
  const drawDuration = durationInFrames - totalPauseDuration;

  if (drawDuration <= 0) {
    return (
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          color: 'red',
          fontSize: 24,
        }}
      >
        Duration too short for {count} items.
      </AbsoluteFill>
    );
  }

  // Generate circle positions from visualData
  const circlePositions = visualData.map((item, i) => {
    // Evenly distribute circles with space at start and end
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

  // Calculate when each circle should start animating
  const circleStartFrames = circlePositions.map((pos) => {
    const drawProgress = (pos.x - pathStart) / pathWidth;
    const startTime = drawProgress * drawDuration;
    return startTime;
  });

  // Calculate how much time has been spent in pauses (circle animations)
  let timeSpentInPauses = 0;
  for (let i = 0; i < count; i++) {
    const startFrame = circleStartFrames[i];
    if (frame >= startFrame + pauseDuration) {
      timeSpentInPauses += pauseDuration;
    } else if (frame >= startFrame) {
      timeSpentInPauses += frame - startFrame;
      break;
    }
  }

  // Calculate actual line drawing progress
  const timeSpentDrawing = frame - timeSpentInPauses;
  const drawProgress = Math.min(timeSpentDrawing / drawDuration, 1);
  const currentDrawnLength = drawProgress * pathLength;

  // Dynamic stroke-dasharray logic for dotted line effect
  const dotSize = 10;
  const gapSize = 15;
  const patternSize = dotSize + gapSize;

  const fullPatterns = Math.floor(currentDrawnLength / patternSize);
  const remainder = currentDrawnLength % patternSize;

  const dashArray = [];
  for (let i = 0; i < fullPatterns; i++) {
    dashArray.push(dotSize, gapSize);
  }
  dashArray.push(remainder, pathLength);

  const dashArrayString = dashArray.join(' ');

  // Title animation
  const titleAnimationDuration = 30;
  let titleOpacity = 0;
  let titleScale = 0;

  if (frame < titleAnimationDuration) {
    titleOpacity = interpolate(frame, [0, titleAnimationDuration * 0.7], [0, 1], {
      extrapolateRight: 'clamp',
    });
    titleScale = interpolate(frame, [0, titleAnimationDuration], [0.8, 1], {
      extrapolateRight: 'clamp',
    });
  } else {
    titleOpacity = 1;
    titleScale = 1;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Title at the top */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '48px',
          fontWeight: 'bold',
          color: 'white',
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {metadata.title}
      </div>

      {/* SVG path for dotted line */}
      <svg width={width} height={height}>
        <path
          d={path}
          stroke="orange"
          strokeWidth={10}
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
        />
      ))}
    </AbsoluteFill>
  );
};