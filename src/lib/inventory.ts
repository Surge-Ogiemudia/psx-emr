/**
 * TODO: replace with a live query against the pharmacy's own POS inventory
 * (PRD Section 6, Exit C: "Staff searches the pharmacy's own inventory
 * pulled from the POS database"). Stubbed here so the Treat/Diagnostics
 * screens are clickable end to end without a POS integration in place yet.
 */
export const MOCK_INVENTORY = [
  { name: "Paracetamol 500mg", defaultDose: "2 tabs x 3 daily x 3 days" },
  { name: "Amoxicillin 500mg", defaultDose: "1 cap x 3 daily x 5 days" },
  { name: "Loratadine 10mg", defaultDose: "1 tab daily x 5 days" },
  { name: "Erythromycin Eye Drops", defaultDose: "1 drop each eye x 4 daily x 5 days" },
  { name: "Oral Rehydration Salts", defaultDose: "1 sachet in 1L water x 3 daily" },
  { name: "Ibuprofen 400mg", defaultDose: "1 tab x 3 daily after food x 3 days" },
  { name: "Artemether/Lumefantrine 20/120mg", defaultDose: "4 tabs twice daily x 3 days" },
  { name: "Cetirizine 10mg", defaultDose: "1 tab daily x 5 days" },
];

export const MOCK_DIAGNOSTIC_TESTS = [
  "Malaria RDT",
  "Full Blood Count",
  "Blood Sugar",
  "Urinalysis",
  "Chest X-ray",
  "Widal Test",
  "HIV Screen",
  "Pregnancy Test",
];
