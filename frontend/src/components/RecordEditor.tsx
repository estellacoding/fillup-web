import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  Save, 
  X, 
  Calendar, 
  Clock, 
  Droplets,
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { HydrationRecord } from '../types';

interface RecordEditorProps {
  record: HydrationRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<HydrationRecord>) => Promise<void>;
  isLoading?: boolean;
}

interface FormData {
  volume: string;
  date: string;
  time: string;
}

interface ValidationErrors {
  volume?: string;
  date?: string;
  time?: string;
}

const RecordEditor: React.FC<RecordEditorProps> = ({
  record,
  isOpen,
  onClose,
  onSave,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<FormData>({
    volume: '',
    date: '',
    time: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when record changes
  useEffect(() => {
    if (record) {
      const timestamp = new Date(record.timestamp);
      setFormData({
        volume: record.volume.toString(),
        date: timestamp.toISOString().split('T')[0],
        time: timestamp.toTimeString().slice(0, 5)
      });
      setErrors({});
    }
  }, [record]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Volume validation
    const volume = parseInt(formData.volume);
    if (isNaN(volume)) {
      newErrors.volume = '請輸入有效的數字';
    } else if (volume < 1 || volume > 5000) {
      newErrors.volume = '容量必須介於 1ml 至 5000ml 之間';
    }

    // Date validation
    if (!formData.date) {
      newErrors.date = '請選擇日期';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (selectedDate > today) {
        newErrors.date = '不能選擇未來的日期';
      }
      
      // Check if date is too far in the past (more than 1 year)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (selectedDate < oneYearAgo) {
        newErrors.date = '日期不能超過一年前';
      }
    }

    // Time validation
    if (!formData.time) {
      newErrors.time = '請選擇時間';
    } else {
      // If date is today, time cannot be in the future
      const selectedDate = new Date(formData.date);
      const today = new Date();
      
      if (selectedDate.toDateString() === today.toDateString()) {
        const [hours, minutes] = formData.time.split(':').map(Number);
        const selectedDateTime = new Date(selectedDate);
        selectedDateTime.setHours(hours, minutes, 0, 0);
        
        if (selectedDateTime > today) {
          newErrors.time = '時間不能是未來時間';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    
    try {
      // Combine date and time into timestamp
      const [hours, minutes] = formData.time.split(':').map(Number);
      const timestamp = new Date(formData.date);
      timestamp.setHours(hours, minutes, 0, 0);

      const updates: Partial<HydrationRecord> = {
        volume: parseInt(formData.volume),
        timestamp
      };

      await onSave(record.id, updates);
      onClose();
    } catch (error) {
      console.error('Failed to save record:', error);
      // Error handling is done by the parent component
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50 
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: 50,
      transition: {
        duration: 0.2
      }
    }
  };

  const inputVariants = {
    focus: { 
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">編輯記錄</h2>
                  <p className="text-sm text-gray-500">修改飲水記錄的容量和時間</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Volume Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  容量 (ml)
                </label>
                <motion.input
                  type="number"
                  value={formData.volume}
                  onChange={(e) => handleInputChange('volume', e.target.value)}
                  min="1"
                  max="5000"
                  className={`
                    w-full px-4 py-3 border-2 rounded-xl 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                    ${errors.volume 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 bg-white hover:border-gray-400'
                    }
                  `}
                  placeholder="輸入容量 (1-5000ml)"
                  variants={inputVariants}
                  whileFocus="focus"
                />
                <AnimatePresence>
                  {errors.volume && (
                    <motion.div
                      className="flex items-center gap-2 text-red-500 text-sm"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.volume}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Date Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4 text-green-500" />
                  日期
                </label>
                <motion.input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`
                    w-full px-4 py-3 border-2 rounded-xl 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                    ${errors.date 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 bg-white hover:border-gray-400'
                    }
                  `}
                  variants={inputVariants}
                  whileFocus="focus"
                />
                <AnimatePresence>
                  {errors.date && (
                    <motion.div
                      className="flex items-center gap-2 text-red-500 text-sm"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.date}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Time Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4 text-purple-500" />
                  時間
                </label>
                <motion.input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className={`
                    w-full px-4 py-3 border-2 rounded-xl 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                    ${errors.time 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 bg-white hover:border-gray-400'
                    }
                  `}
                  variants={inputVariants}
                  whileFocus="focus"
                />
                <AnimatePresence>
                  {errors.time && (
                    <motion.div
                      className="flex items-center gap-2 text-red-500 text-sm"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.time}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                  whileHover={!isSaving ? { scale: 1.02 } : {}}
                  whileTap={!isSaving ? { scale: 0.98 } : {}}
                >
                  取消
                </motion.button>
                
                <motion.button
                  type="submit"
                  disabled={isSaving || isLoading}
                  className={`
                    flex-1 px-4 py-3 font-semibold rounded-xl transition-all duration-200
                    flex items-center justify-center gap-2
                    ${isSaving || isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg'
                    }
                  `}
                  whileHover={!isSaving && !isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isSaving && !isLoading ? { scale: 0.98 } : {}}
                >
                  {isSaving || isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      儲存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      儲存
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            {/* Info Footer */}
            <div className="px-6 pb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>提示：</strong>修改記錄後，水桶進度會自動重新計算並更新顯示
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RecordEditor;