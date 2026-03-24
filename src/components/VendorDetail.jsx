import { useState } from 'react';
import { X, Phone, Mail, Globe, MapPin, Star, ExternalLink, Calendar, Database, Tag, History, ChevronDown, Edit2 } from 'lucide-react';
import { formatPhone } from '../utils/formatPhone';

function ContactBlock({ title, contacts }) {
  if (!contacts || contacts.length === 0) return null;
  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h4>
      {contacts.map((c, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3 mb-2">
          {c.type && <p className="text-xs text-gray-500 font-medium mb-0.5">{c.type}</p>}
          {c.title && <p className="text-xs text-gray-500 italic mb-0.5">{c.title}</p>}
          {c.name && <p className="font-medium text-gray-900 text-sm">{c.name}</p>}
          <div className="flex flex-wrap gap-3 mt-1">
            {c.phone && (
              <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-blue-600 text-sm hover:underline">
                <Phone size={12} />{formatPhone(c.phone)}
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-blue-600 text-sm hover:underline">
                <Mail size={12} />{c.email}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SingleContact({ title, contact }) {
  if (!contact) return null;
  return <ContactBlock title={title} contacts={[contact]} />;
}

function VendorAuditHistory({ vendorId, auditLog }) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const entries = auditLog.filter(e => e.vendorId === vendorId);
  if (entries.length === 0) return (
    <div className="border-t border-gray-100 pt-4">
      <p className="text-xs text-gray-400 italic">No edit history recorded for this vendor.</p>
    </div>
  );

  const ACTION_COLOR = {
    edit: 'text-blue-700 bg-blue-50 border-blue-200',
    create: 'text-green-700 bg-green-50 border-green-200',
    delete: 'text-red-700 bg-red-50 border-red-200',
    approve_submission: 'text-green-700 bg-green-50 border-green-200',
    reject_submission: 'text-red-700 bg-red-50 border-red-200',
    import: 'text-purple-700 bg-purple-50 border-purple-200',
  };
  const ACTION_LABEL = { edit: 'Edit', create: 'Create', delete: 'Delete', approve_submission: 'Approved', reject_submission: 'Rejected', import: 'Import' };

  return (
    <div className="border-t border-gray-100 pt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 w-full text-left"
      >
        <History size={12} />
        Version History ({entries.length})
        <ChevronDown size={12} className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {entries.map(entry => {
            const ts = new Date(entry.timestamp);
            const timeStr = ts.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
            const isExp = expandedId === entry.id;
            const color = ACTION_COLOR[entry.action] || 'text-gray-700 bg-gray-50 border-gray-200';
            const label = ACTION_LABEL[entry.action] || entry.action;
            return (
              <div key={entry.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div
                  className={`flex items-center gap-2 px-3 py-2 ${entry.changes?.length > 0 ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  onClick={() => entry.changes?.length > 0 && setExpandedId(isExp ? null : entry.id)}
                >
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full border flex-shrink-0 ${color}`}>{label}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 truncate">{entry.summary}</p>
                    <p className="text-xs text-gray-400">{timeStr} · {entry.changedBy}</p>
                  </div>
                  {entry.changes?.length > 0 && (
                    <ChevronDown size={12} className={`text-gray-400 flex-shrink-0 transition-transform ${isExp ? 'rotate-180' : ''}`} />
                  )}
                </div>
                {isExp && entry.changes?.length > 0 && (
                  <div className="border-t border-gray-200 px-3 py-2 space-y-1">
                    {entry.changes.map((c, i) => (
                      <div key={i} className="text-xs grid grid-cols-3 gap-2">
                        <span className="font-medium text-gray-600">{c.field}</span>
                        <span className="text-red-600 font-mono truncate">{c.oldValue}</span>
                        <span className="text-green-700 font-mono truncate">{c.newValue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function VendorDetail({ vendor, onClose, auditLog = [], isAdmin = false, onSubmitEdit }) {
  if (!vendor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 pt-5 pb-4 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {vendor.vendorType}
                </span>
                {vendor.vendorTags?.includes('Preferred Provider') && (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Star size={10} fill="currentColor" /> Preferred Provider
                  </span>
                )}
                {vendor.pendingReview && (
                  <span className="text-xs font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                    Needs Review
                  </span>
                )}
                {vendor.hidden && isAdmin && (
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-300">
                    Hidden from search
                  </span>
                )}
                <span className="text-xs text-gray-500 ml-auto font-mono">{vendor.id}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-2 leading-tight">{vendor.name}</h2>
              {vendor.displayName && vendor.displayName !== vendor.name && (
                <p className="text-sm text-gray-500">Also known as: <span className="font-medium">{vendor.displayName}</span>
                  {vendor.abbreviation && ` (${vendor.abbreviation})`}
                </p>
              )}
              {(() => {
                const syns = Array.isArray(vendor.synonyms) ? vendor.synonyms
                  : vendor.synonyms ? vendor.synonyms.split(',').map(s => s.trim()).filter(Boolean) : [];
                return syns.length > 0 ? (
                  <p className="text-xs text-gray-400 italic mt-0.5">Also known as: {syns.join(', ')}</p>
                ) : null;
              })()}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
              {onSubmitEdit && (
                <button
                  onClick={() => onSubmitEdit(vendor)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit2 size={12} />Propose Edit
                </button>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 flex-1">
          {/* Synonyms / aliases */}
          {(() => {
            const syns = Array.isArray(vendor.synonyms) ? vendor.synonyms
              : vendor.synonyms ? vendor.synonyms.split(',').map(s => s.trim()).filter(Boolean) : [];
            const all = [
              vendor.displayName && vendor.displayName !== vendor.name ? vendor.displayName : null,
              vendor.abbreviation || null,
              ...syns,
            ].filter(Boolean);
            return all.length > 0 ? (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Also Known As</h4>
                <div className="flex flex-wrap gap-1.5">
                  {all.map((s, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-mono">{s}</span>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Location & Contact */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Location & Contact</h4>
            <div className="space-y-2">
              {vendor.address && (
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>{vendor.address}, {vendor.city}, {vendor.state} {vendor.zip}</span>
                </div>
              )}
              {!vendor.address && vendor.city && (
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>{vendor.city}, {vendor.county} County, {vendor.state}</span>
                </div>
              )}
              {vendor.phone && (
                <a href={`tel:${vendor.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Phone size={14} className="text-gray-400 flex-shrink-0" />{formatPhone(vendor.phone)}
                </a>
              )}
              {vendor.fax && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-gray-400 text-xs w-3.5 text-center flex-shrink-0">F</span>{vendor.fax}
                </div>
              )}
              {vendor.website && (
                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Globe size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate">{vendor.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink size={10} className="flex-shrink-0" />
                </a>
              )}
            </div>
          </div>

          {/* Coverage */}
          {vendor.coverageAreas?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Service Area</h4>
              <div className="flex flex-wrap gap-1.5">
                {vendor.coverageAreas.map(a => (
                  <span key={a} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {vendor.services?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Services</h4>
              <div className="flex flex-wrap gap-1.5">
                {vendor.services.map(s => (
                  <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Contacts */}
          <ContactBlock title="Admissions Contacts" contacts={vendor.admissionsContacts} />
          <ContactBlock title="Escalation Contacts" contacts={vendor.escalationContacts} />
          <SingleContact title="SCAH Escalation Contact" contact={vendor.scahEscalationContact} />
          <SingleContact title="Regional Escalation" contact={vendor.regionalEscalation} />
          <SingleContact title="Patient Pathways Contact" contact={vendor.pathwaysContact} />
          <SingleContact title="Regional Lead" contact={vendor.regionalLead} />
          <SingleContact title="Local HMO / IPA Contact" contact={vendor.localHmoContact} />
          <SingleContact title="Regional Referral Contact" contact={vendor.regionalReferralContact} />

          {/* Type-specific fields */}
          {vendor.corporateGroup && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">SNF Corporate Group</h4>
              <p className="text-sm text-gray-800">{vendor.corporateGroup}</p>
            </div>
          )}
          {vendor.specialtyServices?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">DME Specialty Services</h4>
              <div className="flex flex-wrap gap-1.5">
                {vendor.specialtyServices.map(s => (
                  <span key={s} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-md border border-purple-100">{s}</span>
                ))}
              </div>
            </div>
          )}
          {vendor.transportTypes?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transport Types</h4>
              <div className="flex flex-wrap gap-1.5">
                {vendor.transportTypes.map(t => (
                  <span key={t} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{t}</span>
                ))}
              </div>
              {(vendor.insuranceCovered || vendor.privatePay) && (
                <p className="text-xs text-gray-500 mt-1">
                  {[vendor.insuranceCovered && 'Insurance-covered', vendor.privatePay && 'Private pay'].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          )}

          {/* Clinical Tags */}
          {vendor.clinicalTags?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Tag size={11} />Clinical Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {vendor.clinicalTags.map(t => (
                  <span key={t} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Vendor Tags */}
          {vendor.vendorTags?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Tag size={11} />Vendor Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {vendor.vendorTags.map(t => (
                  <span key={t} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-100">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {vendor.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-yellow-800 uppercase tracking-wider mb-1">Notes</h4>
              <p className="text-sm text-yellow-900">{vendor.notes}</p>
            </div>
          )}

          {(vendor.pendingNote || vendor.conflictNote) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-orange-800 uppercase tracking-wider mb-1">Review Note</h4>
              <p className="text-sm text-orange-900">{vendor.conflictNote || vendor.pendingNote}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Record Info</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Database size={11} />
                <span>Source: <span className="font-medium text-gray-700">{vendor.dataSource}</span></span>
              </div>
              {vendor.careportId && (
                <div>Careport ID: <span className="font-medium text-gray-700 font-mono">{vendor.careportId}</span></div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar size={11} />
                <span>Reviewed: <span className="font-medium text-gray-700">{vendor.lastReviewed}</span></span>
              </div>
              <div>Site: <span className="font-medium text-gray-700">{vendor.reviewingSite}</span></div>
            </div>
          </div>

          {/* Version history — admin only */}
          {isAdmin && <VendorAuditHistory vendorId={vendor.id} auditLog={auditLog} />}
        </div>
      </div>

    </div>
  );
}
