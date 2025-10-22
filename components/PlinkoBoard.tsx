import React, { useMemo, useState, useEffect, useRef } from 'react';
import { RiskLevel, RowCount, BallType, PayoutAnimationType, GlowEffectType } from '../types';
import { MULTIPLIERS, getMultiplierColor } from '../constants';

// Added a global declaration for Matter.js, which is loaded from a script tag in index.html
declare const Matter: any;

const BOARD_WIDTH = 600;
const BOARD_HEIGHT = 650;
const PEG_RADIUS = 5;
const BALL_RADIUS = 10;

// Physics Parameters Tuned for more grounded feel
const GRAVITY_Y = 1.8;
const BALL_RESTITUTION = 0.3; // Less bouncy
const BALL_FRICTION = 0.1;
const BALL_FRICTION_AIR = 0.02; // More air resistance
const PEG_RESTITUTION = 0.4;
const PEG_FRICTION = 0.5; // More friction to dampen horizontal movement


// A simple presentational component for the ball, positioned via transform
const Ball = React.forwardRef<HTMLDivElement, { ball: BallType }>(({ ball }, ref) => (
  <div
    ref={ref}
    className="absolute rounded-full"
    style={{
      width: BALL_RADIUS * 2,
      height: BALL_RADIUS * 2,
      backgroundColor: ball.color,
      boxShadow: `0 0 15px ${ball.color}, 0 0 25px ${ball.color}55`,
      // Position is set via transform for performance
    }}
  />
));

// Component for the multiplier text animation
const PayoutAnimation = ({ animation }: { animation: PayoutAnimationType }) => (
    <div
        className="absolute text-white font-bold text-lg animate-fade-up-out pointer-events-none"
        style={{
            left: animation.x,
            top: animation.y,
            transform: `translateX(-50%)`,
            color: animation.payout >= animation.betAmount ? '#65ff8d' : '#ff6565',
            textShadow: '0 0 5px rgba(0,0,0,0.7)'
        }}
    >
        {animation.multiplier}x
    </div>
);

// New component for the bucket glow effect
const BucketGlow = ({ effect }: { effect: GlowEffectType }) => (
    <div
        className="absolute animate-bucket-glow pointer-events-none"
        style={{
            left: effect.x,
            top: effect.y,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${effect.color}44, transparent 70%)`
        }}
    />
);


interface PlinkoBoardProps {
    rows: RowCount;
    risk: RiskLevel;
    balls: BallType[];
    onAnimationEnd: (id: number, bucketIndex: number, betAmount: number) => void;
}

export const PlinkoBoard: React.FC<PlinkoBoardProps> = ({ rows, risk, balls, onAnimationEnd }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<any>(null);
    const ballRefs = useRef<{ [key: number]: React.RefObject<HTMLDivElement> }>({});
    const bodiesMap = useRef<{ [key: number]: any }>({});
    const [payoutAnimations, setPayoutAnimations] = useState<PayoutAnimationType[]>([]);
    const [glowEffects, setGlowEffects] = useState<GlowEffectType[]>([]);
    const [hitBucketIndex, setHitBucketIndex] = useState<number | null>(null);

    // Memoize static DOM elements (pegs, buckets) based on a dynamic layout
    const { pegPositions, bucketPositions } = useMemo(() => {
        const pegs: { x: number, y: number }[] = [];
        const buckets: { x: number, y: number, multiplier: number }[] = [];
        
        const topMargin = 80;
        const bottomMargin = 20;
        const bucketHeight = 40;
        const pegAreaHeight = BOARD_HEIGHT - topMargin - bottomMargin - bucketHeight;
        const verticalSpacing = pegAreaHeight / rows;
        const horizontalSpacing = BOARD_WIDTH / (rows + 1);

        for (let i = 0; i < rows; i++) {
            const pegsInRow = i + 2;
            const rowY = topMargin + i * verticalSpacing;
            const rowStartX = (BOARD_WIDTH - (pegsInRow - 1) * horizontalSpacing) / 2;
            for (let j = 0; j < pegsInRow; j++) {
                pegs.push({ x: rowStartX + j * horizontalSpacing, y: rowY });
            }
        }
        
        const multipliers = MULTIPLIERS[risk][rows];
        const bucketY = topMargin + pegAreaHeight;
        const bucketStartX = (BOARD_WIDTH - (multipliers.length) * horizontalSpacing) / 2 + horizontalSpacing/2;

        for (let i = 0; i < multipliers.length; i++) {
            buckets.push({
                x: bucketStartX + i * horizontalSpacing,
                y: bucketY,
                multiplier: multipliers[i],
            });
        }
        return { pegPositions: pegs, bucketPositions: buckets };
    }, [rows, risk]);


    // One-time setup for the physics world
    useEffect(() => {
        const { Engine, Runner, Bodies, Composite, Events } = Matter;
        const engine = Engine.create({ gravity: { y: GRAVITY_Y } });
        engineRef.current = engine;
        
        const staticBodies = [];
        
        // Walls
        staticBodies.push(Bodies.rectangle(-10, BOARD_HEIGHT/2, 20, BOARD_HEIGHT, { isStatic: true }));
        staticBodies.push(Bodies.rectangle(BOARD_WIDTH + 10, BOARD_HEIGHT/2, 20, BOARD_HEIGHT, { isStatic: true }));
        
        // Pegs (reverted to circles for natural bouncing)
        pegPositions.forEach(peg => {
            staticBodies.push(Bodies.circle(peg.x, peg.y, PEG_RADIUS, {
                isStatic: true,
                restitution: PEG_RESTITUTION,
                friction: PEG_FRICTION,
                label: 'peg'
            }));
        });

        // Buckets (dividers and sensors)
        const bucketBaseY = bucketPositions[0].y + 20;
        const bucketWidth = BOARD_WIDTH / bucketPositions.length;
        
        for (let i = 0; i <= bucketPositions.length; i++) {
            const dividerX = (i * bucketWidth) - (bucketWidth/2) + bucketPositions[0].x - bucketWidth/2;
            staticBodies.push(Bodies.rectangle(dividerX, bucketBaseY, 4, 40, { isStatic: true }));
        }

        bucketPositions.forEach((bucket, i) => {
            staticBodies.push(Bodies.rectangle(bucket.x, bucketBaseY + 5, bucketWidth * 0.9, 10, { 
                isStatic: true,
                isSensor: true,
                label: `bucket-${i}`
            }));
        });
        
        Composite.add(engine.world, staticBodies);

        // Collision handling
        const collisionCallback = (event: any) => {
            event.pairs.forEach((pair: any) => {
                const { bodyA, bodyB } = pair;
                let ballBody, bucketBody;
                if (bodyA.label.startsWith('ball-') && bodyB.label.startsWith('bucket-')) {
                    ballBody = bodyA; bucketBody = bodyB;
                } else if (bodyB.label.startsWith('ball-') && bodyA.label.startsWith('bucket-')) {
                    ballBody = bodyB; bucketBody = bodyA;
                }

                if (ballBody && bucketBody && !ballBody.isHandled) {
                    ballBody.isHandled = true; // Prevent multiple triggers
                    const ballId = parseInt(ballBody.label.split('-')[1], 10);
                    const bucketIndex = parseInt(bucketBody.label.split('-')[1], 10);
                    const betAmount = ballBody.betAmount;
                    
                    // Call parent handler, which will trigger a state update and removal from the `balls` prop array
                    onAnimationEnd(ballId, bucketIndex, betAmount);

                    setHitBucketIndex(bucketIndex);
                    setTimeout(() => setHitBucketIndex(null), 200);

                    const multipliers = MULTIPLIERS[risk][rows];
                    const multiplier = multipliers[bucketIndex];
                    const payout = betAmount * multiplier;

                    // Trigger payout text animation
                    const newAnimation: PayoutAnimationType = {
                        id: ballId,
                        x: ballBody.position.x,
                        y: bucketPositions[0].y - 20,
                        multiplier,
                        payout,
                        betAmount
                    };
                    setPayoutAnimations(prev => [...prev, newAnimation]);
                    setTimeout(() => {
                        setPayoutAnimations(prev => prev.filter(p => p.id !== newAnimation.id));
                    }, 1500);

                    // Trigger bucket glow effect
                    const newGlow: GlowEffectType = {
                        id: ballId,
                        x: bucketPositions[bucketIndex].x,
                        y: bucketPositions[bucketIndex].y + 20, // Center of bucket
                        color: ballBody.color,
                    };
                    setGlowEffects(prev => [...prev, newGlow]);
                    setTimeout(() => {
                        setGlowEffects(prev => prev.filter(g => g.id !== newGlow.id));
                    }, 1000);
                }
            });
        };
        Events.on(engine, 'collisionStart', collisionCallback);

        // Game loop
        const runner = Runner.create();
        const run = () => {
            if (!engineRef.current) return;
            Runner.tick(runner, engine, 1000 / 60);

            for (const ballId in bodiesMap.current) {
                const body = bodiesMap.current[ballId];
                const ballRef = ballRefs.current[ballId];
                if (body && ballRef?.current) {
                    ballRef.current.style.transform = `translate(${body.position.x - BALL_RADIUS}px, ${body.position.y - BALL_RADIUS}px) rotate(${body.angle}rad)`;
                }
            }
            requestAnimationFrame(run);
        };
        run();
        
        return () => {
            Events.off(engine, 'collisionStart', collisionCallback);
            Runner.stop(runner);
            Engine.clear(engine);
            engineRef.current = null;
        };
    }, [pegPositions, bucketPositions, onAnimationEnd, risk, rows]);

    // Effect to robustly sync React state with the Matter.js world, fixing the ghost ball bug.
    useEffect(() => {
        if (!engineRef.current) return;
        const { Bodies, Composite } = Matter;
        const world = engineRef.current.world;

        const ballIdsFromProps = new Set(balls.map(b => b.id));
        const knownBodyIds = new Set(Object.keys(bodiesMap.current).map(Number));

        // Add new balls that are in props but not in our physics world
        balls.forEach(ball => {
            if (!knownBodyIds.has(ball.id)) {
                const jitter = (Math.random() - 0.5) * 5;
                const body = Bodies.circle(ball.x + jitter, 20, BALL_RADIUS, {
                    restitution: BALL_RESTITUTION,
                    friction: BALL_FRICTION,
                    frictionAir: BALL_FRICTION_AIR,
                    label: `ball-${ball.id}`,
                });
                body.betAmount = ball.betAmount;
                body.color = ball.color;
                
                bodiesMap.current[ball.id] = body;
                ballRefs.current[ball.id] = React.createRef();
                Composite.add(world, body);
            }
        });

        // Remove old balls that are in our physics world but no longer in props
        for (const bodyId of knownBodyIds) {
            if (!ballIdsFromProps.has(bodyId)) {
                Composite.remove(world, bodiesMap.current[bodyId]);
                delete bodiesMap.current[bodyId];
                delete ballRefs.current[bodyId];
            }
        }
    }, [balls]);


    return (
        <div className="flex-1 flex justify-center items-center relative overflow-hidden" ref={containerRef}>
            <div className="relative" style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}>
                {pegPositions.map((peg, i) => (
                    <div
                        key={i}
                        className="absolute bg-slate-600 rounded-full"
                        style={{
                            width: PEG_RADIUS * 2,
                            height: PEG_RADIUS * 2,
                            left: peg.x - PEG_RADIUS,
                            top: peg.y - PEG_RADIUS,
                        }}
                    />
                ))}
                
                <div className="absolute left-0 right-0 flex justify-center" style={{ top: bucketPositions[0]?.y || BOARD_HEIGHT - 60 }}>
                    {bucketPositions.map((bucket, i) => (
                        <div
                            key={i}
                            className={`h-10 flex items-center justify-center font-bold text-sm text-white rounded-md bg-gradient-to-b ${getMultiplierColor(bucket.multiplier)} transition-transform duration-100 ease-in-out ${i === hitBucketIndex ? 'scale-95' : ''}`}
                            style={{
                                width: `${100 / bucketPositions.length}%`,
                                boxShadow: `inset 0 -2px 4px rgba(0,0,0,0.3)`,
                                borderRight: i === bucketPositions.length - 1 ? 'none' : '2px solid #0f172a'
                            }}
                        >
                            {bucket.multiplier}x
                        </div>
                    ))}
                </div>

                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {glowEffects.map(effect => (
                        <BucketGlow key={effect.id} effect={effect} />
                    ))}
                </div>

                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {balls.map(ball => (
                        <Ball
                            key={ball.id}
                            ref={ballRefs.current[ball.id]}
                            ball={ball}
                        />
                    ))}
                </div>
                 <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {payoutAnimations.map(anim => (
                        <PayoutAnimation key={anim.id} animation={anim} />
                    ))}
                </div>
            </div>
        </div>
    );
};