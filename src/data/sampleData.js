export const VENDOR_TYPES = [
  'Skilled Nursing Facility (SNF)',
  'Home Health',
  'Hospice — Home',
  'Durable Medical Equipment (DME)',
  'Home Infusion / Enteral Feeding',
  'Outpatient Infusion',
  'Dialysis — In-Center',
  'Long-Term Acute Care (LTACH)',
  'Acute Rehabilitation Unit (ARU)',
  'Subacute Facility',
  'Insurance / HMO / IPA',
  'Placement Specialists',
  'Medical Respite / Shelter / Residential Treatment',
  'VA',
  'Transportation',
  'Outpatient Services',
];

// Clinical capability tags — what the vendor can clinically do/handle
export const CLINICAL_TAGS = [
  'Accepts Clinically Complex',
  'Accepts Managed Medi-Cal',
  'Bariatric >350#',
  'Bent metal DME',
  'Bridge PCP',
  'Charity vendor',
  'Congregate Living Facility',
  'Custom DME',
  'Delayed Egress',
  'Frequent IVs',
  'Gurney capable',
  'Memory Care',
  'Methadone support',
  'On-site dialysis',
  'Palliative Care Transitions',
  'Psychiatric Unit',
  'Respiratory Services',
  'Short Term Only',
  'WCV capable',
  'Wound Vac capable',
];

// Vendor relationship / contract tags
export const VENDOR_TAGS = [
  'Preferred Provider',
  'SCAH preferred',
  'SCAH Hospice Contracted',
  'SMD (Sutter Medicare Direct)',
  'Sutter-contracted Vendor',
  'High Volume Vendor',
  'SIPS Partner',
];

export const CONTACT_TYPES = [
  'Admissions Director',
  'Admissions Coordinator',
  'Admissions Administrator',
  'Case Manager',
  'Social Worker',
  'Discharge Coordinator',
  'DON (Director of Nursing)',
  'Administrator',
  'Regional Director',
  'Clinical Director',
  'Medical Director',
  'Billing',
  'Other',
];

export const COUNTIES = [
  'Alameda', 'Alpine', 'Amador', 'Butte', 'Calaveras', 'Colusa',
  'Contra Costa', 'Del Norte', 'El Dorado', 'Fresno', 'Glenn',
  'Humboldt', 'Imperial', 'Inyo', 'Kern', 'Kings', 'Lake', 'Lassen',
  'Los Angeles', 'Madera', 'Marin', 'Mariposa', 'Mendocino', 'Merced',
  'Modoc', 'Mono', 'Monterey', 'Napa', 'Nevada', 'Orange', 'Placer',
  'Plumas', 'Riverside', 'Sacramento', 'San Benito', 'San Bernardino',
  'San Diego', 'San Francisco', 'San Joaquin', 'San Luis Obispo',
  'San Mateo', 'Santa Barbara', 'Santa Clara', 'Santa Cruz', 'Shasta',
  'Sierra', 'Siskiyou', 'Solano', 'Sonoma', 'Stanislaus', 'Sutter',
  'Tehama', 'Trinity', 'Tulare', 'Tuolumne', 'Ventura', 'Yolo', 'Yuba',
];

export const SERVICE_AREAS = [
  'Sacramento Valley', 'East Bay', 'Bay Area', 'North Bay',
  'Central Valley', 'Gold Hill / Foothills',
];

export const HOSPITALS = [
  'Sutter Medical Center Sacramento',
  'Sutter Roseville Medical Center',
  'Sutter Auburn Faith Hospital',
  'Alta Bates Summit Medical Center',
  'Sutter Delta Medical Center',
  'Eden Medical Center',
  'Mills-Peninsula Medical Center',
  'Novato Community Hospital',
  'California Pacific Medical Center',
];

// Corporate groups organized by vendor type
export const CORPORATE_GROUPS_BY_TYPE = {
  'Skilled Nursing Facility (SNF)': [
    'Brookdale Senior Living', 'Covenant Care', 'Ensign Group',
    'Genesis Healthcare', 'HCR ManorCare', 'Kindred / ScionHealth',
    'Mariner Health', 'SavaSeniorCare', 'Sunrise Senior Living',
  ],
  'Dialysis — In-Center': [
    'DaVita', 'Fresenius Medical Care', 'Satellite Healthcare', 'US Renal Care',
  ],
  'Home Health': [
    'Amedisys', 'Almost Family', 'Kindred at Home', 'LHC Group',
  ],
  'Hospice — Home': [
    'Amedisys', 'Compassus', 'Optum Palliative', 'VITAS Healthcare',
  ],
};

// Flat unique list for filtering (all corporate groups combined)
export const CORPORATE_GROUPS = [...new Set(Object.values(CORPORATE_GROUPS_BY_TYPE).flat())].sort();

export const initialVendors = [];
export const REVIEW_CYCLES = [];
export const PENDING_SUBMISSIONS = [];
export const SITE_POCS = [];
