import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

export default function ImageUpload({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize  = 8 * 1024 * 1024,
  label    = 'Upload photos',
  hint     = 'JPG · PNG · WEBP · Max 8 MB each',
}) {
  const [errors, setErrors] = useState([]);

  const onDrop = useCallback((accepted, rejected) => {
    const remaining = maxFiles - value.length;
    const files     = accepted.slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id:      Math.random().toString(36).slice(2),
    }));
    onChange([...value, ...files]);
    if (rejected.length) {
      setErrors(rejected.map(r => r.errors[0]?.message || 'Invalid file'));
      setTimeout(() => setErrors([]), 4000);
    }
  }, [value, onChange, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize,
    disabled: value.length >= maxFiles,
    onDropRejected: (files) => {
      setErrors(files.map(f => f.errors[0]?.message || 'File rejected'));
      setTimeout(() => setErrors([]), 4000);
    },
  });

  const remove = (id) => {
    const item = value.find(v => v.id === id);
    if (item?.preview) URL.revokeObjectURL(item.preview);
    onChange(value.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-3">
      {label && <label className="input-label">{label}</label>}

      <div
        {...getRootProps()}
        className={clsx(
          'relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-teal bg-teal/5 scale-[1.01]'
            : value.length >= maxFiles
              ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
              : 'border-slate-300 hover:border-navy hover:bg-slate-50 dark:border-slate-600 dark:hover:border-teal'
        )}>
        <input {...getInputProps()} />
        <div className={clsx(
          'w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-colors',
          isDragActive ? 'bg-teal/20 text-teal' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
        )}>
          <Upload className="w-5 h-5" />
        </div>
        <p className={clsx('text-sm font-medium mb-1', isDragActive ? 'text-teal' : 'text-slate-600 dark:text-slate-300')}>
          {isDragActive ? 'Release to upload…' : value.length >= maxFiles ? 'Maximum photos reached' : 'Drag & drop or click to select'}
        </p>
        <p className="text-xs text-slate-400">{hint} · {maxFiles - value.length} remaining</p>
      </div>

      {/* Error messages */}
      <AnimatePresence>
        {errors.map((err, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{err}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Preview grid */}
      <AnimatePresence>
        {value.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
            {value.map((item) => (
              <motion.div key={item.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                exit={{   scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0.3 }}
                className="relative group">
                <div className="aspect-square rounded-xl overflow-hidden border-2 border-teal/40 bg-slate-100">
                  <img src={item.preview} alt="preview"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3 text-white" />
                </button>
                <div className="absolute bottom-1 right-1">
                  <CheckCircle className="w-3.5 h-3.5 text-teal drop-shadow" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
