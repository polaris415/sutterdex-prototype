import { useState } from 'react';
import { useRef } from 'react';
import {
  Upload, CheckCircle, XCircle, Clock, Users, BarChart2, RefreshCw,
  ChevronRight, AlertCircle, FileUp, Edit2, Trash2, Plus, Tag,
  Search, Calendar, Loader, History, ChevronDown, Eye, EyeOff, Mail
} from 'lucide-react';
import { VENDOR_TYPES, CLINICAL_TAGS, VENDOR_TAGS, COUNTIES, HOSPITALS, CORPORATE_GROUPS, SERVICE_AREAS, CONTACT_TYPES, CORPORATE_GROUPS_BY_TYPE } from '../data/sampleData';
import { formatPhone } from '../utils/formatPhone';
import { parseCareportWorkbook } from '../data/careportMapper';
import { showToast } from './Toast';

function StatCard({ icon: Icon, label, value, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function buildNotification(submission, action, adminNote) {
  const submitter = submission.submittedBy || 'Submitter';
  const vendor = submission.vendorName;
  const isNew = submission.type === 'new_vendor';
  const isEdit = submission.type === 'vendor_edit';

  if (action === 'approved') {
    return {
      type: 'approved',
      title: `Submission approved — ${vendor}`,
      to: submitter,
      subject: `ContactDex: Your submission for "${vendor}" has been approved`,
      body: isNew
        ? `Your submission for a new vendor "${vendor}" has been approved and added to the ContactDex directory. It is now searchable by all staff.`
        : isEdit
        ? `Your proposed edits for "${vendor}" have been approved and applied to the directory.`
        : `Your ${submission.field} update for "${vendor}" has been approved and applied to the directory.`,
      adminNote: adminNote || null,
    };
  } else {
    return {
      type: 'rejected',
      title: `Submission rejected — ${vendor}`,
      to: submitter,
      subject: `ContactDex: Your submission for "${vendor}" was not approved`,
      body: isNew
        ? `Your submission for a new vendor "${vendor}" was reviewed but not approved at this time.`
        : isEdit
        ? `Your proposed edits for "${vendor}" were reviewed but not approved at this time.`
        : `Your ${submission.field} update for "${vendor}" was reviewed but not approved at this time.`,
      adminNote: adminNote || null,
    };
  }
}

function PendingSubmissionCard({ submission, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState('');

  const statusColor = submission.status === 'Pending' ? 'text-amber-700 bg-amber-50 border-amber-200'
    : submission.status === 'Approved' ? 'text-green-700 bg-green-50 border-green-200'
    : 'text-red-700 bg-red-50 border-red-200';

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>
            {submission.status}
          </span>
          <div>
            <p className="font-medium text-sm text-gray-900">{submission.vendorName}</p>
            <p className="text-xs text-gray-500">
              {submission.type === 'contact_update' ? `Contact update — ${submission.field}`
                : submission.type === 'vendor_edit' ? 'Proposed edit'
                : `New ${submission.vendorType}`}
              {' · '}Submitted by {submission.submittedBy} on {submission.submittedAt}
            </p>
          </div>
        </div>
        <ChevronRight size={16} className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">

          {/* New vendor: show all submitted fields */}
          {submission.type === 'new_vendor' && submission.vendorData && (() => {
            const d = submission.vendorData;
            const row = (label, value) => value ? (
              <div key={label} className="flex gap-3 text-sm">
                <span className="text-gray-500 w-36 flex-shrink-0">{label}</span>
                <span className="text-gray-900">{value}</span>
              </div>
            ) : null;
            const contact = (label, c) => c?.name ? (
              <div key={label}>
                <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm space-y-0.5">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  {c.phone && <p className="text-gray-600">{formatPhone(c.phone)}</p>}
                  {c.email && <p className="text-gray-600">{c.email}</p>}
                </div>
              </div>
            ) : null;
            return (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted Vendor Details</p>
                <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-2">
                  {row('Vendor Type', d.vendorType)}
                  {row('Address', [d.address, d.city, d.county ? `${d.county} County` : '', d.state, d.zip].filter(Boolean).join(', '))}
                  {row('Phone', d.phone ? formatPhone(d.phone) : '')}
                  {row('Fax', d.fax)}
                  {row('Website', d.website)}
                </div>
                {contact('Admissions Contact', d.admissionsContacts?.[0])}
                {contact('Escalation Contact', d.escalationContacts?.[0])}
              </div>
            );
          })()}

          {/* Contact update: show diff */}
          {submission.type === 'contact_update' && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Previous Value</p>
                <p className="text-gray-700 bg-red-50 px-2 py-1 rounded">{submission.oldValue || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Proposed Value</p>
                <p className="text-gray-700 bg-green-50 px-2 py-1 rounded">{submission.newValue}</p>
              </div>
            </div>
          )}

          {/* Vendor edit: field-level diff */}
          {submission.type === 'vendor_edit' && submission.originalData && submission.proposedData && (() => {
            const LABELS = {
              name: 'Name', vendorType: 'Vendor Type', phone: 'Phone', fax: 'Fax', website: 'Website',
              address: 'Address', city: 'City', county: 'County', zip: 'ZIP', state: 'State', notes: 'Notes',
              synonyms: 'Synonyms / Aliases',
              admissionsContacts: 'Admissions Contacts', escalationContacts: 'Escalation Contacts',
              clinicalTags: 'Clinical Tags', vendorTags: 'Vendor Tags',
            };
            const serialize = (v) => {
              if (v === null || v === undefined || v === '') return '—';
              if (Array.isArray(v)) {
                if (v.length === 0) return '—';
                if (v[0] && typeof v[0] === 'object' && 'name' in v[0])
                  return v.map(c => [c.name, c.phone, c.email].filter(Boolean).join(', ')).join(' | ');
                return v.join(', ');
              }
              return String(v);
            };
            const diffs = Object.keys(LABELS).filter(k => serialize(submission.originalData[k]) !== serialize(submission.proposedData[k]));
            return diffs.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No changes detected.</p>
            ) : (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Proposed Changes ({diffs.length})</p>
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-3 py-2 font-medium text-gray-500 w-1/4">Field</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500 w-5/12">Current</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500 w-5/12">Proposed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {diffs.map(k => (
                        <tr key={k}>
                          <td className="px-3 py-2 font-medium text-gray-700">{LABELS[k]}</td>
                          <td className="px-3 py-2 text-red-700 bg-red-50 font-mono">{serialize(submission.originalData[k])}</td>
                          <td className="px-3 py-2 text-green-700 bg-green-50 font-mono">{serialize(submission.proposedData[k])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {submission.notes && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-gray-700">
              <p className="text-xs font-medium text-gray-500 mb-1">Submitter Notes</p>
              {submission.notes}
            </div>
          )}

          {submission.status === 'Pending' && (
            <div className="space-y-2">
              <textarea
                rows={2}
                placeholder="Admin note (optional)…"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={() => {
                  onApprove(submission.id);
                  showToast(buildNotification(submission, 'approved', note));
                }} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
                  <CheckCircle size={14} />Approve
                </button>
                <button onClick={() => {
                  onReject(submission.id, note);
                  showToast(buildNotification(submission, 'rejected', note));
                }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-100">
                  <XCircle size={14} />Reject
                </button>
              </div>
            </div>
          )}

          {submission.adminNote && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <p className="text-xs font-medium text-gray-500 mb-1">Admin Note</p>
              {submission.adminNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewCycleCard({ cycle }) {
  const pct = Math.round((cycle.reviewed / cycle.totalVendors) * 100) || 0;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-gray-900">{cycle.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Started {cycle.startedAt}{cycle.closedAt ? ` · Closed ${cycle.closedAt}` : ''}
            {cycle.dueDate ? ` · Due ${cycle.dueDate}` : ''}
          </p>
          {cycle.pocName && (
            <p className="text-xs text-blue-600 mt-0.5">POC: {cycle.pocName}</p>
          )}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
          cycle.status === 'Active' ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-600 bg-gray-100 border-gray-200'
        }`}>
          {cycle.status}
        </span>
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress: {cycle.reviewed}/{cycle.totalVendors} vendors reviewed</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="text-green-600 font-medium">{cycle.approved} approved</span>
        {cycle.rejected > 0 && <span className="text-red-600 font-medium">{cycle.rejected} rejected</span>}
        {cycle.pending > 0 && <span className="text-amber-600 font-medium">{cycle.pending} pending</span>}
      </div>
    </div>
  );
}

// ── Bulk Edit Modal ───────────────────────────────────────────────────────────

function BulkEditModal({ selectedIds, onClose, onSave }) {
  const count = selectedIds.size;
  const [vendorType, setVendorType] = useState('');
  const [reviewingSite, setReviewingSite] = useState('');
  const [corporateGroup, setCorporateGroup] = useState('');
  const [coverageAreas, setCoverageAreas] = useState(null);
  const [clinicalTagsAdd, setClinicalTagsAdd] = useState([]);
  const [vendorTagsAdd, setVendorTagsAdd] = useState([]);
  const [addContact, setAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ type: '', name: '', title: '', phone: '', email: '' });

  const toggleCoverage = (a) => {
    setCoverageAreas(prev => {
      const arr = prev || [];
      return arr.includes(a) ? arr.filter(x => x !== a) : [...arr, a];
    });
  };

  const handleSave = () => {
    const updates = {};
    if (vendorType) updates.vendorType = vendorType;
    if (reviewingSite) updates.reviewingSite = reviewingSite;
    if (corporateGroup) updates.corporateGroup = corporateGroup;
    if (coverageAreas !== null) updates.coverageAreas = coverageAreas;
    if (clinicalTagsAdd.length > 0) updates._addClinicalTags = clinicalTagsAdd;
    if (vendorTagsAdd.length > 0) updates._addVendorTags = vendorTagsAdd;
    if (addContact && newContact.name) updates._addContact = newContact;
    onSave(updates);
  };

  const hasChanges = vendorType || reviewingSite || corporateGroup || coverageAreas !== null ||
    clinicalTagsAdd.length > 0 || vendorTagsAdd.length > 0 || (addContact && newContact.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Bulk Edit — {count} vendor{count !== 1 ? 's' : ''}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Only filled fields will be updated. Blank fields are left unchanged.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none mt-0.5">×</button>
        </div>
        <div className="px-6 py-5 space-y-5">

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Set Vendor Type</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={vendorType} onChange={e => setVendorType(e.target.value)}>
              <option value="">(no change)</option>
              {VENDOR_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Set Reviewing Hospital</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={reviewingSite} onChange={e => setReviewingSite(e.target.value)}>
              <option value="">(no change)</option>
              {HOSPITALS.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Set Corporate Group</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={corporateGroup} onChange={e => setCorporateGroup(e.target.value)}>
              <option value="">(no change)</option>
              {CORPORATE_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Set Service Area
              {coverageAreas !== null && (
                <button type="button" onClick={() => setCoverageAreas(null)}
                  className="ml-2 text-gray-400 hover:text-gray-600 font-normal">(clear — no change)</button>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_AREAS.map(a => (
                <button key={a} type="button" onClick={() => toggleCoverage(a)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    coverageAreas?.includes(a)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-600 hover:border-blue-400'
                  }`}>
                  {a}
                </button>
              ))}
            </div>
            {coverageAreas === null && <p className="text-xs text-gray-400 mt-1">Click to activate — replaces existing service areas on all selected vendors.</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Add Clinical Tags <span className="font-normal text-gray-400">(merges with existing)</span></label>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {CLINICAL_TAGS.map(tag => (
                <label key={tag} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                  <input type="checkbox" checked={clinicalTagsAdd.includes(tag)}
                    onChange={e => setClinicalTagsAdd(prev => e.target.checked ? [...prev, tag] : prev.filter(t => t !== tag))}
                    className="w-3.5 h-3.5 accent-blue-600" />
                  {tag}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Add Vendor Tags <span className="font-normal text-gray-400">(merges with existing)</span></label>
            <div className="grid grid-cols-2 gap-1.5 border border-gray-200 rounded-lg p-2">
              {VENDOR_TAGS.map(tag => (
                <label key={tag} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                  <input type="checkbox" checked={vendorTagsAdd.includes(tag)}
                    onChange={e => setVendorTagsAdd(prev => e.target.checked ? [...prev, tag] : prev.filter(t => t !== tag))}
                    className="w-3.5 h-3.5 accent-amber-500" />
                  {tag}
                </label>
              ))}
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-4">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input type="checkbox" checked={addContact} onChange={e => setAddContact(e.target.checked)}
                className="w-4 h-4 accent-blue-600" />
              <span className="text-xs font-medium text-gray-700">Add a contact to all selected vendors</span>
            </label>
            {addContact && (
              <div className="space-y-2">
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newContact.type} onChange={e => setNewContact(c => ({ ...c, type: e.target.value }))}>
                  <option value="">Contact Type…</option>
                  {CONTACT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Name *" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newContact.name} onChange={e => setNewContact(c => ({ ...c, name: e.target.value }))} />
                  <input placeholder="Title" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newContact.title} onChange={e => setNewContact(c => ({ ...c, title: e.target.value }))} />
                  <input placeholder="Phone" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newContact.phone} onChange={e => setNewContact(c => ({ ...c, phone: e.target.value }))} />
                  <input placeholder="Email" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newContact.email} onChange={e => setNewContact(c => ({ ...c, email: e.target.value }))} />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="button" onClick={handleSave} disabled={!hasChanges}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
              Apply to {count} Vendor{count !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Site POC Modal ────────────────────────────────────────────────────────

function AddSitePocModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', role: 'Site POC', site: '', email: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add Site POC</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
        </div>
        <form className="px-6 py-5 space-y-4" onSubmit={e => { e.preventDefault(); onSave(form); onClose(); }}>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
            <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
            <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="Site POC">Site POC</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Site / Hospital *</label>
            <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.site} onChange={e => set('site', e.target.value)}>
              <option value="">Select site…</option>
              {HOSPITALS.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
            <input required type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              Add Site POC
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Initiate Review Cycle Modal ───────────────────────────────────────────────

function InitiateReviewCycleModal({ selectedCount, sitePocs, onClose, onSubmit }) {
  const [pocId, setPocId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [cycleName, setCycleName] = useState(
    `Review Cycle — ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
  );
  const [comments, setComments] = useState('');

  const selectedPoc = sitePocs.find(p => p.id === pocId);
  const canSubmit = pocId && dueDate && sitePocs.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Initiate Review Cycle</h2>
            <p className="text-xs text-gray-500 mt-0.5">{selectedCount} vendor{selectedCount !== 1 ? 's' : ''} selected for review</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none mt-0.5">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cycle Name</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={cycleName} onChange={e => setCycleName(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assign Site POC *</label>
            {sitePocs.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                No Site POCs have been added yet. Go to <strong>Users &amp; Roles</strong> to add a Site POC first.
              </div>
            ) : (
              <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={pocId} onChange={e => setPocId(e.target.value)}>
                <option value="">Select Site POC…</option>
                {sitePocs.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.site}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Due Date *</label>
            <input type="date" required
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Comments / Instructions</label>
            <textarea rows={3} placeholder="Add any instructions or context for the Site POC…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={comments} onChange={e => setComments(e.target.value)} />
          </div>

          {selectedPoc && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              <p className="font-medium mb-0.5">Email notification will be sent to:</p>
              <p>{selectedPoc.name} &lt;{selectedPoc.email}&gt; · {selectedPoc.site}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                const poc = sitePocs.find(p => p.id === pocId);
                onSubmit({ name: cycleName, sitePocId: pocId, pocName: poc?.name, pocEmail: poc?.email, dueDate, comments });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Mail size={14} />Send Email Notification to Site POC
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Review Cycle Vendor Selector ──────────────────────────────────────────────

function ReviewCycleVendorSelector({ vendors, sitePocs, onInitiate }) {
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showInitiateModal, setShowInitiateModal] = useState(false);

  const filtered = vendors.filter(v => {
    if (hospitalFilter && v.reviewingSite !== hospitalFilter) return false;
    if (typeFilter && v.vendorType !== typeFilter) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) &&
        !v.vendorType?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const displayedVendors = filtered.slice(0, 150);
  const allDisplayedSelected = displayedVendors.length > 0 && displayedVendors.every(v => selected.has(v.id));

  const toggleAll = () => {
    if (allDisplayedSelected) {
      setSelected(s => { const n = new Set(s); displayedVendors.forEach(v => n.delete(v.id)); return n; });
    } else {
      setSelected(s => { const n = new Set(s); displayedVendors.forEach(v => n.add(v.id)); return n; });
    }
  };

  const toggleVendor = (id) => {
    setSelected(s => { const n = new Set(s); s.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Select Vendors for Review</h3>
        {selected.size > 0 && (
          <button onClick={() => setShowInitiateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <RefreshCw size={14} />Initiate Review Cycle for {selected.size} Vendor{selected.size !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <select value={hospitalFilter} onChange={e => setHospitalFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Hospitals (primary filter)</option>
          {HOSPITALS.map(h => <option key={h}>{h}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Vendor Types</option>
          {VENDOR_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search vendor name…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{filtered.length} vendor{filtered.length !== 1 ? 's' : ''} match filters{filtered.length > 150 ? ' (showing first 150)' : ''}</span>
        {selected.size > 0 && (
          <span className="text-blue-600 font-medium">{selected.size} selected</span>
        )}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={allDisplayedSelected && displayedVendors.length > 0}
                  onChange={toggleAll} className="w-4 h-4 accent-blue-600" />
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Vendor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Reviewing Hospital</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedVendors.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No vendors match the current filters.</td></tr>
            ) : (
              displayedVendors.map(v => (
                <tr key={v.id} className={`cursor-pointer ${selected.has(v.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => toggleVendor(v.id)}>
                  <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(v.id)}
                      onChange={() => toggleVendor(v.id)}
                      className="w-4 h-4 accent-blue-600" />
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-900">{v.name}</p>
                    {v.city && <p className="text-xs text-gray-400">{v.city}{v.county ? `, ${v.county}` : ''}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600 max-w-40 leading-relaxed">{v.vendorType}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {v.reviewingSite
                      ? <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{v.reviewingSite}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <div className="flex justify-end">
          <button onClick={() => setShowInitiateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <RefreshCw size={14} />Initiate Review Cycle for {selected.size} Vendor{selected.size !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {showInitiateModal && (
        <InitiateReviewCycleModal
          selectedCount={selected.size}
          sitePocs={sitePocs}
          onClose={() => setShowInitiateModal(false)}
          onSubmit={(data) => {
            onInitiate({ ...data, vendorIds: [...selected] });
            setSelected(new Set());
            setShowInitiateModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── Vendor Table (with filters + bulk select/edit) ────────────────────────────

function VendorTable({ vendors, onEdit, onDelete, onBulkUpdate }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [countyFilter, setCountyFilter] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [corporateGroupFilter, setCorporateGroupFilter] = useState('');
  const [clinicalTagFilter, setClinicalTagFilter] = useState('');
  const [vendorTagFilter, setVendorTagFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const filtered = vendors.filter(v => {
    if (search) {
      const q = search.toLowerCase();
      const match = v.name?.toLowerCase().includes(q) ||
        v.vendorType?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.county?.toLowerCase().includes(q) ||
        v.abbreviation?.toLowerCase().includes(q) ||
        v.synonyms?.some(s => s.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (typeFilter && v.vendorType !== typeFilter) return false;
    if (countyFilter && v.county !== countyFilter) return false;
    if (hospitalFilter && v.reviewingSite !== hospitalFilter) return false;
    if (corporateGroupFilter && v.corporateGroup !== corporateGroupFilter) return false;
    if (clinicalTagFilter && !v.clinicalTags?.includes(clinicalTagFilter)) return false;
    if (vendorTagFilter && !v.vendorTags?.includes(vendorTagFilter)) return false;
    if (statusFilter === 'active' && (v.hidden || v.pendingReview)) return false;
    if (statusFilter === 'hidden' && !v.hidden) return false;
    if (statusFilter === 'needs_review' && !v.pendingReview) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const allPageSelected = paginated.length > 0 && paginated.every(v => selected.has(v.id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelected(s => { const n = new Set(s); paginated.forEach(v => n.delete(v.id)); return n; });
    } else {
      setSelected(s => { const n = new Set(s); paginated.forEach(v => n.add(v.id)); return n; });
    }
  };

  const hasFilters = search || typeFilter || countyFilter || hospitalFilter || corporateGroupFilter ||
    clinicalTagFilter || vendorTagFilter || statusFilter;

  const clearFilters = () => {
    setSearch(''); setTypeFilter(''); setCountyFilter(''); setHospitalFilter('');
    setCorporateGroupFilter(''); setClinicalTagFilter(''); setVendorTagFilter(''); setStatusFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-3">
      {/* Filter panel */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name, type, city, county, alias…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <button onClick={() => onEdit({})}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 whitespace-nowrap">
            <Plus size={14} />Add Vendor
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Vendor Types</option>
            {VENDOR_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={countyFilter} onChange={e => { setCountyFilter(e.target.value); setPage(1); }}>
            <option value="">All Counties</option>
            {COUNTIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={hospitalFilter} onChange={e => { setHospitalFilter(e.target.value); setPage(1); }}>
            <option value="">All Reviewing Hospitals</option>
            {HOSPITALS.map(h => <option key={h}>{h}</option>)}
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="needs_review">Needs Review</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={corporateGroupFilter} onChange={e => { setCorporateGroupFilter(e.target.value); setPage(1); }}>
            <option value="">All Corporate Groups</option>
            {CORPORATE_GROUPS.map(g => <option key={g}>{g}</option>)}
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={clinicalTagFilter} onChange={e => { setClinicalTagFilter(e.target.value); setPage(1); }}>
            <option value="">Any Clinical Tag</option>
            {CLINICAL_TAGS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={vendorTagFilter} onChange={e => { setVendorTagFilter(e.target.value); setPage(1); }}>
            <option value="">Any Vendor Tag</option>
            {VENDOR_TAGS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        {hasFilters && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-500">{filtered.length} vendor{filtered.length !== 1 ? 's' : ''} match</span>
            <button onClick={clearFilters} className="text-blue-600 hover:underline">Clear all filters</button>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-sm font-medium text-blue-700">{selected.size} vendor{selected.size !== 1 ? 's' : ''} selected</span>
          <button onClick={() => setShowBulkEdit(true)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            Bulk Edit
          </button>
          <button onClick={() => setSelected(new Set())}
            className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
            Clear Selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={allPageSelected && paginated.length > 0}
                  onChange={toggleSelectAll} className="w-4 h-4 accent-blue-600" />
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Vendor</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Location &amp; Contact</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Hospital</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Corporate Group</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Contacts</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Tags</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">
                  {hasFilters ? 'No vendors match the current filters.' : 'No vendors in directory.'}
                </td>
              </tr>
            ) : (
              paginated.map(v => {
                const allContacts = [
                  ...(v.admissionsContacts || []),
                  ...(v.escalationContacts || []),
                ].filter(c => c?.name);
                return (
                  <tr key={v.id} className={`hover:bg-gray-50 ${selected.has(v.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(v.id)}
                        onChange={e => setSelected(s => { const n = new Set(s); e.target.checked ? n.add(v.id) : n.delete(v.id); return n; })}
                        className="w-4 h-4 accent-blue-600" />
                    </td>
                    <td className="px-4 py-3 max-w-48">
                      <p className="font-medium text-gray-900">{v.name}</p>
                      {v.abbreviation && <p className="text-xs text-gray-400">{v.abbreviation}</p>}
                      {v.synonyms?.length > 0 && (
                        <p className="text-xs text-gray-400 italic truncate">{v.synonyms.slice(0, 2).join(', ')}{v.synonyms.length > 2 ? '…' : ''}</p>
                      )}
                      {v.dataSource && (
                        <span className={`text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block ${
                          v.dataSource === 'Careport' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'
                        }`}>{v.dataSource}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-36 leading-relaxed">{v.vendorType}</td>
                    <td className="px-4 py-3 text-xs space-y-0.5">
                      {v.city && <p className="text-gray-700">{v.city}{v.county ? `, ${v.county} Co.` : ''}</p>}
                      {v.address && <p className="text-gray-400">{v.address}</p>}
                      {v.zip && <p className="text-gray-400">{v.zip}</p>}
                      {v.phone && <p className="text-gray-600 font-mono">{formatPhone(v.phone)}</p>}
                      {v.fax && <p className="text-gray-400">Fax: {formatPhone(v.fax)}</p>}
                      {v.website && <p className="text-blue-500 truncate max-w-32">{v.website}</p>}
                      {v.coverageAreas?.length > 0 && (
                        <p className="text-gray-400">Areas: {v.coverageAreas.join(', ')}</p>
                      )}
                      {v.lastReviewed && <p className="text-gray-300">Reviewed: {v.lastReviewed}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {v.reviewingSite
                        ? <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded whitespace-nowrap">{v.reviewingSite}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{v.corporateGroup || '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      {allContacts.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <div className="space-y-1">
                          {allContacts.slice(0, 3).map((c, i) => (
                            <div key={i}>
                              <p className="font-medium text-gray-800">{c.name}</p>
                              {c.type && <p className="text-gray-400">{c.type}</p>}
                              {c.phone && <p className="text-gray-500 font-mono">{formatPhone(c.phone)}</p>}
                              {c.email && <p className="text-gray-500 truncate max-w-36">{c.email}</p>}
                            </div>
                          ))}
                          {allContacts.length > 3 && (
                            <p className="text-gray-400">+{allContacts.length - 3} more</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {v.vendorTags?.map(t => (
                          <span key={t} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded whitespace-nowrap">{t}</span>
                        ))}
                        {v.clinicalTags?.map(t => (
                          <span key={t} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded whitespace-nowrap">{t}</span>
                        ))}
                        {v.notes && (
                          <span className="text-xs text-gray-400 italic">Has notes</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {v.hidden
                          ? <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 w-fit">Hidden</span>
                          : v.pendingReview
                          ? <span className="text-xs text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 w-fit">Needs Review</span>
                          : <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 w-fit">Active</span>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(v)} className="text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                        <button onClick={() => onDelete(v.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 text-xs">{filtered.length} total · showing page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-100">← Prev</button>
            <button disabled={currentPage === totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-100">Next →</button>
          </div>
        </div>
      )}

      {showBulkEdit && (
        <BulkEditModal
          selectedIds={selected}
          onClose={() => setShowBulkEdit(false)}
          onSave={(updates) => {
            onBulkUpdate(selected, updates);
            setSelected(new Set());
            setShowBulkEdit(false);
          }}
        />
      )}
    </div>
  );
}

function NeedsReviewQueue({ vendors, onResolve, onEdit, onDelete, onToggleHidden }) {
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');

  const groups = {
    conflict: vendors.filter(v => v.conflictNote?.startsWith('Careport data changed')),
    missing: vendors.filter(v => v.conflictNote?.startsWith('Vendor not found')),
    uncategorized: vendors.filter(v => v.conflictNote?.startsWith('Vendor type could not be determined')),
    other: vendors.filter(v => !v.conflictNote),
  };

  const filtered = (reasonFilter === 'all' ? vendors
    : reasonFilter === 'conflict' ? groups.conflict
    : reasonFilter === 'missing' ? groups.missing
    : reasonFilter === 'uncategorized' ? groups.uncategorized
    : groups.other
  ).filter(v =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.vendorType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Needs Review</h2>
        <span className="text-sm text-gray-500">{vendors.length} flagged record{vendors.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: `All (${vendors.length})`, color: 'gray' },
          { id: 'uncategorized', label: `Uncategorized type (${groups.uncategorized.length})`, color: 'purple' },
          { id: 'conflict', label: `Careport conflict (${groups.conflict.length})`, color: 'orange' },
          { id: 'missing', label: `Missing from export (${groups.missing.length})`, color: 'red' },
          { id: 'other', label: `Other (${groups.other.length})`, color: 'blue' },
        ].map(r => (
          <button key={r.id} onClick={() => setReasonFilter(r.id)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              reasonFilter === r.id
                ? r.color === 'orange' ? 'bg-orange-600 text-white border-orange-600'
                  : r.color === 'red' ? 'bg-red-600 text-white border-red-600'
                  : r.color === 'blue' ? 'bg-blue-600 text-white border-blue-600'
                  : r.color === 'purple' ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-gray-800 text-white border-gray-800'
                : 'border-gray-300 text-gray-600 hover:border-gray-400 bg-white'
            }`}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search flagged vendors…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <CheckCircle size={36} className="mx-auto text-green-400 mb-2" />
          <p className="text-gray-500 font-medium">No flagged records</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Vendor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Reason Flagged</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{v.name}</p>
                    <p className="text-xs text-gray-400">{v.city || '—'}{v.county ? `, ${v.county}` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-32 leading-relaxed">{v.vendorType}</td>
                  <td className="px-4 py-3 max-w-xs">
                    {v.conflictNote ? (
                      <span className={`text-xs px-2 py-1 rounded-md inline-block leading-relaxed ${
                        v.conflictNote.startsWith('Careport data changed')
                          ? 'bg-orange-50 text-orange-700'
                          : v.conflictNote.startsWith('Vendor not found')
                          ? 'bg-red-50 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {v.conflictNote}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No reason specified</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {v.hidden && (
                        <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">Hidden</span>
                      )}
                      <button onClick={() => onResolve(v.id)}
                        className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-lg hover:bg-green-100 font-medium">
                        <CheckCircle size={11} />Resolve
                      </button>
                      <button onClick={() => onEdit(v)}
                        className="text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                      <button
                        onClick={() => onToggleHidden(v.id, !v.hidden)}
                        title={v.hidden ? 'Make visible in search' : 'Hide from search'}
                        className="text-gray-400 hover:text-purple-600">
                        {v.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button onClick={() => onDelete(v.id)}
                        className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SynonymsInput({ value = [], onChange }) {
  const [input, setInput] = useState('');
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput('');
  };
  const remove = (s) => onChange(value.filter(x => x !== s));
  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } if (e.key === ',') { e.preventDefault(); add(); } }}
          placeholder="Type alias and press Enter…"
        />
        <button type="button" onClick={add}
          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300">
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(s => (
            <span key={s} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-mono">
              {s}
              <button type="button" onClick={() => remove(s)} className="text-gray-400 hover:text-red-500 ml-0.5">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AddEditVendorModal({ vendor, onClose, onSave }) {
  const isEdit = !!vendor?.id;
  const normSynonyms = (v) => Array.isArray(v?.synonyms) ? v.synonyms
    : v?.synonyms ? v.synonyms.split(',').map(s => s.trim()).filter(Boolean) : [];

  const mergeContacts = (v) => [
    ...(v?.admissionsContacts || []).filter(c => c?.name || c?.type),
    ...(v?.escalationContacts || []).filter(c => c?.name || c?.type),
  ];

  const [form, setForm] = useState(vendor ? {
    ...vendor,
    synonyms: normSynonyms(vendor),
    clinicalTags: vendor.clinicalTags || [],
    vendorTags: vendor.vendorTags || [],
    allContacts: mergeContacts(vendor),
  } : {
    name: '', displayName: '', abbreviation: '', vendorType: '',
    address: '', city: '', county: '', zip: '', state: 'CA',
    phone: '', fax: '', website: '',
    coverageAreas: [],
    allContacts: [],
    clinicalTags: [],
    vendorTags: [],
    synonyms: [],
    notes: '',
    dataSource: 'Manual',
    lastReviewed: new Date().toISOString().split('T')[0],
    reviewingSite: '',
    corporateGroup: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleCoverage = (a) => set('coverageAreas', form.coverageAreas?.includes(a)
    ? form.coverageAreas.filter(x => x !== a) : [...(form.coverageAreas || []), a]);

  const addContact = () => setForm(f => ({
    ...f,
    allContacts: [...(f.allContacts || []), { type: '', title: '', name: '', phone: '', email: '' }]
  }));

  const updateContact = (idx, field, val) => setForm(f => ({
    ...f,
    allContacts: f.allContacts.map((c, i) => i === idx ? { ...c, [field]: val } : c)
  }));

  const removeContact = (idx) => setForm(f => ({
    ...f,
    allContacts: f.allContacts.filter((_, i) => i !== idx)
  }));

  const isAdmType = (type) => type?.toLowerCase().includes('admissions');

  const handleSubmit = (e) => {
    e.preventDefault();
    const contacts = form.allContacts || [];
    const saveData = {
      ...form,
      admissionsContacts: contacts.filter(c => isAdmType(c.type)),
      escalationContacts: contacts.filter(c => !isAdmType(c.type)),
    };
    delete saveData.allContacts;
    onSave(saveData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? `Edit: ${vendor.name}` : 'Add New Vendor'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>
        <form className="px-6 py-5 space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Vendor Name *</label>
              <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Display Name</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.displayName || ''} onChange={e => set('displayName', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Abbreviation</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.abbreviation || ''} onChange={e => set('abbreviation', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Synonyms / Aliases / Former Names</label>
              <SynonymsInput value={form.synonyms || []} onChange={v => set('synonyms', v)} />
              <p className="text-xs text-gray-400 mt-1">Searchable aliases, nicknames, former names. Press Enter or comma to add each one.</p>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Vendor Type *</label>
              <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.vendorType} onChange={e => set('vendorType', e.target.value)}>
                <option value="">Select…</option>
                {VENDOR_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Location</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input placeholder="Address" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.address || ''} onChange={e => set('address', e.target.value)} />
              </div>
              <input placeholder="City" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.city || ''} onChange={e => set('city', e.target.value)} />
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.county || ''} onChange={e => set('county', e.target.value)}>
                <option value="">County…</option>
                {COUNTIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input placeholder="ZIP" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.zip || ''} onChange={e => set('zip', e.target.value)} />
              <input placeholder="Phone" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
              <input placeholder="Fax" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.fax || ''} onChange={e => set('fax', e.target.value)} />
              <input placeholder="Website" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.website || ''} onChange={e => set('website', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reviewing Hospital</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.reviewingSite || ''} onChange={e => set('reviewingSite', e.target.value)}>
                <option value="">Select hospital…</option>
                {HOSPITALS.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Corporate Group</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.corporateGroup || ''} onChange={e => set('corporateGroup', e.target.value)}>
                <option value="">Select group…</option>
                {CORPORATE_GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Service Coverage Areas</p>
            <div className="flex flex-wrap gap-2">
              {SERVICE_AREAS.map(a => (
                <button key={a} type="button"
                  onClick={() => toggleCoverage(a)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    form.coverageAreas?.includes(a)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-600 hover:border-blue-400'
                  }`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Contacts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Contacts</label>
              <button type="button" onClick={addContact}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 bg-blue-50 px-2.5 py-1 rounded-lg">
                <Plus size={12} />Add Contact
              </button>
            </div>
            {(form.allContacts || []).length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2 border border-dashed border-gray-200 rounded-lg text-center">
                No contacts — click "Add Contact" to add one.
              </p>
            ) : (
              <div className="space-y-3">
                {(form.allContacts || []).map((contact, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <select
                        className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={contact.type}
                        onChange={e => updateContact(idx, 'type', e.target.value)}
                      >
                        <option value="">Contact Type…</option>
                        {CONTACT_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <button type="button" onClick={() => removeContact(idx)}
                        className="text-gray-400 hover:text-red-500 text-lg leading-none font-bold flex-shrink-0">×</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Name" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={contact.name} onChange={e => updateContact(idx, 'name', e.target.value)} />
                      <input placeholder="Title" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={contact.title || ''} onChange={e => updateContact(idx, 'title', e.target.value)} />
                      <input placeholder="Phone" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={contact.phone} onChange={e => updateContact(idx, 'phone', e.target.value)} />
                      <input placeholder="Email" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={contact.email} onChange={e => updateContact(idx, 'email', e.target.value)} />
                    </div>
                    {contact.type && (
                      <p className="text-xs text-gray-400">
                        → Will be stored as {isAdmType(contact.type) ? 'Admissions contact' : 'Escalation / other contact'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Clinical Tags</label>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {CLINICAL_TAGS.map(tag => (
                <label key={tag} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                  <input
                    type="checkbox"
                    checked={form.clinicalTags?.includes(tag) || false}
                    onChange={e => setForm(f => ({
                      ...f,
                      clinicalTags: e.target.checked
                        ? [...(f.clinicalTags || []), tag]
                        : (f.clinicalTags || []).filter(t => t !== tag)
                    }))}
                    className="w-3.5 h-3.5 accent-blue-600"
                  />
                  <span className="text-xs">{tag}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Tags</label>
            <div className="grid grid-cols-2 gap-1.5 border border-gray-200 rounded-lg p-2">
              {VENDOR_TAGS.map(tag => (
                <label key={tag} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                  <input
                    type="checkbox"
                    checked={form.vendorTags?.includes(tag) || false}
                    onChange={e => setForm(f => ({
                      ...f,
                      vendorTags: e.target.checked
                        ? [...(f.vendorTags || []), tag]
                        : (f.vendorTags || []).filter(t => t !== tag)
                    }))}
                    className="w-3.5 h-3.5 accent-amber-500"
                  />
                  <span className="text-xs">{tag}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              {isEdit ? 'Save Changes' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AuditLogTab({ auditLog }) {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const ACTION_LABELS = {
    edit: { label: 'Edit', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    create: { label: 'Create', color: 'text-green-700 bg-green-50 border-green-200' },
    delete: { label: 'Delete', color: 'text-red-700 bg-red-50 border-red-200' },
    approve_submission: { label: 'Approved', color: 'text-green-700 bg-green-50 border-green-200' },
    reject_submission: { label: 'Rejected', color: 'text-red-700 bg-red-50 border-red-200' },
    import: { label: 'Import', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  };

  const filtered = auditLog.filter(entry => {
    if (filterAction !== 'all' && entry.action !== filterAction) return false;
    if (search) {
      const q = search.toLowerCase();
      return entry.vendorName?.toLowerCase().includes(q) || entry.changedBy?.toLowerCase().includes(q) || entry.summary?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Audit Log</h2>
      <p className="text-sm text-gray-500">Full history of all changes to vendor records, submissions, and imports. Admin-only view.</p>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search vendor, user, or summary…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
        >
          <option value="all">All actions</option>
          <option value="edit">Edits</option>
          <option value="create">Creates</option>
          <option value="delete">Deletes</option>
          <option value="approve_submission">Approvals</option>
          <option value="reject_submission">Rejections</option>
          <option value="import">Imports</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <History size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">{auditLog.length === 0 ? 'No audit entries yet — changes will appear here.' : 'No entries match your filters.'}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide w-40">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide w-24">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Vendor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide w-32">Changed By</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Summary</th>
                <th className="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(entry => {
                const meta = ACTION_LABELS[entry.action] || { label: entry.action, color: 'text-gray-700 bg-gray-50 border-gray-200' };
                const ts = new Date(entry.timestamp);
                const timeStr = ts.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
                const isOpen = expanded === entry.id;
                return (
                  <>
                    <tr key={entry.id} className={`hover:bg-gray-50 ${isOpen ? 'bg-gray-50' : ''}`}>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">{timeStr}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-0">
                        <span className="block truncate">{entry.vendorName || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{entry.changedBy}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-0">
                        <span className="block truncate">{entry.summary}</span>
                      </td>
                      <td className="px-4 py-3">
                        {entry.changes?.length > 0 && (
                          <button
                            onClick={() => setExpanded(isOpen ? null : entry.id)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </td>
                    </tr>
                    {isOpen && entry.changes?.length > 0 && (
                      <tr key={`${entry.id}-detail`} className="bg-blue-50">
                        <td colSpan={6} className="px-6 py-3">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-500">
                                <th className="text-left pb-1 font-medium w-1/4">Field</th>
                                <th className="text-left pb-1 font-medium w-5/12">Before</th>
                                <th className="text-left pb-1 font-medium w-5/12">After</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-100">
                              {entry.changes.map((c, i) => (
                                <tr key={i}>
                                  <td className="py-1 font-medium text-gray-700 pr-4">{c.field}</td>
                                  <td className="py-1 text-red-700 pr-4 font-mono">{c.oldValue}</td>
                                  <td className="py-1 text-green-700 font-mono">{c.newValue}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminInterface({
  vendors, pendingSubmissions, reviewCycles, sitePocs, auditLog = [],
  onApproveSubmission, onRejectSubmission, onUpdateVendor, onAddVendor, onDeleteVendor,
  onImportCareport, onAddSitePoc, onAddReviewCycle,
}) {
  const [tab, setTab] = useState('dashboard');
  const [editModal, setEditModal] = useState(null);
  const [showAddPocModal, setShowAddPocModal] = useState(false);
  const [importState, setImportState] = useState(null);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const pending = pendingSubmissions.filter(s => s.status === 'Pending').length;
  const activeReview = reviewCycles.find(r => r.status === 'Active');

  const handleFileUpload = async (file) => {
    if (!file) return;
    setImportError(null);
    setImportState('loading');
    try {
      const mod = await import('xlsx');
      const XLSX = mod.default ?? mod;
      if (typeof XLSX.read !== 'function') throw new Error('xlsx library failed to load — XLSX.read is not a function');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const records = parseCareportWorkbook(workbook, XLSX);
      if (records.length === 0) throw new Error('No vendor records found in file. Check that you uploaded the correct Careport export.');
      const result = onImportCareport(records);
      setImportState({ ...result, total: records.length });
    } catch (err) {
      console.error('Careport import error:', err);
      setImportError(err.message || 'Failed to parse file.');
      setImportState(null);
    }
  };

  const handleBulkUpdate = (selectedIds, updates) => {
    selectedIds.forEach(id => {
      const vendor = vendors.find(v => v.id === id);
      if (!vendor) return;
      const patch = {};
      if (updates.vendorType) patch.vendorType = updates.vendorType;
      if (updates.reviewingSite) patch.reviewingSite = updates.reviewingSite;
      if (updates.corporateGroup) patch.corporateGroup = updates.corporateGroup;
      if (updates.coverageAreas) patch.coverageAreas = updates.coverageAreas;
      if (updates._addClinicalTags?.length) {
        patch.clinicalTags = [...new Set([...(vendor.clinicalTags || []), ...updates._addClinicalTags])];
      }
      if (updates._addVendorTags?.length) {
        patch.vendorTags = [...new Set([...(vendor.vendorTags || []), ...updates._addVendorTags])];
      }
      if (updates._addContact?.name) {
        const isAdm = updates._addContact.type?.toLowerCase().includes('admissions');
        if (isAdm) {
          patch.admissionsContacts = [...(vendor.admissionsContacts || []), updates._addContact];
        } else {
          patch.escalationContacts = [...(vendor.escalationContacts || []), updates._addContact];
        }
      }
      if (Object.keys(patch).length > 0) {
        onUpdateVendor(id, patch);
      }
    });
    showToast({
      type: 'approved',
      title: `Bulk update applied`,
      to: '',
      subject: '',
      body: `Updated ${selectedIds.size} vendor${selectedIds.size !== 1 ? 's' : ''}.`,
    });
  };

  const needsReview = vendors.filter(v => v.pendingReview);

  // Only show elevated roles in Users & Roles (not Search Users)
  const elevatedUsers = sitePocs.filter(p => p.role === 'Site POC' || p.role === 'Admin');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'submissions', label: `Submissions${pending > 0 ? ` (${pending})` : ''}`, icon: Clock },
    { id: 'flagged', label: `Needs Review${needsReview.length > 0 ? ` (${needsReview.length})` : ''}`, icon: AlertCircle },
    { id: 'vendors', label: 'Vendor Directory', icon: Edit2 },
    { id: 'import', label: 'Careport Import', icon: Upload },
    { id: 'review', label: 'Review Cycles', icon: RefreshCw },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'audit', label: 'Audit Log', icon: History },
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-52 flex-shrink-0 bg-gray-900 text-white flex flex-col">
        <div className="px-4 py-5 border-b border-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Panel</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <t.icon size={16} />
              {t.label}
              {t.id === 'submissions' && pending > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pending}
                </span>
              )}
              {t.id === 'flagged' && needsReview.length > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {needsReview.length > 99 ? '99+' : needsReview.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">

          {/* Dashboard */}
          {tab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={BarChart2} label="Total Vendors" value={vendors.length} color="blue" />
                <StatCard icon={Clock} label="Pending Submissions" value={pending} color="amber" />
                <div onClick={() => setTab('flagged')} className="cursor-pointer">
                  <StatCard icon={AlertCircle} label="Needs Review" value={vendors.filter(v => v.pendingReview).length} color="red" />
                </div>
                <StatCard icon={CheckCircle} label="Preferred Providers" value={vendors.filter(v => v.vendorTags?.includes('Preferred Provider')).length} color="green" />
              </div>

              {activeReview && (
                <div className="bg-white border border-blue-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <RefreshCw size={16} className="text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Active Review Cycle</h3>
                  </div>
                  <ReviewCycleCard cycle={activeReview} />
                </div>
              )}

              {pending > 0 && (
                <div className="bg-white border border-amber-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-amber-600" />
                      <h3 className="font-semibold text-gray-900">Pending Submissions</h3>
                    </div>
                    <button onClick={() => setTab('submissions')} className="text-sm text-blue-600 hover:underline">View all →</button>
                  </div>
                  <div className="space-y-2">
                    {pendingSubmissions.filter(s => s.status === 'Pending').map(s => (
                      <PendingSubmissionCard key={s.id} submission={s}
                        onApprove={onApproveSubmission} onReject={onRejectSubmission} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Needs Review queue */}
          {tab === 'flagged' && (
            <NeedsReviewQueue
              vendors={needsReview}
              onResolve={(id) => onUpdateVendor(id, { pendingReview: false, conflictNote: undefined, hidden: false })}
              onEdit={(v) => { setEditModal(v); setTab('flagged'); }}
              onDelete={onDeleteVendor}
              onToggleHidden={(id, hide) => onUpdateVendor(id, { hidden: hide, pendingReview: hide ? true : false })}
            />
          )}

          {/* Submissions */}
          {tab === 'submissions' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Vendor Submissions</h2>
              {pendingSubmissions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <CheckCircle size={36} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No submissions to review</p>
                </div>
              ) : (
                pendingSubmissions.map(s => (
                  <PendingSubmissionCard key={s.id} submission={s}
                    onApprove={onApproveSubmission} onReject={onRejectSubmission} />
                ))
              )}
            </div>
          )}

          {/* Vendor directory management */}
          {tab === 'vendors' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Vendor Directory</h2>
              <VendorTable
                vendors={vendors}
                onEdit={(v) => setEditModal(v?.id ? v : {})}
                onDelete={onDeleteVendor}
                onBulkUpdate={handleBulkUpdate}
              />
            </div>
          )}

          {/* Careport Import */}
          {tab === 'import' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Careport Import</h2>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileUp size={20} className="text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Upload Careport Export</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Upload the latest Careport .xlsx export to refresh base records. Manually curated fields
                  (admissions contacts, escalation contacts, preferred provider flags, tags) will not be overwritten.
                  New vendors will be staged for review before going live.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={e => handleFileUpload(e.target.files[0])}
                />

                {importState !== 'loading' && !importState?.total && (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files[0]); }}
                  >
                    <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-sm font-medium text-gray-700">Drop Careport export here or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">Accepts .xlsx files</p>
                  </div>
                )}

                {importState === 'loading' && (
                  <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center bg-blue-50">
                    <Loader size={32} className="mx-auto text-blue-500 mb-3 animate-spin" />
                    <p className="text-sm font-medium text-blue-700">Parsing Careport export…</p>
                    <p className="text-xs text-blue-500 mt-1">Reading 2,400+ vendor records</p>
                  </div>
                )}

                {importError && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle size={16} className="text-red-600" />
                      <p className="font-medium text-red-800">Import Failed</p>
                    </div>
                    <p className="text-sm text-red-700">{importError}</p>
                    <button onClick={() => setImportError(null)} className="mt-2 text-xs text-red-600 underline">Dismiss</button>
                  </div>
                )}

                {importState?.total > 0 && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-600" />
                      <p className="font-semibold text-green-800">Import Complete</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                        <p className="text-2xl font-bold text-gray-900">{importState.total.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Records in export</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                        <p className="text-2xl font-bold text-green-700">{(importState.updatedCount + importState.newCount).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Added / updated</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center border border-orange-200">
                        <p className="text-2xl font-bold text-orange-700">{importState.conflictCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Conflicts flagged</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center border border-red-200">
                        <p className="text-2xl font-bold text-red-700">{importState.removedFromCareportCount ?? 0}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Missing from export</p>
                      </div>
                    </div>
                    {importState.conflictCount > 0 && (
                      <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                        {importState.conflictCount} record{importState.conflictCount !== 1 ? 's have' : ' has'} Careport data that changed on curated records — flagged "Needs Review". Curated fields were not overwritten.
                      </p>
                    )}
                    {(importState.removedFromCareportCount ?? 0) > 0 && (
                      <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {importState.removedFromCareportCount} Careport-sourced record{importState.removedFromCareportCount !== 1 ? 's are' : ' is'} not in this export — flagged "Needs Review" in case they were removed or renamed in Careport.
                      </p>
                    )}
                    <button onClick={() => setImportState(null)} className="text-xs text-green-700 underline">
                      Import another file
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-medium mb-1">Import Rules</p>
                <ul className="space-y-1 text-amber-700 list-disc list-inside">
                  <li>Careport fields only update Careport-sourced data (name, address, phone, fax, services)</li>
                  <li>Manually curated fields are never overwritten by import</li>
                  <li>Conflicting records are flagged "Needs Review" but not auto-resolved</li>
                  <li>New vendors are added with "Pending Review" status and must be approved before going live</li>
                </ul>
              </div>
            </div>
          )}

          {/* Review Cycles */}
          {tab === 'review' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Review Cycles</h2>

              <ReviewCycleVendorSelector
                vendors={vendors}
                sitePocs={sitePocs}
                onInitiate={(data) => {
                  onAddReviewCycle(data);
                  showToast({
                    type: 'approved',
                    title: `Review Cycle Initiated — ${data.name}`,
                    to: data.pocName || '',
                    subject: 'Review Cycle Notification',
                    body: `Email notification sent to ${data.pocName} <${data.pocEmail}> for "${data.name}" (${data.vendorIds?.length || 0} vendors, due ${data.dueDate}).`,
                  });
                }}
              />

              {reviewCycles.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Review Cycle History</h3>
                  <div className="space-y-3">
                    {reviewCycles.map(c => <ReviewCycleCard key={c.id} cycle={c} />)}
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" />How Review Cycles Work
                </h3>
                <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
                  <li>Select vendors by filtering on reviewing hospital or other criteria</li>
                  <li>Click "Initiate Review Cycle" to assign a Site POC and due date</li>
                  <li>POCs receive an email notification with their assigned vendor list</li>
                  <li>POC marks each record: Confirmed Accurate, Needs Update, or Flag for Deletion</li>
                  <li>Admin receives consolidated view of all proposed changes</li>
                  <li>Admin approves or rejects each change; approved changes go live immediately</li>
                  <li>Admin closes the cycle; summary report is generated</li>
                </ol>
              </div>
            </div>
          )}

          {/* Audit Log */}
          {tab === 'audit' && <AuditLogTab auditLog={auditLog} />}

          {/* Users & Roles */}
          {tab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Users & Roles</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Showing Site POC and Admin accounts only. Search Users are not listed here.</p>
                </div>
                <button
                  onClick={() => setShowAddPocModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  <Plus size={14} />Add Site POC
                </button>
              </div>

              {elevatedUsers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <Users size={36} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 font-medium">No Site POCs or Admins added yet</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Add Site POC" to create the first one.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Name</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Role</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Site</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 text-xs uppercase tracking-wide">Email</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {elevatedUsers.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${
                              p.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>{p.role}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{p.site}</td>
                          <td className="px-4 py-3 text-gray-600">{p.email}</td>
                          <td className="px-4 py-3">
                            <button className="text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
                <p className="font-medium text-gray-800 mb-2">Role Definitions</p>
                <div className="space-y-2">
                  <p><span className="font-medium">Search User</span> — Default for all authenticated staff. Read-only access to Vendor Directory. Can submit new vendor contacts. Not shown in this list.</p>
                  <p><span className="font-medium">Site POC</span> — Responsible for reviewing vendor records associated with their hospital site during review cycles. Added here and selectable when initiating review cycles.</p>
                  <p><span className="font-medium">Admin</span> — Full access to Admin Panel. Can import Careport data, manage review cycles, approve/reject submissions, and manage user roles.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Vendor Modal */}
      {editModal !== null && (
        <AddEditVendorModal
          vendor={editModal?.id ? editModal : null}
          onClose={() => setEditModal(null)}
          onSave={(data) => {
            if (data.id) onUpdateVendor(data.id, data);
            else onAddVendor(data);
          }}
        />
      )}

      {/* Add Site POC Modal */}
      {showAddPocModal && (
        <AddSitePocModal
          onClose={() => setShowAddPocModal(false)}
          onSave={(data) => {
            onAddSitePoc(data);
            setShowAddPocModal(false);
            showToast({
              type: 'approved',
              title: `Site POC added — ${data.name}`,
              to: data.name,
              subject: '',
              body: `${data.name} (${data.role}) has been added for ${data.site}.`,
            });
          }}
        />
      )}
    </div>
  );
}
