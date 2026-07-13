import { motion } from 'framer-motion';

export default function EmptyState({ emoji, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {emoji && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl mb-5">
          {emoji}
        </div>
      )}
      <h3 className="font-display font-bold text-lg text-ink dark:text-slate-100 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-5">{description}</p>
      )}
      {action}
    </motion.div>
  );
}
