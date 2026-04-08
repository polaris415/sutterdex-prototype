import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Star, ChevronDown, Plus, Phone, MapPin, Tag, X, AlertCircle, Check, Download } from 'lucide-react';
import { VENDOR_TYPES, CLINICAL_TAGS, VENDOR_TAGS, COUNTIES, HOSPITALS, CORPORATE_GROUPS } from '../data/sampleData';
import { formatPhone } from '../utils/formatPhone';
import VendorDetail from './VendorDetail';
import SubmitVendorModal from './SubmitVendorModal';
import ProposeEditModal from './ProposeEditModal';

function Badge({ children, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    green: 'bg-green-50 text-green-700 border border-green-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[color]}`}>{children}</span>;
}

function MultiCheckDropdown({ options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => { if (!open) setSearch(''); }, [open]);

  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  const count = selected.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between border rounded-lg px-2.5 py-1.5 text-sm bg-white text-left transition-colors ${
          count > 0 ? 'border-blue-400 text-blue-700 bg-blue-50' : 'border-gray-300 text-gray-500 hover:border-gray-400'
        }`}
      >
        <span className="truncate">{count > 0 ? `${count} selected` : `All`}</span>
        <ChevronDown size={12} className="flex-shrink-0 ml-1" />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {count > 0 && (
              <button
                onClick={() => onChange([])}
                className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-gray-600 border-b border-gray-100"
              >
                Clear selection
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">No matches</p>
            ) : (
              filtered.map(opt => {
                const isSelected = selected.includes(opt);
                return (
                  <label key={opt} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isSelected}
                      onChange={() => onChange(isSelected ? selected.filter(s => s !== opt) : [...selected, opt])}
                    />
                    <div className={`w-3.5 h-3.5 flex-shrink-0 rounded border flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check size={9} className="text-white" />}
                    </div>
                    {opt}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VendorRow({ vendor, onClick, onSubmitEdit }) {
  const isPreferred = vendor.vendorTags?.includes('Preferred Provider');
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
      onClick={() => onClick(vendor)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
              {vendor.name}
            </h3>
            {vendor.synonyms?.length > 0 && (
              <span className="text-xs text-gray-400 italic">({vendor.synonyms.join(' / ')})</span>
            )}
            {isPreferred && (
              <span className="flex items-center gap-0.5 text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                <Star size={9} fill="currentColor" />Preferred
              </span>
            )}
            {vendor.pendingReview && (
              <span className="flex items-center gap-0.5 text-xs text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-200">
                <AlertCircle size={9} />Review Needed
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
            <Badge color="blue">{vendor.vendorType}</Badge>
            {vendor.city && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />{vendor.city}, {vendor.county} County
              </span>
            )}
            {vendor.phone && (
              <span className="flex items-center gap-1">
                <Phone size={12} />{formatPhone(vendor.phone)}
              </span>
            )}
          </div>
          {(vendor.clinicalTags?.length > 0 || vendor.vendorTags?.filter(t => t !== 'Preferred Provider').length > 0) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {[...(vendor.clinicalTags || []), ...(vendor.vendorTags || []).filter(t => t !== 'Preferred Provider')]
                .slice(0, 4).map(t => (
                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                  <Tag size={9} className="inline mr-0.5" />{t}
                </span>
              ))}
              {(vendor.clinicalTags?.length + (vendor.vendorTags?.filter(t => t !== 'Preferred Provider').length || 0)) > 4 && (
                <span className="text-xs text-gray-400">
                  +{vendor.clinicalTags.length + vendor.vendorTags.filter(t => t !== 'Preferred Provider').length - 4} more
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onSubmitEdit(vendor); }}
            className="text-xs text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline whitespace-nowrap"
          >
            + Submit edit
          </button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FILTERS = {
  vendorType: [],
  facilityCounty: [],
  coverageCounty: [],
  clinicalTags: [],
  vendorTags: [],
  corporateGroup: [],
  hospital: [],
};

export default function SearchInterface({ vendors, onSubmitVendor, auditLog = [], isAdmin = false }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState('name');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [submitModal, setSubmitModal] = useState(null); // null | 'new'
  const [editTarget, setEditTarget] = useState(null);  // vendor to propose edit for

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const activeCount =
    filters.vendorType.length + filters.facilityCounty.length + filters.coverageCounty.length +
    filters.corporateGroup.length + filters.hospital.length +
    filters.clinicalTags.length + filters.vendorTags.length;

  const hiddenCount = useMemo(() => vendors.filter(v => v.hidden).length, [vendors]);

  const [exporting, setExporting] = useState(false);

  const exportToExcel = async () => {
    if (results.length === 0) return;
    setExporting(true);
    try {
      const mod = await import('xlsx');
      const XLSX = mod.default ?? mod;

      const rows = results.map(v => {
        const syns = Array.isArray(v.synonyms) ? v.synonyms
          : v.synonyms ? v.synonyms.split(',').map(s => s.trim()).filter(Boolean) : [];
        const admContact = v.admissionsContacts?.[0];
        const escContact = v.escalationContacts?.[0];
        return {
          'Vendor Name': v.name,
          'Also Known As': syns.join('; '),
          'Vendor Type': v.vendorType,
          'Facility County': v.county || '',
          'City': v.city || '',
          'Address': v.address || '',
          'ZIP': v.zip || '',
          'State': v.state || '',
          'Phone': v.phone || '',
          'Fax': v.fax || '',
          'Website': v.website || '',
          'Service Area (Counties)': (v.coverageAreas || []).join('; '),
          'Clinical Tags': (v.clinicalTags || []).join('; '),
          'Vendor Tags': (v.vendorTags || []).join('; '),
          'Corporate Group': v.corporateGroup || '',
          'Preferred Provider': v.vendorTags?.includes('Preferred Provider') ? 'Yes' : 'No',
          'Admissions Contact Name': admContact?.name || '',
          'Admissions Contact Type': admContact?.type || '',
          'Admissions Contact Phone': admContact?.phone || '',
          'Admissions Contact Email': admContact?.email || '',
          'Escalation Contact Name': escContact?.name || '',
          'Escalation Contact Type': escContact?.type || '',
          'Escalation Contact Phone': escContact?.phone || '',
          'Escalation Contact Email': escContact?.email || '',
          'Source': v.dataSource || '',
          'Careport ID': v.careportId || '',
          'Last Reviewed': v.lastReviewed || '',
          'Notes': v.notes || '',
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);

      // Auto-size columns based on header + content width
      const colWidths = Object.keys(rows[0]).map(key => {
        const maxLen = Math.max(
          key.length,
          ...rows.map(r => String(r[key] || '').length)
        );
        return { wch: Math.min(maxLen + 2, 50) };
      });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ContactDex Export');

      // Build filename with date and active filters
      const date = new Date().toISOString().slice(0, 10);
      const filterParts = [
        filters.vendorType,
        filters.facilityCounty ? `${filters.facilityCounty} County` : '',
        query ? `"${query}"` : '',
      ].filter(Boolean);
      const suffix = filterParts.length > 0 ? ` - ${filterParts.join(', ')}` : '';
      const filename = `ContactDex${suffix} ${date}.xlsx`;

      XLSX.writeFile(wb, filename);
    } finally {
      setExporting(false);
    }
  };

  const results = useMemo(() => {
    let list = vendors.filter(v => !v.hidden);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(v => {
        const syns = Array.isArray(v.synonyms) ? v.synonyms
          : v.synonyms ? v.synonyms.split(',').map(s => s.trim()).filter(Boolean) : [];
        return (
          v.name.toLowerCase().includes(q) ||
          v.displayName?.toLowerCase().includes(q) ||
          v.abbreviation?.toLowerCase().includes(q) ||
          v.vendorType.toLowerCase().includes(q) ||
          v.city?.toLowerCase().includes(q) ||
          v.county?.toLowerCase().includes(q) ||
          v.clinicalTags?.some(t => t.toLowerCase().includes(q)) ||
          v.vendorTags?.some(t => t.toLowerCase().includes(q)) ||
          v.notes?.toLowerCase().includes(q) ||
          syns.some(s => s.toLowerCase().includes(q))
        );
      });
    }
    if (filters.vendorType.length > 0) list = list.filter(v => filters.vendorType.includes(v.vendorType));
    if (filters.facilityCounty.length > 0) list = list.filter(v => filters.facilityCounty.includes(v.county));
    if (filters.coverageCounty.length > 0) list = list.filter(v => filters.coverageCounty.some(c => v.coverageAreas?.includes(c)));
    if (filters.clinicalTags.length > 0) list = list.filter(v => filters.clinicalTags.every(t => v.clinicalTags?.includes(t)));
    if (filters.vendorTags.length > 0) list = list.filter(v => filters.vendorTags.every(t => v.vendorTags?.includes(t)));
    if (filters.corporateGroup.length > 0) list = list.filter(v => filters.corporateGroup.includes(v.corporateGroup));
    if (filters.hospital.length > 0) list = list.filter(v => filters.hospital.includes(v.reviewingSite));

    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'type') return a.vendorType.localeCompare(b.vendorType);
      if (sortBy === 'county') return (a.county || '').localeCompare(b.county || '');
      return 0;
    });
  }, [vendors, query, filters, sortBy]);

  return (
    <div className="flex flex-col h-full">
      {/* Search bar + always-visible filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-4">
        {/* Top row: search + new vendor button */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search by name, type, city, tag, synonym…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setSubmitModal('new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus size={15} />New Vendor
          </button>
        </div>

        {/* Filter grid — always visible */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Vendor Type</label>
            <MultiCheckDropdown
              options={VENDOR_TYPES}
              selected={filters.vendorType}
              onChange={v => setFilter('vendorType', v)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Facility County</label>
            <MultiCheckDropdown
              options={COUNTIES}
              selected={filters.facilityCounty}
              onChange={v => setFilter('facilityCounty', v)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Service Area</label>
            <MultiCheckDropdown
              options={COUNTIES}
              selected={filters.coverageCounty}
              onChange={v => setFilter('coverageCounty', v)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Corporate Group</label>
            <MultiCheckDropdown
              options={CORPORATE_GROUPS}
              selected={filters.corporateGroup}
              onChange={v => setFilter('corporateGroup', v)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Clinical Tags</label>
            <MultiCheckDropdown
              options={CLINICAL_TAGS}
              selected={filters.clinicalTags}
              onChange={v => setFilter('clinicalTags', v)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Vendor Tags</label>
            <MultiCheckDropdown
              options={VENDOR_TAGS}
              selected={filters.vendorTags}
              onChange={v => setFilter('vendorTags', v)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Reviewing Hospital</label>
            <MultiCheckDropdown
              options={HOSPITALS}
              selected={filters.hospital}
              onChange={v => setFilter('hospital', v)}
            />
          </div>
          {activeCount > 0 && (
            <div className="flex items-end">
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-xs text-gray-400 hover:text-gray-700 underline"
              >
                Clear all filters ({activeCount})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div>
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">{results.length}</span> vendor{results.length !== 1 ? 's' : ''}
            {query && <span> matching "<span className="italic">{query}</span>"</span>}
          </p>
          {hiddenCount > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {hiddenCount} uncategorized vendor{hiddenCount !== 1 ? 's' : ''} hidden — admins can categorize in Needs Review
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            Sort:
            {['name', 'type', 'county'].map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`px-2 py-1 rounded text-xs font-medium capitalize ${sortBy === s ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'}`}>
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={exportToExcel}
            disabled={exporting || results.length === 0}
            title={`Export ${results.length} vendor${results.length !== 1 ? 's' : ''} to Excel`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download size={12} />
            {exporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>

      {/* Vendor list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {results.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No vendors found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            results.map(v => (
              <VendorRow
                key={v.id}
                vendor={v}
                onClick={setSelectedVendor}
                onSubmitEdit={setEditTarget}
              />
            ))
          )}
        </div>
      </div>

      {/* Vendor detail panel */}
      {selectedVendor && (
        <VendorDetail
          vendor={selectedVendor}
          isAdmin={isAdmin}
          auditLog={auditLog}
          onClose={() => setSelectedVendor(null)}
          onSubmitEdit={setEditTarget}
        />
      )}

      {/* New vendor modal */}
      {submitModal === 'new' && (
        <SubmitVendorModal
          mode="new_vendor"
          onSubmit={onSubmitVendor}
          onClose={() => setSubmitModal(null)}
        />
      )}

      {/* Propose edit modal — single unified path for all vendors */}
      {editTarget && (
        <ProposeEditModal
          vendor={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={(data) => { onSubmitVendor(data); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
