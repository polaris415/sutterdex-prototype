import { useState } from 'react';
import { BookOpen, Settings, Shield } from 'lucide-react';
import { useStore } from './store/useStore';
import SearchInterface from './components/SearchInterface';
import AdminInterface from './components/AdminInterface';
import LoginPage from './components/LoginPage';
import { ToastContainer } from './components/Toast';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [view, setView] = useState('search'); // 'search' | 'admin'
  const {
    vendors, pendingSubmissions, reviewCycles, sitePocs, currentUser, auditLog,
    approveSubmission, rejectSubmission, updateVendor, addVendor, deleteVendor, submitVendorEntry, importCareport, addSitePoc, addReviewCycle,
  } = useStore();

  const pendingCount = pendingSubmissions.filter(s => s.status === 'Pending').length;

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0 z-20">
        <div className="flex items-center h-14 px-6 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mr-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-lg leading-none">ContactDex</span>
              <span className="text-xs text-gray-400 block leading-none">Vendor Resource Directory</span>
            </div>
          </div>

          {/* Interface toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setView('search')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'search'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen size={14} />Vendor Directory
            </button>
            <button
              onClick={() => setView('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all relative ${
                view === 'admin'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings size={14} />Admin
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg">
              <Shield size={12} className="text-purple-600" />
              <span className="text-xs font-medium text-purple-700">{currentUser.role}</span>
            </div>
            <div className="text-sm text-gray-600">{currentUser.name}</div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-blue-700">AU</span>
            </div>
          </div>
        </div>
      </header>

      <ToastContainer />

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {view === 'search' ? (
          <SearchInterface
            vendors={vendors}
            onSubmitVendor={submitVendorEntry}
            onSubmitEdit={submitVendorEntry}
            auditLog={auditLog}
            isAdmin={currentUser.role === 'Admin'}
          />
        ) : (
          <AdminInterface
            vendors={vendors}
            pendingSubmissions={pendingSubmissions}
            reviewCycles={reviewCycles}
            sitePocs={sitePocs}
            auditLog={auditLog}
            onApproveSubmission={approveSubmission}
            onRejectSubmission={rejectSubmission}
            onUpdateVendor={updateVendor}
            onAddVendor={addVendor}
            onDeleteVendor={deleteVendor}
            onImportCareport={importCareport}
            onAddSitePoc={addSitePoc}
            onAddReviewCycle={addReviewCycle}
          />
        )}
      </main>
    </div>
  );
}
