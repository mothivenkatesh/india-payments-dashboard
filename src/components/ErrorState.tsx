/** @jsxImportSource preact */
import Icon from './Icon'

export default function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div class="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <span class="w-14 h-14 rounded-full bg-surface-red-1 border border-outline-red-1 flex items-center justify-center">
        <Icon name="alert-circle" size={28} className="text-ink-red-3" />
      </span>
      <div>
        <p class="text-base text-ink-gray-8 font-medium">Failed to load data</p>
        <p class="text-sm text-ink-gray-6 mt-1 max-w-sm">
          {message ?? 'Could not reach India Data Portal CKAN API. Check the Vite proxy config.'}
        </p>
      </div>
      {onRetry && (
        <button onClick={onRetry}
          class="flex items-center gap-1.5 text-sm text-ink-blue-2 px-3 py-1.5 rounded border border-outline-blue-1 bg-surface-blue-1 hover:bg-surface-blue-2 transition-colors">
          <Icon name="refresh-cw" size={14} />
          Retry
        </button>
      )}
    </div>
  )
}
