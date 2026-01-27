import { useCurrentFrame, interpolate, Easing } from 'remotion';
import React from 'react';

const text = "This is Kinetic Typography";

const letters = text.split('');

export const KineticTypography: React.FC = () => {
	const frame = useCurrentFrame();

	return (
		<div
			style={{
				flex: 1,
				backgroundColor: '#111',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				flexWrap: 'wrap',
				padding: '50px',
				fontFamily: 'Arial, sans-serif',
			}}
		>
			{letters.map((letter, i) => {
				const letterAnimationStartTime = i * 2;
				const animationDuration = 15;

				const progress = interpolate(
					frame - letterAnimationStartTime,
					[0, animationDuration],
					[0, 1],
					{
						easing: Easing.inOut(Easing.ease),
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
					}
				);

				const opacity = interpolate(
					progress,
					[0, 0.5, 1],
					[0, 1, 1]
				);

				const scaleUp = interpolate(
					progress,
					[0, 0.5],
					[0, 1.05],
					{
						easing: Easing.in(Easing.ease),
						extrapolateRight: 'clamp',
					}
				);

				const scaleDown = interpolate(
					progress,
					[0.5, 1],
					[1.05, 1],
					{
						easing: Easing.out(Easing.ease),
						extrapolateLeft: 'clamp',
					}
				);

				const scale = progress < 0.5 ? scaleUp : scaleDown;

				const translateY = interpolate(
					progress,
					[0, 1],
					[10, 0]
				);

				
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							fontSize: '70px',
							fontWeight: 700,
							color: '#fff',
							margin: letter === ' ' ? '0 10px' : '0 1px',
							opacity,
							transform: `scale(${scale}) translateY(${translateY}px)`,
							
						}}
					>
						{letter}
					</span>
				);
			})}
		</div>
	);
};
