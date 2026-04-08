import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { VENDOR_TYPES, COUNTIES, CLINICAL_TAGS, VENDOR_TAGS, CONTACT_TYPES } from '../data/sampleData';

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const INPUT_ERR = "w-full border border-red-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400";

// Strips non-digits; valid if 10 digits (US) or empty
function phoneError(val) {
  if (!val) return null;
  const digits = val.replace(/\D/g, '');
  if (digits.length !== 10) return 'Must be 10 digits';
  return null;
}

function Field({ label, children, error }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function ContactFields({ prefix, label, form, set, phoneErrors, validatePhone }) {
  const phoneKey = `${prefix}Phone`;
  const err = phoneErrors?.[phoneKey];
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">{label}</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Contact Type">
          <select className={INPUT + ' bg-white'} value={form[`${prefix}Type`] || ''}
            onChange={e => set(`${prefix}Type`, e.target.value)}>
            <option value="">Select…</option>
            {CONTACT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Title (optional)">
          <input className={INPUT} value={form[`${prefix}Title`] || ''}
            onChange={e => set(`${prefix}Title`, e.target.value)} placeholder="e.g. RN, MSW" />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Name">
          <input className={INPUT} value={form[`${prefix}Name`]}
            onChange={e => set(`${prefix}Name`, e.target.value)} placeholder="Full name" />
        </Field>
        <Field label="Phone" error={err}>
          <input className={err ? INPUT_ERR : INPUT} value={form[phoneKey]}
            onChange={e => set(phoneKey, e.target.value)}
            onBlur={e => validatePhone?.(phoneKey, e.target.value)}
            placeholder="(XXX) XXX-XXXX" />
        </Field>
        <Field label="Email">
          <input type="email" className={INPUT} value={form[`${prefix}Email`]}
            onChange={e => set(`${prefix}Email`, e.target.value)} placeholder="email@org.com" />
        </Field>
      </div>
    </div>
  );
}

function TagCheckboxGrid({ label, options, selected, onChange, accentClass = 'accent-blue-600' }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-2 border-b border-gray-100 pb-2">{label}</p>
      <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
        {options.map(tag => (
          <label key={tag} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:bg-white px-2 py-1 rounded transition-colors">
            <div className={`w-3.5 h-3.5 flex-shrink-0 rounded border flex items-center justify-center ${
              selected.includes(tag) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
            }`}>
              {selected.includes(tag) && <Check size={8} className="text-white" strokeWidth={3} />}
            </div>
            <input type="checkbox" className="sr-only" checked={selected.includes(tag)}
              onChange={e => onChange(e.target.checked ? [...selected, tag] : selected.filter(t => t !== tag))} />
            {tag}
          </label>
        ))}
      </div>
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

export default function ProposeEditModal({ vendor, onClose, onSubmit }) {
  const firstAdm = vendor.admissionsContacts?.[0] || {};
  const firstEsc = vendor.escalationContacts?.[0] || {};

  const [phoneErrors, setPhoneErrors] = useState({});
  const validatePhone = (key, val) => setPhoneErrors(e => ({ ...e, [key]: phoneError(val) }));

  const normSynonyms = (v) => Array.isArray(v?.synonyms) ? v.synonyms
    : v?.synonyms ? v.synonyms.split(',').map(s => s.trim()).filter(Boolean) : [];

  const [form, setForm] = useState({
    name: vendor.name || '',
    vendorType: vendor.vendorType || '',
    phone: vendor.phone || '',
    fax: vendor.fax || '',
    website: vendor.website || '',
    address: vendor.address || '',
    city: vendor.city || '',
    county: vendor.county || '',
    zip: vendor.zip || '',
    state: vendor.state || 'CA',
    notes: vendor.notes || '',
    synonyms: normSynonyms(vendor),
    clinicalTags: vendor.clinicalTags || [],
    vendorTags: vendor.vendorTags || [],
    admissionsType: firstAdm.type || '',
    admissionsTitle: firstAdm.title || '',
    admissionsName: firstAdm.name || '',
    admissionsPhone: firstAdm.phone || '',
    admissionsEmail: firstAdm.email || '',
    escalationType: firstEsc.type || '',
    escalationTitle: firstEsc.title || '',
    escalationName: firstEsc.name || '',
    escalationPhone: firstEsc.phone || '',
    escalationEmail: firstEsc.email || '',
    submitterNotes: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate all phone fields before submitting
    const allPhoneKeys = ['phone', 'fax', 'admissionsPhone', 'escalationPhone'];
    const errors = {};
    allPhoneKeys.forEach(k => { errors[k] = phoneError(form[k]); });
    setPhoneErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    // Build proposed vendor snapshot
    const proposedData = {
      name: form.name,
      vendorType: form.vendorType,
      phone: form.phone,
      fax: form.fax,
      website: form.website,
      address: form.address,
      city: form.city,
      county: form.county,
      zip: form.zip,
      state: form.state,
      notes: form.notes,
      synonyms: form.synonyms,
      clinicalTags: form.clinicalTags,
      vendorTags: form.vendorTags,
      admissionsContacts: form.admissionsName
        ? [{ type: form.admissionsType, title: form.admissionsTitle, name: form.admissionsName, phone: form.admissionsPhone, email: form.admissionsEmail }]
        : vendor.admissionsContacts || [],
      escalationContacts: form.escalationName
        ? [{ type: form.escalationType, title: form.escalationTitle, name: form.escalationName, phone: form.escalationPhone, email: form.escalationEmail }]
        : vendor.escalationContacts || [],
    };

    // Build original snapshot for diff display in admin
    const originalData = {
      name: vendor.name || '',
      vendorType: vendor.vendorType || '',
      phone: vendor.phone || '',
      fax: vendor.fax || '',
      website: vendor.website || '',
      address: vendor.address || '',
      city: vendor.city || '',
      county: vendor.county || '',
      zip: vendor.zip || '',
      state: vendor.state || 'CA',
      notes: vendor.notes || '',
      synonyms: normSynonyms(vendor),
      clinicalTags: vendor.clinicalTags || [],
      vendorTags: vendor.vendorTags || [],
      admissionsContacts: vendor.admissionsContacts || [],
      escalationContacts: vendor.escalationContacts || [],
    };

    onSubmit({
      type: 'vendor_edit',
      submittedBy: 'Current User',
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorType: vendor.vendorType,
      originalData,
      proposedData,
      notes: form.submitterNotes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Propose Edit — {vendor.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Changes will be sent to admins for review before going live.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5 flex-1">

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Vendor Name">
                <input className={INPUT} value={form.name}
                  onChange={e => set('name', e.target.value)} />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Vendor Type">
                <select className={INPUT + ' bg-white'} value={form.vendorType}
                  onChange={e => set('vendorType', e.target.value)}>
                  <option value="">Select type…</option>
                  {VENDOR_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <Field label="Synonyms / Aliases / Former Names">
            <SynonymsInput value={form.synonyms} onChange={v => set('synonyms', v)} />
            <p className="text-xs text-gray-400 mt-1">Searchable aliases, nicknames, former names. Press Enter or comma to add each one.</p>
          </Field>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">Location</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Address">
                  <input className={INPUT} value={form.address}
                    onChange={e => set('address', e.target.value)} />
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
                  onChange={e => set('zip', e.target.value)} />
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

          <ContactFields prefix="admissions" label="Admissions Contact" form={form} set={set} phoneErrors={phoneErrors} validatePhone={validatePhone} />
          <ContactFields prefix="escalation" label="Escalation Contact" form={form} set={set} phoneErrors={phoneErrors} validatePhone={validatePhone} />

          <TagCheckboxGrid
            label="Clinical Tags"
            options={CLINICAL_TAGS}
            selected={form.clinicalTags}
            onChange={v => set('clinicalTags', v)}
          />

          <TagCheckboxGrid
            label="Vendor Tags"
            options={VENDOR_TAGS}
            selected={form.vendorTags}
            onChange={v => set('vendorTags', v)}
          />

          <Field label="Notes / Additional Info">
            <textarea rows={2} className={INPUT + ' resize-none'} value={form.notes}
              onChange={e => set('notes', e.target.value)} />
          </Field>

          <Field label="Reason for edit (shown to admin)">
            <textarea rows={2} className={INPUT + ' resize-none'} value={form.submitterNotes}
              onChange={e => set('submitterNotes', e.target.value)}
              placeholder="What changed and why? e.g. new admissions contact as of March 2026" />
          </Field>

          <div className="bg-blue-50 text-blue-800 text-xs rounded-lg p-3">
            Your proposed changes will be sent to a ContactDex administrator for review. The directory will not be updated until an admin approves.
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
