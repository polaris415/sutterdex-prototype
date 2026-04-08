/**
 * Maps Careport export rows to ContactDex vendor records.
 * Fields are mapped per PRD Section 4.3.
 */

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

function inferVendorType(servicesStr) {
  if (!servicesStr) return 'Other';
  const services = servicesStr.split('\n').map(s => s.trim()).filter(Boolean);
  // Priority order: more specific types first
  const priority = [
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
  const found = new Set();
  for (const svc of services) {
    const mapped = SERVICE_TO_VENDOR_TYPE[svc];
    if (mapped) found.add(mapped);
  }
  for (const p of priority) {
    if (found.has(p)) return p;
  }
  if (found.size > 0) return [...found][0];
  return 'Other';
}

function parseState(stateStr) {
  const map = { 'California': 'CA', 'CA': 'CA' };
  return map[stateStr] || stateStr?.slice(0, 2).toUpperCase() || 'CA';
}

function parseServices(servicesStr) {
  if (!servicesStr) return [];
  return servicesStr.split('\n').map(s => s.trim()).filter(Boolean);
}

function parseCoverageCounties(coverageStr) {
  if (!coverageStr) return [];
  // Extract county names from "Counties: Sacramento, CA; Placer, CA; ..."
  const counties = [];
  const matches = coverageStr.matchAll(/([A-Za-z\s]+),\s*CA/g);
  for (const m of matches) {
    const county = m[1].trim();
    if (county && county.length < 30) counties.push(county);
  }
  return [...new Set(counties)];
}

let importIdCounter = 10000;

export function mapCareportRow(row) {
  const services = parseServices(row['Continued Care Services Provided']);
  const vendorType = inferVendorType(row['Continued Care Services Provided']);
  const facilityCounty = row['County'] || '';

  // Coverage counties: use Careport's coverage area list; fall back to facility county if blank
  const coverageCounties = parseCoverageCounties(row['Service Provider Coverage Areas']);
  const coverageAreas = coverageCounties.length > 0 ? coverageCounties : (facilityCounty ? [facilityCounty] : []);

  const isUncategorized = vendorType === 'Other';

  return {
    id: `CP-${row['Vendor ID'] || ++importIdCounter}`,
    careportId: row['Vendor ID'] || '',
    name: (row['Name'] || '').replace(/ - CCM$/, '').trim(),
    displayName: (row['External Name'] || '').trim(),
    abbreviation: (row['Abbreviation'] || '').trim(),
    vendorType,
    services,
    address: row['Street Addr'] || '',
    city: row['City'] || '',
    county: facilityCounty,
    zip: row['ZIP Code'] || '',
    state: parseState(row['State']),
    phone: row['Phone'] || '',
    fax: row['Fax'] || '',
    website: row['Service Provider Website'] || '',
    coverageAreas,
    admissionsContacts: [],
    escalationContacts: [],
    clinicalTags: [],
    vendorTags: [],
    dataSource: 'Careport',
    lastReviewed: '',
    reviewingSite: '',
    status: 'Active',
    notes: row['Facility Additional Contact Info']
      ? `Careport contact info: ${row['Facility Additional Contact Info']}`
      : '',
    pendingReview: isUncategorized,
    hidden: isUncategorized,
    conflictNote: isUncategorized
      ? 'Vendor type could not be determined from Careport services — assign a type to make this record visible in search.'
      : undefined,
    rawServiceArea: row['Service Area RECORD NAME'] || '',
    synonyms: row['Synonyms'] ? row['Synonyms'].split(/[,;]/).map(s => s.trim()).filter(Boolean) : [],
  };
}

export function parseCareportWorkbook(workbook, XLSX) {
  console.log('[Careport] SheetNames:', workbook.SheetNames);

  let targetSheet = null;
  let headerRowIdx = -1;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet['!ref']) { console.log(`[Careport] Sheet "${sheetName}": no !ref, skipping`); continue; }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log(`[Careport] Sheet "${sheetName}": ${rows.length} rows`);
    console.log(`[Careport]   row[0] sample:`, rows[0]?.slice(0, 5));
    console.log(`[Careport]   row[1] sample:`, rows[1]?.slice(0, 5));
    console.log(`[Careport]   row[2] sample:`, rows[2]?.slice(0, 5));

    // Scan first 5 rows for one containing 'Vendor ID'
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const row = rows[i];
      if (!Array.isArray(row)) continue;
      const found = row.findIndex(cell => String(cell).trim() === 'Vendor ID');
      if (found !== -1) {
        console.log(`[Careport] Found header row at index ${i} in sheet "${sheetName}"`);
        targetSheet = sheet;
        headerRowIdx = i;
        break;
      }
    }
    if (targetSheet) break;
  }

  if (!targetSheet) {
    console.error('[Careport] Could not find a sheet with "Vendor ID" header in first 5 rows');
    return [];
  }

  const rows = XLSX.utils.sheet_to_json(targetSheet, { header: 1, defval: '' });
  const headers = rows[headerRowIdx];
  console.log('[Careport] Headers:', headers);

  const records = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    // Skip rows that are completely empty
    if (!row || row.every(cell => !cell)) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      if (h) obj[String(h).trim()] = String(row[idx] ?? '');
    });
    if (obj['Vendor ID']) {
      records.push(mapCareportRow(obj));
    }
  }
  console.log(`[Careport] Parsed ${records.length} records`);
  return records;
}
