import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
  Easing,
} from 'remotion';

export const Transition: React.FC = () => {
  const videoConfig = useVideoConfig();
  const frame = useCurrentFrame();

  const fastTransitionDuration = videoConfig.durationInFrames / 4;

  const pauseStartFrame = 30;
  const swipeAwayStartFrame = 40;
  const swipeAwayEndFrame = 45;
  const starScaleEndFrame = 50;

  const positionAtPause = interpolate(
    pauseStartFrame,
    [0, fastTransitionDuration],
    [1920, -2900]
  );

  const swipeProgress = interpolate(
    frame,
    [0, pauseStartFrame, swipeAwayStartFrame, swipeAwayEndFrame],
    [1920, positionAtPause, positionAtPause, -2900],
    {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)}
  );

  const rectangleDesiredProgress = interpolate(
    frame,
    [0, pauseStartFrame, 35, 45],
    [1920, positionAtPause, positionAtPause, -2900],
    {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)}
  );

  const rectangleOffset = rectangleDesiredProgress - swipeProgress;

  const starScale = interpolate(
    frame,
    [35, 40, starScaleEndFrame],
    [1, 0.4, 0.2],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)}
  );
 
  const pauseEndFrame = 40;
  const transitionEndFrame = 50;

  const motionBlurAmount = interpolate(
    frame,
    [
      0,
      pauseStartFrame - 5,
      pauseStartFrame,
      pauseEndFrame,
      pauseEndFrame + 5,
      transitionEndFrame,
    ],
    [12, 8 , 0, 0, 24, 0],
    {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease)}
  );
 
  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          transform: `translateX(${swipeProgress}px)`,
          display: 'flex',
          flexDirection: 'row',
          filter: `blur(${motionBlurAmount}px)`,
        }}
       >
        <Img
          src={staticFile('starvector.svg')}
          style={{
            transform: `scale(${starScale})`,
            width: 1920,
            height: 1080,
            flexShrink: 0,
            marginRight: '-1000px',
            position: 'relative',
            zIndex: 1,
          }}
        />
        <Img
          src={staticFile('rectanglevector.svg')}
          style={{
            width: 1920,
            height: 1080,
            flexShrink: 0,
            transform: `translateX(${rectangleOffset}px)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};  