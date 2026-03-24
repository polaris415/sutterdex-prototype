/**
 * Pre-processes the Careport Excel export into JSON for bundling with the app.
 * Run: node scripts/importCareport.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { read, utils } from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INPUT  = resolve(__dirname, '../../Careport Export Norcal.xlsx');
const OUTPUT = resolve(__dirname, '../src/data/careportVendors.json');

// ── Vendor type inference ────────────────────────────────────────────────────

const SERVICE_TO_VENDOR_TYPE = {
  'Skilled Nursing': 'Skilled Nursing Facility (SNF)',
  'Transitional Care Unit': 'Skilled Nursing Facility (SNF)',
  'Home Health Services': 'Home Health',
  'Home Nursing': 'Home Health',
  'Home Rehabilitation': 'Home Health',
  'Home Hospice': 'Hospice — Home',
  'End-of-Life Care': 'Hospice — Home',
  'Inpatient Hospice': 'Hospice — Home',
  'Palliative Care': 'Hospice — Home',
  'Home Infusion and Injection': 'Home Infusion / Enteral Feeding',
  'Infusion and IV Therapy': 'Home Infusion / Enteral Feeding',
  'Infusion Clinic': 'Outpatient Infusion',
  'In-Center Dialysis': 'Dialysis — In-Center',
  'In-Center Hemodialysis': 'Dialysis — In-Center',
  'In-Center Peritoneal Dialysis': 'Dialysis — In-Center',
  'Dialysis': 'Dialysis — In-Center',
  'Home Dialysis': 'Dialysis — In-Center',
  'Home Hemodialysis': 'Dialysis — In-Center',
  'Home Peritoneal Dialysis': 'Dialysis — In-Center',
  'Long Term Acute Care': 'Long-Term Acute Care (LTACH)',
  'Inpatient Rehabilitation': 'Acute Rehabilitation Unit (ARU)',
  'Physical Medicine and Rehabilitation': 'Acute Rehabilitation Unit (ARU)',
  'Durable Medical Equipment': 'Durable Medical Equipment (DME)',
  'Hospital Beds': 'Durable Medical Equipment (DME)',
  'Oxygen Equipment and Accessories': 'Durable Medical Equipment (DME)',
  'In-Home Oxygen Therapy': 'Durable Medical Equipment (DME)',
  'Ventilator Equipment': 'Durable Medical Equipment (DME)',
  'Power and Manual Mobility Devices': 'Durable Medical Equipment (DME)',
  'Manual Wheelchairs': 'Durable Medical Equipment (DME)',
  'Walkers': 'Durable Medical Equipment (DME)',
  'Bath Safety Equipment': 'Durable Medical Equipment (DME)',
  'Transportation': 'Transportation',
  'Non-Medical Transportation': 'Transportation',
  'Community Transportation Programs': 'Transportation',
  'Medi-Vans': 'Transportation',
  'Taxi': 'Transportation',
  'Outpatient Physical Therapy': 'Outpatient Services',
  'Outpatient Rehabilitation': 'Outpatient Services',
  'Behavioral Health Services': 'Outpatient Services',
  'Mental Health Residential Treatment': 'Medical Respite / Shelter / Residential Treatment',
  'Severe Mental Illness Group Home': 'Medical Respite / Shelter / Residential Treatment',
  'Assisted Living': 'Subacute Facility',
  'Addiction Outpatient Treatment': 'Outpatient Services',
  'Primary Care': 'Outpatient Services',
};

const TYPE_PRIORITY = [
  'Skilled Nursing Facility (SNF)',
  'Long-Term Acute Care (LTACH)',
  'Acute Rehabilitation Unit (ARU)',
  'Home Health',
  'Hospice — Home',
  'Home Infusion / Enteral Feeding',
  'Outpatient Infusion',
  'Dialysis — In-Center',
  'Durable Medical Equipment (DME)',
  'Transportation',
  'Medical Respite / Shelter / Residential Treatment',
  'Subacute Facility',
  'Outpatient Services',
];

function inferVendorType(servicesStr) {
  if (!servicesStr) return 'Other';
  const found = new Set(
    servicesStr.split('\n').map(s => s.trim()).filter(Boolean)
      .map(s => SERVICE_TO_VENDOR_TYPE[s]).filter(Boolean)
  );
  for (const p of TYPE_PRIORITY) if (found.has(p)) return p;
  return found.size > 0 ? [...found][0] : 'Other';
}

function parseCoverageCounties(str) {
  if (!str) return [];
  const counties = [];
  for (const m of str.matchAll(/([A-Za-z\s]+),\s*CA/g)) {
    const c = m[1].trim();
    if (c && c.length < 30) counties.push(c);
  }
  return [...new Set(counties)];
}

function parseState(s) {
  return s === 'California' ? 'CA' : (s?.slice(0, 2).toUpperCase() || 'CA');
}

// ── Parse workbook ───────────────────────────────────────────────────────────

console.log('Reading:', INPUT);
const buf = readFileSync(INPUT);
const wb  = read(buf, { type: 'buffer' });

// Find the sheet that has 'Vendor ID' as a header
let targetSheet = null, headerRowIdx = -1;
for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
  if (!sheet['!ref']) continue;
  const rows = utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const idx = rows.findIndex(r => Array.isArray(r) && r.some(c => String(c).trim() === 'Vendor ID'));
  if (idx !== -1) { targetSheet = sheet; headerRowIdx = idx; break; }
}

if (!targetSheet) { console.error('Could not find Vendor ID header'); process.exit(1); }

const rows    = utils.sheet_to_json(targetSheet, { header: 1, defval: '' });
const headers = rows[headerRowIdx].map(h => String(h).trim());
console.log(`Headers found at row ${headerRowIdx}. Total rows: ${rows.length - headerRowIdx - 1}`);

// ── Map rows to vendor records ───────────────────────────────────────────────

const vendors = [];
for (let i = headerRowIdx + 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row || row.every(c => !c)) continue;

  const r = {};
  headers.forEach((h, idx) => { if (h) r[h] = String(row[idx] ?? ''); });
  if (!r['Vendor ID']) continue;

  const facilityCounty = r['County'] || '';
  const coverageCounties = parseCoverageCounties(r['Service Provider Coverage Areas']);
  const coverageAreas = coverageCounties.length > 0 ? coverageCounties : (facilityCounty ? [facilityCounty] : []);
  const services = r['Continued Care Services Provided']
    ? r['Continued Care Services Provided'].split('\n').map(s => s.trim()).filter(Boolean)
    : [];

  const vendorType = inferVendorType(r['Continued Care Services Provided']);
  const isUncategorized = vendorType === 'Other';

  vendors.push({
    id: `CP-${r['Vendor ID']}`,
    careportId: r['Vendor ID'],
    name: r['Name'].replace(/ - CCM$/, '').trim(),
    displayName: r['External Name'].trim(),
    abbreviation: r['Abbreviation'].trim(),
    vendorType,
    services,
    address: r['Street Addr'] || '',
    city: r['City'] || '',
    county: facilityCounty,
    zip: r['ZIP Code'] || '',
    state: parseState(r['State']),
    phone: r['Phone'] || '',
    fax: r['Fax'] || '',
    website: r['Service Provider Website'] || '',
    coverageAreas,
    admissionsContacts: [],
    escalationContacts: [],
    clinicalTags: [],
    vendorTags: [],
    dataSource: 'Careport',
    lastReviewed: '',
    reviewingSite: '',
    status: 'Active',
    notes: r['Facility Additional Contact Info']
      ? `Careport contact info: ${r['Facility Additional Contact Info']}`
      : '',
    pendingReview: isUncategorized,
    hidden: isUncategorized,
    conflictNote: isUncategorized
      ? 'Vendor type could not be determined from Careport services — assign a type to make this record visible in search.'
      : undefined,
    synonyms: r['Synonyms'] ? r['Synonyms'].split(/[,;]/).map(s => s.trim()).filter(Boolean) : [],
    rawServiceArea: r['Service Area RECORD NAME'] || '',
  });
}

writeFileSync(OUTPUT, JSON.stringify(vendors, null, 0));
console.log(`✓ Wrote ${vendors.length} vendors to ${OUTPUT}`);
