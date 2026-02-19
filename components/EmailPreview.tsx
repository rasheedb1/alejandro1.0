'use client'

interface EmailPreviewProps {
  html: string
  onClose: () => void
}

export default function EmailPreview({ html, onClose }: EmailPreviewProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">Email Preview</h3>
            <p className="text-xs text-gray-400 mt-0.5">This is how the email will look</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="overflow-auto flex-1">
          <iframe
            srcDoc={html}
            title="Email Preview"
            style={{ width: '100%', height: '70vh', border: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
