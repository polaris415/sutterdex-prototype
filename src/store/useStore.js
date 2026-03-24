import { useState, useCallback } from 'react';
import { initialVendors, PENDING_SUBMISSIONS, REVIEW_CYCLES, SITE_POCS } from '../data/sampleData';
import careportVendors from '../data/careportVendors.json';

let idCounter = 200;
let auditIdCounter = 1;

// ── Audit helpers ────────────────────────────────────────────────────────────

const FIELD_LABELS = {
  name: 'Name', displayName: 'Display Name', abbreviation: 'Abbreviation',
  vendorType: 'Vendor Type', phone: 'Phone', fax: 'Fax', website: 'Website',
  address: 'Address', city: 'City', county: 'County', zip: 'ZIP', state: 'State',
  notes: 'Notes',
  admissionsContacts: 'Admissions Contacts', escalationContacts: 'Escalation Contacts',
  clinicalTags: 'Clinical Tags', vendorTags: 'Vendor Tags',
  coverageAreas: 'Coverage Areas', reviewingSite: 'Reviewing Site',
  services: 'Services', corporateGroup: 'Corporate Group', synonyms: 'Synonyms / Aliases', hidden: 'Visibility',
};

// Fields that change automatically and shouldn't appear in audit diffs
const SKIP_FIELDS = new Set(['lastReviewed', 'pendingReview', 'conflictNote', 'status', 'id', 'careportId', 'dataSource', 'rawServiceArea']);

function serialize(v) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) {
    if (v.length === 0) return '—';
    // Contacts: summarise as "Name (phone)"
    if (v[0] && typeof v[0] === 'object' && 'name' in v[0]) {
      return v.map(c => [c.name, c.phone, c.email].filter(Boolean).join(', ')).join(' | ');
    }
    return v.join(', ');
  }
  return String(v);
}

function diffVendor(existing, updates) {
  const changes = [];
  for (const [field, newVal] of Object.entries(updates)) {
    if (SKIP_FIELDS.has(field)) continue;
    const oldVal = existing[field];
    if (serialize(oldVal) === serialize(newVal)) continue;
    changes.push({
      field: FIELD_LABELS[field] || field,
      oldValue: serialize(oldVal),
      newValue: serialize(newVal),
    });
  }
  return changes;
}

function makeEntry(action, vendorId, vendorName, changedBy, changes = [], summary = '') {
  return {
    id: `AUD${String(auditIdCounter++).padStart(5, '0')}`,
    timestamp: new Date().toISOString(),
    action,
    vendorId,
    vendorName,
    changedBy,
    changes,
    summary: summary || (changes.length > 0 ? `${changes.length} field${changes.length !== 1 ? 's' : ''} changed` : action),
  };
}

// ── Careport merge ────────────────────────────────────────────────────────────

const CAREPORT_SCALAR_FIELDS = ['name', 'displayName', 'address', 'city', 'county', 'zip', 'state', 'phone', 'fax', 'website', 'abbreviation'];

function hasCuratedData(vendor) {
  if (vendor.admissionsContacts?.length > 0) return true;
  if (vendor.escalationContacts?.length > 0) return true;
  if (vendor.clinicalTags?.length > 0 || vendor.vendorTags?.length > 0) return true;
  if (vendor.notes && !vendor.notes.startsWith('Careport contact info:')) return true;
  return false;
}

function mergeImport(existing, imported) {
  const importedIds = new Set(imported.map(v => v.careportId).filter(Boolean));
  const existingByCareportId = {};
  existing.forEach(v => { if (v.careportId) existingByCareportId[v.careportId] = v; });

  const updated = [...existing];
  let newCount = 0, conflictCount = 0, updatedCount = 0, removedFromCareportCount = 0;

  for (const imp of imported) {
    const match = existingByCareportId[imp.careportId];
    if (match) {
      const patch = {};
      CAREPORT_SCALAR_FIELDS.forEach(f => { if (imp[f]) patch[f] = imp[f]; });
      if (imp.services?.length) patch.services = imp.services;
      const hasDataChange = CAREPORT_SCALAR_FIELDS.some(f => imp[f] && match[f] && imp[f] !== match[f]);
      const hasConflict = hasDataChange && hasCuratedData(match);
      const idx = updated.findIndex(v => v.id === match.id);
      updated[idx] = { ...match, ...patch, pendingReview: hasConflict, conflictNote: hasConflict ? 'Careport data changed on a curated record — verify contacts still accurate.' : undefined };
      if (hasConflict) conflictCount++;
      else updatedCount++;
    } else {
      updated.push({ ...imp, pendingReview: false });
      newCount++;
    }
  }

  for (const v of existing) {
    if (v.dataSource === 'Careport' && v.careportId && !importedIds.has(v.careportId)) {
      const idx = updated.findIndex(u => u.id === v.id);
      if (idx !== -1 && !updated[idx].pendingReview) {
        updated[idx] = { ...updated[idx], pendingReview: true, conflictNote: 'Vendor not found in latest Careport export — may have been removed or renamed.' };
        removedFromCareportCount++;
      }
    }
  }

  return { vendors: updated, newCount, conflictCount, updatedCount, removedFromCareportCount };
}

// ── Store ─────────────────────────────────────────────────────────────────────

export function useStore() {
  const [vendors, setVendors] = useState([...initialVendors, ...careportVendors]);
  const [pendingSubmissions, setPendingSubmissions] = useState(PENDING_SUBMISSIONS);
  const [reviewCycles, setReviewCycles] = useState(REVIEW_CYCLES);
  const [sitePocs, setSitePocs] = useState(SITE_POCS);
  const [auditLog, setAuditLog] = useState([]);
  const [currentUser] = useState({ name: 'Admin User', role: 'Admin' });

  const log = useCallback((entry) => {
    setAuditLog(prev => [entry, ...prev]);
  }, []);

  const updateVendor = useCallback((vendorId, updates) => {
    const existing = vendors.find(v => v.id === vendorId);
    if (existing) {
      const changes = diffVendor(existing, updates);
      if (changes.length > 0) {
        log(makeEntry('edit', vendorId, existing.name, currentUser.name, changes));
      }
    }
    setVendors(prev => prev.map(v => v.id === vendorId
      ? { ...v, ...updates, lastReviewed: new Date().toISOString().split('T')[0] }
      : v
    ));
  }, [vendors, log, currentUser.name]);

  const addVendor = useCallback((vendorData) => {
    const id = `V${String(++idCounter).padStart(4, '0')}`;
    const vendor = { ...vendorData, id, status: 'Active', pendingReview: false };
    setVendors(prev => [...prev, vendor]);
    log(makeEntry('create', id, vendorData.name, currentUser.name, [], 'Vendor created manually'));
    return id;
  }, [log, currentUser.name]);

  const deleteVendor = useCallback((vendorId) => {
    const v = vendors.find(v => v.id === vendorId);
    if (v) log(makeEntry('delete', vendorId, v.name, currentUser.name, [], 'Vendor deleted'));
    setVendors(prev => prev.filter(v => v.id !== vendorId));
  }, [vendors, log, currentUser.name]);

  const approveSubmission = useCallback((submissionId) => {
    const submission = pendingSubmissions.find(s => s.id === submissionId);
    if (!submission) return;

    if (submission.type === 'new_vendor' && submission.vendorData) {
      const newId = `M${String(++idCounter).padStart(4, '0')}`;
      const newVendor = {
        ...submission.vendorData, id: newId, careportId: '', dataSource: 'Manual',
        clinicalTags: [], vendorTags: [],
        coverageAreas: submission.vendorData.county ? [submission.vendorData.county] : [],
        status: 'Active', pendingReview: false,
        lastReviewed: new Date().toISOString().split('T')[0], reviewingSite: '', notes: '',
      };
      setVendors(prev => [...prev, newVendor]);
      log(makeEntry('approve_submission', newId, submission.vendorName, currentUser.name, [],
        `New vendor approved from submission by ${submission.submittedBy}`));
    } else if (submission.type === 'contact_update') {
      const target = vendors.find(v => v.name === submission.vendorName);
      if (target) {
        const parts = submission.newValue?.split(' — ') || [];
        const contact = { name: parts[0] || '', phone: parts[1] || '', email: parts[2] || '' };
        const field = submission.field?.startsWith('Admissions') ? 'admissionsContacts' : 'escalationContacts';
        setVendors(prev => prev.map(v => v.id === target.id
          ? { ...v, [field]: [...(v[field] || []), contact] }
          : v
        ));
        const changes = [{ field: submission.field, oldValue: submission.oldValue || '—', newValue: submission.newValue }];
        log(makeEntry('approve_submission', target.id, target.name, currentUser.name, changes,
          `Contact update approved from submission by ${submission.submittedBy}`));
      }
    } else if (submission.type === 'vendor_edit' && submission.vendorId && submission.proposedData) {
      const existing = vendors.find(v => v.id === submission.vendorId);
      if (existing) {
        const changes = diffVendor(existing, submission.proposedData);
        setVendors(prev => prev.map(v => v.id === submission.vendorId
          ? { ...v, ...submission.proposedData, lastReviewed: new Date().toISOString().split('T')[0] }
          : v
        ));
        log(makeEntry('approve_submission', existing.id, existing.name, currentUser.name, changes,
          `Vendor edit approved from submission by ${submission.submittedBy}`));
      }
    }

    setPendingSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status: 'Approved' } : s));
  }, [vendors, pendingSubmissions, log, currentUser.name]);

  const rejectSubmission = useCallback((submissionId, adminNote) => {
    const submission = pendingSubmissions.find(s => s.id === submissionId);
    if (submission) {
      log(makeEntry('reject_submission', submission.vendorId || '', submission.vendorName, currentUser.name, [],
        `Submission rejected${adminNote ? `: "${adminNote}"` : ''}`));
    }
    setPendingSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status: 'Rejected', adminNote } : s));
  }, [pendingSubmissions, log, currentUser.name]);

  const submitVendorEntry = useCallback((submissionData) => {
    const id = `SUB${String(++idCounter).padStart(3, '0')}`;
    setPendingSubmissions(prev => [
      { ...submissionData, id, status: 'Pending', submittedAt: new Date().toISOString().split('T')[0] },
      ...prev,
    ]);
  }, []);

  const importCareport = useCallback((importedRecords) => {
    const result = mergeImport(vendors, importedRecords);
    setVendors(result.vendors);
    log(makeEntry('import', '', 'Careport Export', currentUser.name, [],
      `Careport import: ${result.newCount} new, ${result.updatedCount} updated, ${result.conflictCount} conflicts, ${result.removedFromCareportCount} missing`));
    return { newCount: result.newCount, conflictCount: result.conflictCount, updatedCount: result.updatedCount, removedFromCareportCount: result.removedFromCareportCount };
  }, [vendors, log, currentUser.name]);

  return {
    vendors, pendingSubmissions, reviewCycles, sitePocs, currentUser, auditLog,
    approveSubmission, rejectSubmission, updateVendor, addVendor, deleteVendor,
    submitVendorEntry, importCareport,
  };
}
