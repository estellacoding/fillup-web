import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

interface BucketVisualizerProps {
  currentAmount: number;
  dailyGoal: number;
  isAnimating?: boolean;
  onAnimationComplete?: () => void;
}

const BucketVisualizer: React.FC<BucketVisualizerProps> = React.memo(({
  currentAmount,
  dailyGoal,
  onAnimationComplete
}) => {
  const percentage = Math.min((currentAmount / dailyGoal) * 100, 100);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousPercentage, setPreviousPercentage] = useState(0);
  
  // Animation controls for better performance
  const bucketControls = useAnimation();

  // Memoized celebration handler for better performance
  const handleCelebration = useCallback(async () => {
    setShowCelebration(true);
    
    // Trigger bucket celebration animation
    await bucketControls.start({
      scale: [1, 1.1, 1],
      rotate: [0, 2, -2, 0],
      transition: {
        duration: 0.8,
        ease: "easeInOut",
        repeat: 2
      }
    });
    
    // Hide celebration after animation
    setTimeout(() => setShowCelebration(false), 2000);
    
    // Call completion callback if provided
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  }, [bucketControls, onAnimationComplete]);

  // Trigger celebration when goal is reached
  useEffect(() => {
    if (percentage >= 100 && previousPercentage < 100) {
      handleCelebration();
    }
    setPreviousPercentage(percentage);
  }, [percentage, previousPercentage, handleCelebration]);

  // Memoized dimensions for performance
  const dimensions = useMemo(() => ({
    bucketWidth: 160,
    bucketHeight: 200,
    get waterHeight() {
      return (percentage / 100) * (this.bucketHeight - 20);
    }
  }), [percentage]);

  // Optimized animation variants with GPU acceleration
  const animationVariants = useMemo(() => ({
    bucket: {
      initial: { 
        scale: 1,
        willChange: 'transform' // Enable GPU acceleration
      },
      celebrating: {
        scale: [1, 1.1, 1],
        rotate: [0, 2, -2, 0],
        transition: {
          duration: 0.8,
          ease: "easeInOut",
          repeat: 2
        }
      }
    },
    water: {
      initial: { 
        scaleY: 0, 
        opacity: 0.8,
        transformOrigin: 'bottom',
        willChange: 'transform, opacity' // Enable GPU acceleration
      },
      animate: { 
        scaleY: 1,
        opacity: 0.9,
        transition: {
          duration: 1.5,
          ease: "easeOut",
          type: "spring",
          stiffness: 100,
          damping: 15
        }
      }
    },
    celebration: {
      initial: { 
        scale: 0, 
        opacity: 0,
        willChange: 'transform, opacity'
      },
      animate: {
        scale: [0, 1.2, 1],
        opacity: [0, 1, 1],
        transition: {
          duration: 0.6,
          ease: "easeOut"
        }
      },
      exit: {
        scale: 0,
        opacity: 0,
        transition: { duration: 0.3 }
      }
    },
    surface: {
      animate: {
        ry: [6, 8, 6],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    },
    wave: {
      animate: {
        x: [-20, 0],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }
      }
    }
  }), []);

  return (
    <div className="flex flex-col items-center relative">
      {/* Celebration overlay with GPU acceleration */}
      <AnimatePresence mode="wait">
        {showCelebration && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            variants={animationVariants.celebration}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="bg-yellow-400 text-yellow-900 px-6 py-3 rounded-full font-bold text-lg shadow-lg transform-gpu">
              🎉 目標達成！ 🎉
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main bucket container with GPU acceleration */}
      <motion.div
        className="relative transform-gpu"
        animate={bucketControls}
        initial={animationVariants.bucket.initial}
        style={{ willChange: 'transform' }}
      >
        <svg
          width={dimensions.bucketWidth}
          height={dimensions.bucketHeight}
          viewBox={`0 0 ${dimensions.bucketWidth} ${dimensions.bucketHeight}`}
          className="drop-shadow-lg"
          style={{ willChange: 'auto' }}
        >
          {/* Bucket outline */}
          <defs>
            <linearGradient id="bucketGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
            
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>

            {/* Water surface animation with GPU acceleration */}
            <pattern id="waterSurface" patternUnits="userSpaceOnUse" width="20" height="4">
              <motion.rect
                width="20"
                height="4"
                fill="rgba(147, 197, 253, 0.3)"
                variants={animationVariants.wave}
                animate="animate"
                style={{ willChange: 'transform' }}
              />
            </pattern>
          </defs>

          {/* Bucket body */}
          <path
            d={`M 20 20 L 140 20 L 150 ${dimensions.bucketHeight - 10} L 10 ${dimensions.bucketHeight - 10} Z`}
            fill="none"
            stroke="url(#bucketGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Bucket bottom */}
          <ellipse
            cx={dimensions.bucketWidth / 2}
            cy={dimensions.bucketHeight - 10}
            rx="70"
            ry="8"
            fill="url(#bucketGradient)"
          />

          {/* Water fill with optimized animation */}
          <motion.g
            style={{ 
              transformOrigin: `${dimensions.bucketWidth / 2}px ${dimensions.bucketHeight - 10}px`,
              willChange: 'transform, opacity'
            }}
            variants={animationVariants.water}
            initial="initial"
            animate="animate"
            onAnimationComplete={onAnimationComplete}
          >
            <path
              d={`M 20 ${dimensions.bucketHeight - 10 - dimensions.waterHeight} L 140 ${dimensions.bucketHeight - 10 - dimensions.waterHeight} L 150 ${dimensions.bucketHeight - 10} L 10 ${dimensions.bucketHeight - 10} Z`}
              fill="url(#waterGradient)"
            />
          </motion.g>

          {/* Water surface with wave effect */}
          {dimensions.waterHeight > 0 && (
            <motion.ellipse
              cx={dimensions.bucketWidth / 2}
              cy={dimensions.bucketHeight - 10 - dimensions.waterHeight}
              rx="70"
              ry="6"
              fill="url(#waterSurface)"
              variants={animationVariants.surface}
              animate="animate"
              style={{ willChange: 'transform' }}
            />
          )}

          {/* Measurement marks */}
          {[25, 50, 75].map((mark) => (
            <g key={mark}>
              <line
                x1="15"
                y1={dimensions.bucketHeight - 10 - (mark / 100) * (dimensions.bucketHeight - 20)}
                x2="25"
                y2={dimensions.bucketHeight - 10 - (mark / 100) * (dimensions.bucketHeight - 20)}
                stroke="#64748b"
                strokeWidth="2"
              />
              <text
                x="5"
                y={dimensions.bucketHeight - 10 - (mark / 100) * (dimensions.bucketHeight - 20) + 4}
                fontSize="10"
                fill="#64748b"
                textAnchor="end"
              >
                {mark}%
              </text>
            </g>
          ))}

          {/* Percentage display */}
          <text
            x={dimensions.bucketWidth / 2}
            y={dimensions.bucketHeight / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="24"
            fontWeight="bold"
            fill={percentage > 50 ? "#ffffff" : "#1e40af"}
            className="drop-shadow-sm"
          >
            {Math.round(percentage)}%
          </text>
        </svg>
      </motion.div>

      {/* Amount display */}
      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <p className="text-lg font-semibold text-gray-800">
          {currentAmount.toLocaleString()}ml
        </p>
        <p className="text-sm text-gray-600">
          目標: {dailyGoal.toLocaleString()}ml
        </p>
        {percentage >= 100 && (
          <p className="text-sm text-green-600 font-medium mt-1">
            ✅ 今日目標已達成！
          </p>
        )}
      </motion.div>
    </div>
  );
});

BucketVisualizer.displayName = 'BucketVisualizer';

export default BucketVisualizer;