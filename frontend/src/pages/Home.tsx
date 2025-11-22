import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Settings, TrendingUp, Calendar, History, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BucketVisualizer from '../components/BucketVisualizer';
import QuickInputButtons from '../components/QuickInputButtons';
import RecordList from '../components/RecordList';
import RecordEditor from '../components/RecordEditor';
import LanguageSelector from '../components/LanguageSelector';
import { useHydrationStore } from '../store/useHydrationStore';
import { HydrationRecord } from '../types';
import { isToday } from '../utils/time';

const Home: React.FC = React.memo(() => {
  const { t, i18n } = useTranslation();
  const {
    dailyIntake,
    dailyGoal,
    records,
    isLoading,
    isOffline,
    syncStatus,
    addIntake,
    updateRecord,
    deleteRecord,
    loadFromCache,
    initializeNetworkListener,
    calculateDailyIntake
  } = useHydrationStore();

  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HydrationRecord | null>(null);

  // Initialize store and network listener on mount
  useEffect(() => {
    loadFromCache();
    calculateDailyIntake();
    const cleanup = initializeNetworkListener();
    
    return cleanup;
  }, [loadFromCache, calculateDailyIntake, initializeNetworkListener]);

  const handleVolumeSelect = useCallback(async (volume: number) => {
    try {
      setIsAnimating(true);
      await addIntake(volume);
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
      
    } catch (error) {
      console.error('Failed to add intake:', error);
      // TODO: Show error toast
    } finally {
      setIsAnimating(false);
    }
  }, [addIntake]);

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const handleEditRecord = useCallback((record: HydrationRecord) => {
    setEditingRecord(record);
  }, []);

  const handleSaveRecord = useCallback(async (id: string, updates: Partial<HydrationRecord>) => {
    await updateRecord(id, updates);
    setEditingRecord(null);
  }, [updateRecord]);

  const handleDeleteRecord = useCallback(async (id: string) => {
    await deleteRecord(id);
  }, [deleteRecord]);

  const handleCloseEditor = useCallback(() => {
    setEditingRecord(null);
  }, []);

  // Memoized calculations for performance
  const todayRecords = useMemo(() => 
    records.filter(record => isToday(record.timestamp)), 
    [records]
  );

  const completionPercentage = useMemo(() => 
    Math.min((dailyIntake / dailyGoal) * 100, 100), 
    [dailyIntake, dailyGoal]
  );
  
  const isGoalReached = useMemo(() => 
    completionPercentage >= 100, 
    [completionPercentage]
  );

  const remainingAmount = useMemo(() => 
    Math.max(0, dailyGoal - dailyIntake), 
    [dailyGoal, dailyIntake]
  );

  // Memoized animation variants for performance
  const animationVariants = useMemo(() => ({
    container: {
      hidden: { 
        opacity: 0,
        willChange: 'opacity'
      },
      visible: {
        opacity: 1,
        transition: {
          duration: 0.5,
          staggerChildren: 0.2
        }
      }
    },
    item: {
      hidden: { 
        opacity: 0, 
        y: 20,
        willChange: 'transform, opacity'
      },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.4 }
      }
    },
    header: {
      hidden: { 
        opacity: 0, 
        y: -20,
        willChange: 'transform, opacity'
      },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
      }
    }
  }), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <motion.header
        className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-10"
        variants={animationVariants.header}
        initial="hidden"
        animate="visible"
        style={{ willChange: 'transform, opacity' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img
                  src="/favicon.svg"
                  alt="FillUp! Logo"
                  className="w-10 h-10"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{t('common.appName')}</h1>
                <p className="text-sm text-gray-600">{t('common.appSlogan')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <LanguageSelector />

              {/* Network status indicator */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isOffline
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                {isOffline ? t('common.offline') : t('common.online')}
              </div>

              {/* Sync status */}
              {syncStatus.pendingCount > 0 && (
                <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                  {t('common.pendingSync', { count: syncStatus.pendingCount })}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <motion.main
        className="max-w-4xl mx-auto px-4 py-8"
        variants={animationVariants.container}
        initial="hidden"
        animate="visible"
        style={{ willChange: 'opacity' }}
      >
        {/* Success message */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              className="fixed top-20 left-1/2 transform -translate-x-1/2 z-20"
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg font-medium">
                {t('home.recordSuccess')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left column - Bucket Visualizer */}
          <motion.div
            className="flex flex-col items-center"
            variants={animationVariants.item}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-blue-100 w-full max-w-md">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('home.todayProgress')}</h2>
                <p className="text-gray-600">
                  {new Date().toLocaleDateString(i18n.language, {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </p>
              </div>
              
              <BucketVisualizer
                currentAmount={dailyIntake}
                dailyGoal={dailyGoal}
                isAnimating={isAnimating}
                onAnimationComplete={handleAnimationComplete}
              />
              
              {/* Progress stats */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(completionPercentage)}%
                  </div>
                  <div className="text-xs text-blue-600 font-medium">{t('home.completionRate')}</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {remainingAmount.toLocaleString(i18n.language)}
                  </div>
                  <div className="text-xs text-purple-600 font-medium">{t('home.remaining')} {t('common.ml')}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right column - Quick Input */}
          <motion.div
            className="space-y-6"
            variants={animationVariants.item}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-100">
              <QuickInputButtons
                onVolumeSelect={handleVolumeSelect}
                isLoading={isLoading}
              />
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-blue-100"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      {dailyIntake.toLocaleString(i18n.language)}
                    </div>
                    <div className="text-xs text-gray-600">{t('home.todayDrank')}</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-blue-100"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      {dailyGoal.toLocaleString(i18n.language)}
                    </div>
                    <div className="text-xs text-gray-600">{t('home.dailyGoal')}</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Goal reached celebration */}
            <AnimatePresence>
              {isGoalReached && (
                <motion.div
                  className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl p-6 text-center shadow-lg"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-4xl mb-2">🎉</div>
                  <h3 className="text-xl font-bold mb-1">{t('home.goalReached.title')}</h3>
                  <p className="text-sm opacity-90">
                    {t('home.goalReached.message')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Today's Records Section */}
        <motion.div
          className="mt-8"
          variants={animationVariants.item}
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
            {/* Records Header */}
            <div className="p-6 border-b border-gray-100">
              <button
                onClick={() => setShowRecords(!showRecords)}
                className="w-full flex items-center justify-between text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <History className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{t('home.todayRecords')}</h3>
                    <p className="text-sm text-gray-600">
                      {t('home.recordCount', { count: todayRecords.length })}
                      {todayRecords.some(r => !r.synced) && (
                        <span className="ml-2 text-orange-600">• {t('home.partiallyUnsynced')}</span>
                      )}
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: showRecords ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
              </button>
            </div>

            {/* Records Content */}
            <AnimatePresence>
              {showRecords && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-6">
                    {todayRecords.length > 0 ? (
                      <RecordList
                        records={todayRecords}
                        onEdit={handleEditRecord}
                        onDelete={handleDeleteRecord}
                        isLoading={isLoading}
                        showDate={false}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <History className="w-8 h-8 text-gray-400" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">{t('home.noRecords.title')}</h4>
                        <p className="text-gray-500">{t('home.noRecords.message')}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Bottom navigation hint */}
        <motion.div
          className="mt-12 text-center"
          variants={animationVariants.item}
        >
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-gray-600">
            <Settings className="w-4 h-4" />
            <span>{t('home.settingsHint')}</span>
          </div>
        </motion.div>
      </motion.main>

      {/* Record Editor Modal */}
      {editingRecord && (
        <RecordEditor
          record={editingRecord}
          isOpen={!!editingRecord}
          onClose={handleCloseEditor}
          onSave={handleSaveRecord}
          isLoading={isLoading}
        />
      )}
    </div>
  );
});

Home.displayName = 'Home';

export default Home;