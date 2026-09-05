/**
 * Locality master seed — the full 57-area Vizag_Areas_Master sheet from the
 * user-supplied master workbook, plus a small gap-fill set of localities
 * confirmed real by their appearance elsewhere in this project's own prior
 * seed/demo data or in Provider_Master's actual locality strings but absent
 * from Vizag_Areas_Master itself. See docs/nearby-data-master-plan.md §4 for
 * the cross-sheet comparison this list is based on. `normalizedName` is
 * computed at seed time (lowercase, alphanumeric-only), not stored here.
 *
 * `aliases` records known spelling/format variants seen in source data
 * (Provider_Master, the pre-existing frontend VIZAG_LOCALITIES list) so a
 * future import resolver can match them without a fuzzy pass.
 */
const WORKBOOK_AREAS = [
    // From Vizag_Areas_Master (57 rows, area IDs VZG-001..VZG-057).
    'Achutapuram', 'Aganampudi', 'Akkayyapalem', 'Anakapalle', 'Anandapuram',
    'Arilova', 'Asilmetta', 'Bakkannapalem', 'Bheemili', 'Boyapalem',
    'Chinamushiwada', 'Chinna Waltair', 'Daba Gardens', 'Dondaparthy', 'Duvvada',
    'Dwaraka Nagar', 'Gajuwaka', 'Gopalapatnam', 'Hanumanthuwaka', 'Isukathota',
    'Jagadamba Junction', 'Kancharapalem', 'Kapuluppada', 'Kommadi', 'Krishna Nagar',
    'Kurmannapalem', 'Lankelapalem', 'Lawsons Bay Colony', 'Madhavadhara', 'Maddilapalem',
    'Madhurawada', 'Maharani Peta', 'Malkapuram', 'Marikavalasa', 'Marripalem',
    'MVP Colony', 'NAD Junction', 'New Gajuwaka', 'Old Gajuwaka', 'Pendurthi',
    'Pedagantyada', 'Pedda Waltair', 'PM Palem', 'Ramnagar', 'Rushikonda',
    'Scindia', 'Seethammadhara', 'Seethammapeta', 'Sheelanagar', 'Simhachalam',
    'Siripuram', 'Sujatha Nagar', 'Tagarapuvalasa', 'Vepagunta', 'Visalakshi Nagar',
    'Waltair', 'Yendada',
];

const ALIASES = {
    'Ramnagar': ['Ram Nagar'],
    'Chinna Waltair': ['China Waltair'],
    'Seethammadhara': ['Sheethammadhara'],
    'PM Palem': ['P M Palem'],
    'Pedda Waltair': ['Pedawaltair'],
    'Jagadamba Junction': ['Jagadamba Centre'],
    'Lawsons Bay Colony': ['Lawsons Bay'],
    'Anakapalle': ['Anakapalli'],
    'Chinamushiwada': ['China Mushidiwada', 'Chinamushidiwada'],
    'Lankelapalem': ['Lankalapalem'],
    'Sheelanagar': ['Sheela Nagar'],
    'NAD Junction': ['NAD Kotha Road Junction'],
};

// Confirmed-real gap-fill: present in Provider_Master's own locality strings
// or in this codebase's pre-existing Vizag locality lists, but not in
// Vizag_Areas_Master itself.
const GAP_FILL = [
    { name: 'Balaji Hill' },
    { name: 'Old Dairy Farm' },
    { name: 'NAD Kotha Road' },
    { name: 'Muralinagar' },
    { name: 'Ukkunagaram' },
    // Wider Visakhapatnam-district / tourist-route places — kept out of the
    // default city locality picker via region: 'district_wide'.
    { name: 'Kothavalasa', region: 'district_wide' },
    { name: 'Araku Valley', region: 'district_wide' },
];

const entries = WORKBOOK_AREAS.map((name) => ({
    name,
    region: 'city',
    aliases: ALIASES[name] || [],
}));
for (const g of GAP_FILL) {
    entries.push({ name: g.name, region: g.region || 'city', aliases: [] });
}
// Catch-all, matching the old enum's 'Other' default.
entries.push({ name: 'Other', region: 'city', aliases: [] });

module.exports = entries;
