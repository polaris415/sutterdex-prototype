import { useState } from 'react';
import { X } from 'lucide-react';
import { VENDOR_TYPES, COUNTIES, CONTACT_TYPES } from '../data/sampleData';

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const INPUT_ERR = "w-full border border-red-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400";

function phoneError(val) {
  if (!val) return null;
  const digits = val.replace(/\D/g, '');
  if (digits.length !== 10) return 'Must be 10 digits';
  return null;
}

function Field({ label, required, children, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default function SubmitVendorModal({ onClose, onSubmit, targetVendor, mode = 'new_vendor' }) {
  const isNewVendor = mode === 'new_vendor';
  const isVendorEdit = mode === 'vendor_edit';
  const isContactUpdate = mode === 'contact_update';

  const [form, setForm] = useState({
    // Core
    vendorName: targetVendor ? targetVendor.name : '',
    vendorType: targetVendor ? targetVendor.vendorType : '',
    // Location
    address: '', city: '', county: '', zip: '', state: 'CA',
    // Contact info
    phone: '', fax: '', website: '',
    // Contacts
    admissionsType: '',
    admissionsTitle: '',
    admissionsName: '',
    admissionsPhone: '',
    admissionsEmail: '',
    escalationName: '',
    escalationPhone: '',
    escalationEmail: '',
    // For contact-update mode
    contactRole: 'Admissions',
    contactType: '',
    contactTitle: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    // Submitter notes
    notes: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [phoneErrors, setPhoneErrors] = useState({});
  const validatePhone = (key, val) => setPhoneErrors(e => ({ ...e, [key]: phoneError(val) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const phoneKeys = isContactUpdate ? ['contactPhone'] : ['phone', 'fax', 'admissionsPhone', 'escalationPhone'];
    const errors = {};
    phoneKeys.forEach(k => { errors[k] = phoneError(form[k]); });
    setPhoneErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    if (isContactUpdate) {
      onSubmit({
        type: 'contact_update',
        submittedBy: 'Current User',
        vendorName: targetVendor.name,
        vendorType: targetVendor.vendorType,
        field: `${form.contactRole} Contact`,
        oldValue: null,
        newValue: `${form.contactName} — ${form.contactPhone}${form.contactEmail ? ` — ${form.contactEmail}` : ''}`,
        notes: form.notes,
      });
    } else if (isVendorEdit && targetVendor) {
      const originalData = {
        name: targetVendor.name,
        vendorType: targetVendor.vendorType,
        phone: targetVendor.phone || '',
        fax: targetVendor.fax || '',
        website: targetVendor.website || '',
        address: targetVendor.address || '',
        city: targetVendor.city || '',
        county: targetVendor.county || '',
        zip: targetVendor.zip || '',
        state: targetVendor.state || '',
        notes: targetVendor.notes || '',
        clinicalTags: targetVendor.clinicalTags || [],
        vendorTags: targetVendor.vendorTags || [],
        admissionsContacts: targetVendor.admissionsContacts || [],
        escalationContacts: targetVendor.escalationContacts || [],
        synonyms: targetVendor.synonyms || [],
      };
      const proposedData = {
        ...originalData,
        phone: form.phone || targetVendor.phone || '',
        fax: form.fax || targetVendor.fax || '',
        website: form.website || targetVendor.website || '',
        notes: form.notes || targetVendor.notes || '',
      };
      onSubmit({
        type: 'vendor_edit',
        submittedBy: 'Current User',
        vendorName: targetVendor.name,
        vendorId: targetVendor.id,
        originalData,
        proposedData,
        notes: form.notes,
      });
    } else {
      onSubmit({
        type: 'new_vendor',
        submittedBy: 'Current User',
        vendorName: form.vendorName,
        vendorType: form.vendorType,
        vendorData: {
          name: form.vendorName,
          vendorType: form.vendorType,
          address: form.address,
          city: form.city,
          county: form.county,
          zip: form.zip,
          state: form.state,
          phone: form.phone,
          fax: form.fax,
          website: form.website,
          admissionsContacts: form.admissionsName
            ? [{ type: form.admissionsType, title: form.admissionsTitle, name: form.admissionsName, phone: form.admissionsPhone, email: form.admissionsEmail }]
            : [],
          escalationContacts: form.escalationName
            ? [{ type: '', title: '', name: form.escalationName, phone: form.escalationPhone, email: form.escalationEmail }]
            : [],
          clinicalTags: [],
          vendorTags: [],
        },
        notes: form.notes,
      });
    }
    onClose();
  };

  const title = isNewVendor ? 'Submit New Vendor'
    : isVendorEdit ? `Submit Edit — ${targetVendor?.name}`
    : `Submit Contact Update — ${targetVendor?.name}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5 flex-1">

          {/* New vendor fields */}
          {isNewVendor && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Field label="Vendor Name" required>
                    <input required className={INPUT} value={form.vendorName}
                      onChange={e => set('vendorName', e.target.value)} placeholder="e.g. Sacramento Hospice Alliance" />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Vendor Type" required>
                    <select required className={INPUT + ' bg-white'} value={form.vendorType}
                      onChange={e => set('vendorType', e.target.value)}>
                      <option value="">Select type…</option>
                      {VENDOR_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Location</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Field label="Address">
                      <input className={INPUT} value={form.address}
                        onChange={e => set('address', e.target.value)} placeholder="Street address" />
                    </Field>
                  </div>
                  <Field label="City">
                    <input className={INPUT} value={form.city}
                      onChange={e => set('city', e.target.value)} />
                  </Field>
                  <Field label="County">
                    <select className={INPUT + ' bg-white'} value={form.county}
                      onChange={e => set('county', e.target.value)}>
                      <option value="">Select…</option>
                      {COUNTIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="ZIP">
                    <input className={INPUT} value={form.zip}
                      onChange={e => set('zip', e.target.value)} placeholder="XXXXX" />
                  </Field>
                  <Field label="State">
                    <input className={INPUT} value={form.state} readOnly />
                  </Field>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Contact Info</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Phone" error={phoneErrors.phone}>
                    <input className={phoneErrors.phone ? INPUT_ERR : INPUT} value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      onBlur={e => validatePhone('phone', e.target.value)}
                      placeholder="(XXX) XXX-XXXX" />
                  </Field>
                  <Field label="Fax" error={phoneErrors.fax}>
                    <input className={phoneErrors.fax ? INPUT_ERR : INPUT} value={form.fax}
                      onChange={e => set('fax', e.target.value)}
                      onBlur={e => validatePhone('fax', e.target.value)}
                      placeholder="(XXX) XXX-XXXX" />
                  </Field>
                  <Field label="Website">
                    <input className={INPUT} value={form.website}
                      onChange={e => set('website', e.target.value)} placeholder="https://…" />
                  </Field>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Admissions Contact</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contact Type">
                    <select className={INPUT + ' bg-white'} value={form.admissionsType}
                      onChange={e => set('admissionsType', e.target.value)}>
                      <option value="">Select…</option>
                      {CONTACT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Title">
                    <input className={INPUT} value={form.admissionsTitle}
                      onChange={e => set('admissionsTitle', e.target.value)} placeholder="e.g. RN, MSW" />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <Field label="Name">
                    <input className={INPUT} value={form.admissionsName}
                      onChange={e => set('admissionsName', e.target.value)} placeholder="Full name" />
                  </Field>
                  <Field label="Phone" error={phoneErrors.admissionsPhone}>
                    <input className={phoneErrors.admissionsPhone ? INPUT_ERR : INPUT} value={form.admissionsPhone}
                      onChange={e => set('admissionsPhone', e.target.value)}
                      onBlur={e => validatePhone('admissionsPhone', e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <input type="email" className={INPUT} value={form.admissionsEmail}
                      onChange={e => set('admissionsEmail', e.target.value)} />
                  </Field>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Escalation Contact</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Name">
                    <input className={INPUT} value={form.escalationName}
                      onChange={e => set('escalationName', e.target.value)} placeholder="Full name" />
                  </Field>
                  <Field label="Phone" error={phoneErrors.escalationPhone}>
                    <input className={phoneErrors.escalationPhone ? INPUT_ERR : INPUT} value={form.escalationPhone}
                      onChange={e => set('escalationPhone', e.target.value)}
                      onBlur={e => validatePhone('escalationPhone', e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <input type="email" className={INPUT} value={form.escalationEmail}
                      onChange={e => set('escalationEmail', e.target.value)} />
                  </Field>
                </div>
              </div>
            </>
          )}

          {/* Vendor edit fields */}
          {isVendorEdit && targetVendor && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <p className="font-medium">{targetVendor.name}</p>
                <p className="text-xs text-gray-500">{targetVendor.vendorType}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Phone" error={phoneErrors.phone}>
                  <input className={phoneErrors.phone ? INPUT_ERR : INPUT}
                    value={form.phone || targetVendor.phone || ''}
                    onChange={e => set('phone', e.target.value)}
                    onBlur={e => validatePhone('phone', e.target.value)}
                    placeholder={targetVendor.phone || '(XXX) XXX-XXXX'} />
                </Field>
                <Field label="Fax" error={phoneErrors.fax}>
                  <input className={phoneErrors.fax ? INPUT_ERR : INPUT}
                    value={form.fax || ''}
                    onChange={e => set('fax', e.target.value)}
                    onBlur={e => validatePhone('fax', e.target.value)}
                    placeholder={targetVendor.fax || ''} />
                </Field>
                <Field label="Website">
                  <input className={INPUT}
                    value={form.website || ''}
                    onChange={e => set('website', e.target.value)}
                    placeholder={targetVendor.website || 'https://…'} />
                </Field>
              </div>
            </div>
          )}

          {/* Contact update fields */}
          {isContactUpdate && (
            <div className="space-y-4">
              <Field label="Contact Role">
                <select className={INPUT + ' bg-white'} value={form.contactRole}
                  onChange={e => set('contactRole', e.target.value)}>
                  <option>Admissions</option>
                  <option>Escalation</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact Type">
                  <select className={INPUT + ' bg-white'} value={form.contactType}
                    onChange={e => set('contactType', e.target.value)}>
                    <option value="">Select…</option>
                    {CONTACT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Title">
                  <input className={INPUT} value={form.contactTitle}
                    onChange={e => set('contactTitle', e.target.value)} placeholder="e.g. RN, MSW" />
                </Field>
              </div>
              <Field label="Contact Name" required>
                <input required className={INPUT} value={form.contactName}
                  onChange={e => set('contactName', e.target.value)} placeholder="Full name" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone" error={phoneErrors.contactPhone}>
                  <input className={phoneErrors.contactPhone ? INPUT_ERR : INPUT} value={form.contactPhone}
                    onChange={e => set('contactPhone', e.target.value)}
                    onBlur={e => validatePhone('contactPhone', e.target.value)}
                    placeholder="(XXX) XXX-XXXX" />
                </Field>
                <Field label="Email">
                  <input type="email" className={INPUT} value={form.contactEmail}
                    onChange={e => set('contactEmail', e.target.value)} placeholder="email@org.com" />
                </Field>
              </div>
            </div>
          )}

          <Field label="Notes">
            <textarea rows={3} className={INPUT + ' resize-none'} value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Why are you submitting this? Any context for the admin?" />
          </Field>

          <div className="bg-blue-50 text-blue-800 text-xs rounded-lg p-3">
            This submission will be sent to Tool Administrators for review before appearing in the directory.
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              Submit for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
