import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Mail, X } from 'lucide-react';

// Simple global toast store
let listeners = [];
let toasts = [];
let nextToastId = 1;

export function showToast(toast) {
  const id = nextToastId++;
  toasts = [...toasts, { ...toast, id }];
  listeners.forEach(fn => fn(toasts));
  // Auto-dismiss after 6 seconds
  setTimeout(() => dismissToast(id), 6000);
}

function dismissToast(id) {
  toasts = toasts.filter(t => t.id !== id);
  listeners.forEach(fn => fn(toasts));
}

export function ToastContainer() {
  const [list, setList] = useState([]);

  useEffect(() => {
    listeners.push(setList);
    return () => { listeners = listeners.filter(fn => fn !== setList); };
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 w-96">
      {list.map(t => (
        <div key={t.id} className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-slide-in">
          {/* Header */}
          <div className={`flex items-center gap-2 px-4 py-3 ${
            t.type === 'approved' ? 'bg-green-50 border-b border-green-100' :
            t.type === 'rejected' ? 'bg-red-50 border-b border-red-100' :
            'bg-blue-50 border-b border-blue-100'
          }`}>
            {t.type === 'approved' && <CheckCircle size={15} className="text-green-600 flex-shrink-0" />}
            {t.type === 'rejected' && <XCircle size={15} className="text-red-600 flex-shrink-0" />}
            <p className={`text-sm font-semibold flex-1 ${
              t.type === 'approved' ? 'text-green-800' :
              t.type === 'rejected' ? 'text-red-800' : 'text-blue-800'
            }`}>{t.title}</p>
            <button onClick={() => dismissToast(t.id)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X size={14} />
            </button>
          </div>

          {/* Simulated notification preview */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Mail size={12} className="text-gray-400" />
              <p className="text-xs text-gray-500">Notification sent to <span className="font-medium text-gray-700">{t.to}</span></p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-700 space-y-1">
              <p className="font-medium text-gray-800">{t.subject}</p>
              <p className="text-gray-600 leading-relaxed">{t.body}</p>
              {t.adminNote && (
                <p className="text-gray-500 italic border-t border-gray-200 pt-1 mt-1">
                  Admin note: "{t.adminNote}"
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
