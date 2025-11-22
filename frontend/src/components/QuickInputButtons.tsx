import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Droplets } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QuickInputButtonsProps {
  onVolumeSelect: (volume: number) => void;
  isLoading: boolean;
  presetVolumes?: number[];
}

const QuickInputButtons: React.FC<QuickInputButtonsProps> = React.memo(({
  onVolumeSelect,
  isLoading,
  presetVolumes = [250, 350, 500]
}) => {
  const { t } = useTranslation();
  const [customVolume, setCustomVolume] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [clickedButton, setClickedButton] = useState<number | null>(null);

  const handlePresetClick = useCallback(async (volume: number) => {
    setClickedButton(volume);
    onVolumeSelect(volume);
    // Reset clicked state after animation
    setTimeout(() => setClickedButton(null), 300);
  }, [onVolumeSelect]);

  const handleCustomSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const volume = parseInt(customVolume);

    // Validation
    if (isNaN(volume)) {
      setValidationError(t('validation.invalidNumber'));
      return;
    }

    if (volume < 1 || volume > 5000) {
      setValidationError(t('validation.volumeRange'));
      return;
    }

    setValidationError('');
    onVolumeSelect(volume);
    setCustomVolume('');
    setShowCustomInput(false);
  }, [customVolume, onVolumeSelect, t]);

  const handleCustomVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomVolume(e.target.value);
    if (validationError) {
      setValidationError('');
    }
  }, [validationError]);

  // Memoized animation variants for performance
  const animationVariants = useMemo(() => ({
    button: {
      initial: { 
        scale: 1,
        willChange: 'transform'
      },
      hover: { 
        scale: 1.05,
        transition: { duration: 0.2 }
      },
      tap: { 
        scale: 0.95,
        transition: { duration: 0.1 }
      },
      clicked: {
        scale: [1, 0.9, 1.1, 1],
        backgroundColor: ['#3b82f6', '#10b981', '#3b82f6'],
        transition: { duration: 0.3 }
      }
    },
    container: {
      hidden: { 
        opacity: 0, 
        y: 20,
        willChange: 'transform, opacity'
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.3,
          staggerChildren: 0.1
        }
      }
    },
    item: {
      hidden: { 
        opacity: 0, 
        y: 10,
        willChange: 'transform, opacity'
      },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.2 }
      }
    }
  }), []);

  return (
    <motion.div
      className="space-y-6"
      variants={animationVariants.container}
      initial="hidden"
      animate="visible"
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Preset volume buttons */}
      <motion.div variants={animationVariants.item}>
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-500" />
          {t('quickInput.title')}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {presetVolumes.map((volume) => (
            <motion.button
              key={volume}
              onClick={() => handlePresetClick(volume)}
              disabled={isLoading}
              className={`
                relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 
                hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500
                text-white font-semibold py-4 px-4 rounded-xl shadow-lg
                transition-all duration-200 transform
                ${clickedButton === volume ? 'ring-4 ring-green-300' : ''}
              `}
              variants={animationVariants.button}
              initial="initial"
              whileHover={!isLoading ? "hover" : "initial"}
              whileTap={!isLoading ? "tap" : "initial"}
              animate={clickedButton === volume ? "clicked" : "initial"}
              style={{ willChange: 'transform' }}
            >
              {/* Loading spinner overlay */}
              <AnimatePresence>
                {isLoading && clickedButton === volume && (
                  <motion.div
                    className="absolute inset-0 bg-blue-600 bg-opacity-90 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl font-bold">{volume}</span>
                <span className="text-xs opacity-90">ml</span>
              </div>

              {/* Success checkmark */}
              <AnimatePresence>
                {clickedButton === volume && !isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-white text-xl">✓</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Custom volume input */}
      <motion.div variants={animationVariants.item}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-500" />
            {t('quickInput.customVolume')}
          </h3>
          <motion.button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showCustomInput ? t('common.collapse') : t('common.expand')}
          </motion.button>
        </div>

        <AnimatePresence>
          {showCustomInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleCustomSubmit} className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={customVolume}
                      onChange={handleCustomVolumeChange}
                      placeholder={t('quickInput.placeholder')}
                      min="1"
                      max="5000"
                      className={`
                        w-full px-4 py-3 border-2 rounded-xl 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        transition-all duration-200
                        ${validationError 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300 bg-white hover:border-gray-400'
                        }
                      `}
                    />
                    <AnimatePresence>
                      {validationError && (
                        <motion.p
                          className="text-red-500 text-sm mt-1"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          {validationError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <motion.button
                    type="submit"
                    disabled={isLoading || !customVolume}
                    className={`
                      px-6 py-3 rounded-xl font-semibold transition-all duration-200
                      ${isLoading || !customVolume
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg'
                      }
                    `}
                    whileHover={!isLoading && customVolume ? { scale: 1.05 } : {}}
                    whileTap={!isLoading && customVolume ? { scale: 0.95 } : {}}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      t('quickInput.record')
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick tips */}
      <motion.div
        variants={animationVariants.item}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4"
      >
        <p className="text-sm text-blue-800">
          {t('quickInput.tip')}
        </p>
      </motion.div>
    </motion.div>
  );
});

QuickInputButtons.displayName = 'QuickInputButtons';

export default QuickInputButtons;