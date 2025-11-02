import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  Trash2, 
  Clock, 
  Droplets,
  Calendar,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import { HydrationRecord } from '../types';
import { formatTime, formatDate } from '../utils/time';
import { formatVolume } from '../utils/format';

interface RecordListProps {
  records: HydrationRecord[];
  onEdit: (record: HydrationRecord) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
  showDate?: boolean;
}

interface RecordItemProps {
  record: HydrationRecord;
  onEdit: (record: HydrationRecord) => void;
  onDelete: (id: string) => Promise<void>;
  showDate?: boolean;
  isDeleting?: boolean;
}

const RecordItem: React.FC<RecordItemProps> = ({
  record,
  onEdit,
  onDelete,
  showDate = false,
  isDeleting = false
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    setShowActions(false);
    onEdit(record);
  };

  const handleDeleteClick = () => {
    setShowActions(false);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await onDelete(record.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      // Error handling is done by parent component
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      x: -100,
      transition: { duration: 0.2 }
    }
  };

  const actionsVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: -10,
      transition: { duration: 0.1 }
    }
  };

  return (
    <motion.div
      className={`
        relative bg-white border border-gray-200 rounded-xl p-4 
        hover:shadow-md transition-all duration-200
        ${!record.synced ? 'border-l-4 border-l-orange-400' : ''}
        ${isDeleting ? 'opacity-50' : ''}
      `}
      variants={itemVariants}
      layout
    >
      {/* Sync Status Indicator */}
      {!record.synced && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
        </div>
      )}

      <div className="flex items-center justify-between">
        {/* Record Info */}
        <div className="flex items-center gap-4 flex-1">
          {/* Volume */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Droplets className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {formatVolume(record.volume)}
              </p>
              <p className="text-xs text-gray-500">容量</p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {formatTime(record.timestamp)}
              </p>
              <p className="text-xs text-gray-500">時間</p>
            </div>
          </div>

          {/* Date (if showing) */}
          {showDate && (
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {formatDate(record.timestamp)}
                </p>
                <p className="text-xs text-gray-500">日期</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <motion.button
            onClick={() => setShowActions(!showActions)}
            disabled={isDeleting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </motion.button>

          <AnimatePresence>
            {showActions && (
              <motion.div
                className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]"
                variants={actionsVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-blue-500" />
                  編輯
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  刪除
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sync Status Message */}
      {!record.synced && (
        <div className="mt-3 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
          <AlertTriangle className="w-3 h-3" />
          等待同步到雲端
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDeleteCancel}
          >
            <motion.div
              className="bg-white rounded-xl p-6 max-w-sm w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">確認刪除</h3>
                  <p className="text-sm text-gray-500">此操作無法復原</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                確定要刪除這筆 {formatVolume(record.volume)} 的記錄嗎？
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? '刪除中...' : '刪除'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close actions */}
      {showActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}
    </motion.div>
  );
};

const RecordList: React.FC<RecordListProps> = ({
  records,
  onEdit,
  onDelete,
  isLoading = false,
  showDate = false
}) => {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDelete = async (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      await onDelete(id);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // Sort records by timestamp (newest first)
  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  if (records.length === 0) {
    return (
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Droplets className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">尚無記錄</h3>
        <p className="text-gray-500">開始記錄您的飲水量吧！</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {sortedRecords.map((record) => (
          <RecordItem
            key={record.id}
            record={record}
            onEdit={onEdit}
            onDelete={handleDelete}
            showDate={showDate}
            isDeleting={deletingIds.has(record.id)}
          />
        ))}
      </AnimatePresence>
      
      {isLoading && (
        <motion.div
          className="text-center py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            載入中...
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RecordList;