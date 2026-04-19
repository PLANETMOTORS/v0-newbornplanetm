/**
 * Drivee.ai 360° viewer configuration
 *
 * Drivee's iframe only supports the `mid` (media ID) parameter.
 * VIN-based lookup is NOT supported — the iframe ignores unknown params.
 *
 * This file contains ALL 100 vehicles photographed with Drivee as of 2026-04-15,
 * extracted directly from the Drivee admin dashboard (https://admin-bccd3.web.app).
 *
 * The DB-driven `drivee_mappings` table (PR #354) is the primary source of truth.
 * This static map serves as a fallback when the DB is unavailable (cold start, outage).
 */

export const DRIVEE_DEALER_UID = "AZYuEtjX9NUvWpqmUQcKyiGHbNg1"

/**
 * VIN → Drivee media ID mapping — complete Drivee dashboard extract.
 *
 * To add a new vehicle:
 *  1. Photograph it using the Drivee app on the lot
 *  2. Log into Drivee dashboard → My Projects → find vehicle → click "Copy Link"
 *  3. Extract the `mid=` parameter from the iframe URL and add below
 *
 * To bulk-lookup MIDs via API:
 *   curl -s "https://us-central1-pirelly360.cloudfunctions.net/iframe-searcher/v2/iframe-repo?vin=<VIN>&uid=AZYuEtjX9NUvWpqmUQcKyiGHbNg1"
 *
 * Vehicles WITHOUT an entry here (and not in drivee_mappings DB) will NOT show
 * the 360° button on the VDP.
 */
export const DRIVEE_VIN_MAP: Record<string, string> = {
  // ══════════════════════════════════════════════════════════════════════
  // CURRENT INVENTORY — verified against HomeNet feed 2026-04-15
  // ══════════════════════════════════════════════════════════════════════
  "1C4JJXP6XMW777356": "190171976531",  // 2021 Jeep Wrangler 4xe (shares shoot with MW777382)
  "1C4JJXP60MW777382": "190171976531",  // 2021 Jeep Wrangler 4xe — 36 frames
  "3GN7DSRR5SS127703": "744761075195",  // 2025 Chevrolet Equinox EV — 32 frames
  "LRW3E1EBXPC876367": "132601940353",  // 2023 Tesla Model 3 Long Range — 39 frames
  "3VV4X7B24PM371188": "806787519944",  // 2023 Volkswagen Taos — 35 frames
  "LRW3E7FAXRC093951": "890747363179",  // 2024 Tesla Model 3 — 39 frames
  "5YJ3E1EA7KF321382": "640326639530",  // 2019 Tesla Model 3 — 37 frames
  "5YJ3E1EC5NF234540": "061789806057",  // 2022 Tesla Model 3 Performance — 35 frames
  "3VV2B7AX2JM008723": "396425623701",  // 2018 Volkswagen Tiguan — 38 frames
  "KM8HC3A62SU023138": "625294835450",  // 2025 Hyundai Kona Electric — 37 frames
  "WA1GCCFS9JR009139": "085109772520",  // 2018 Audi Q3 — 37 frames
  "5YJ3E1EA9MF973939": "860125156862",  // 2021 Tesla Model 3 — 31 frames
  "5YJ3E1EA3MF848712": "181836743021",  // 2021 Tesla Model 3 — 32 frames (migrated to Supabase)

  // ══════════════════════════════════════════════════════════════════════
  // DRIVEE DASHBOARD — Pages 1-3 (newest, added Feb-Apr 2026)
  // ══════════════════════════════════════════════════════════════════════
  "1G1FW6S02P4105496": "414798419001",  // Stock PE54584025 — 34 frames
  "5YJ3E1EC6NF183078": "724429440483",  // Stock PE30784010 — 37 frames
  "1C4JJXP6XMW777325": "142280827416",  // Stock PM73254025 — 35 frames
  "7SAYGDEE7NF449780": "761707513348",  // Stock PE97803964 — 39 frames
  "3VWEX7BU2SM014182": "984697894001",  // Stock PM41823993 — 37 frames
  "KM8KRDAF0PU211108": "982824804899",  // Stock PE11084000 — 37 frames
  "LRW3E7FA8RC262591": "823914390403",  // Stock PE25913996 — 31 frames
  "LRW3E7EB8RC101362": "054019786170",  // Stock PE13623999 — 31 frames
  "5YJ3E1EAXPF507456": "020766487879",  // Stock PE74563998 — 27 frames
  "3VV3X7B28NM044429": "676160018628",  // Stock PE44293986 — 36 frames
  "7SAYGDEE6PF775914": "602380299940",  // Stock PE59143968 — 33 frames
  "7SAYGAEE0RF003216": "976732948951",  // Stock PE32163962 — 39 frames
  "5YJ3E1EA1PF481782": "831384555142",  // Stock PE17823951 — 39 frames
  "7SAYGDEE7SF296930": "485838797268",  // Stock PE69303957 — 39 frames

  // ══════════════════════════════════════════════════════════════════════
  // DRIVEE DASHBOARD — Pages 4-7 (Dec 2025 - Jan 2026)
  // ══════════════════════════════════════════════════════════════════════
  "LRWYGDFD2RC640445": "465839780093",  // Stock PE04453953
  "LRW3E7FA1RC263274": "296230445506",  // Stock PE82743956
  "7SAYGDEE3NF371580": "007773360335",  // Stock PE15803948
  "2GNAXWEV1N6109127": "699335548952",  // Stock PM91273941
  "KL4MMGSL5NB093755": "788958814518",  // Stock PM37553946
  "5YJYGDEE0LF033600": "567355500099",  // Stock PE36003940
  "1FMCU0G64LUC59241": "011238577499",  // Stock PM92413947
  "JN1BJ1CR3JW209319": "107152863922",  // Stock PM93193942
  "JTDBDMHE7R3014249": "224845516435",  // Stock PMH2493935
  "1C4JJXP68MW777372": "352383529563",  // Stock PE73723930
  "1C4JJXP64MW777272": "108582780272",  // Jeep Wrangler 4xe variant
  "WVGMV7AX6HK018683": "240582378853",  // Stock PM86833928
  "1C4JJXP69MW781432": "090928749053",  // Stock PM14322933
  "2HGFE1F96NH001603": "491346986254",  // Stock PM16033926
  "3GN7DLRP4SS193745": "833116098601",  // Stock PE37453911
  "5YJ3E1EA4LF642619": "728544806828",  // Stock PE26193923
  "KNDETCA2XP7396728": "023774245910",  // Stock PM67283920
  "LRWYGDFD2RC673543": "756794102121",  // Stock PE35433928
  "WAUEAAF43MA085514": "363944322014",  // Stock PM55143919
  "7SAYGAEE1RF068723": "750993204326",  // Stock PE87233913
  "5YJ3E1EA9NF311733": "430993001195",  // Stock PE17333917
  "3VV2B7AX8MM147985": "977778260326",  // Stock PM79853893
  "JTNKHMBXXM1107457": "258181207759",  // Stock PM74573916

  // ══════════════════════════════════════════════════════════════════════
  // DRIVEE DASHBOARD — Pages 7-10 (Sep-Nov 2025)
  // ══════════════════════════════════════════════════════════════════════
  "7SAYGDED8RF030351": "623843277241",  // Stock PE03513878
  "KNDCR3LE4S5295945": "206453293553",  // Stock PE59453909
  "5YJ3E1EA8LF786254": "516555359655",  // Stock PE62543906
  "2T3B1RFVXPC364382": "815138943882",  // Stock PM43823899
  "5YJ3E1EB3RF855255": "469273590085",  // Stock PE52553900
  "LRWYGDEE4RC640683": "513998192005",  // Stock PE06833902
  "5YJ3E1EB9LF670506": "135331986306",  // Stock PE05063891
  "5YJ3E1EB6KF414953": "633172770931",  // Stock PE49533822
  "5YJ3E1EB6NF270325": "828327929086",  // Stock PE03253905
  "YSMFD3KA4RL224281": "930805549708",  // Stock PE42813885
  "5YJYGDEE1MF195365": "357422065212",  // Stock PE53653886
  "LRWYGDFD2PC929581": "445281857794",  // Stock PE95813895
  "JF2SJHWCXJH487430": "058225990564",  // Stock PM74303906
  "5YJYGDEDXMF120557": "662308024089",  // Stock PE05573883
  "7SAYGDEE1SF287236": "885769949200",  // Stock PE72363890
  "5YJ3E1EB8SF874793": "654133879818",  // Stock PE47933896
  "7SAYGDEEXPF773745": "078227062505",  // Stock PE37453888
  "LRW3E7FA8RC101870": "866109897764",  // Stock PE18703871
  "5YJ3E1EA2NF340989": "455571857729",  // Stock PE09893880
  "KL4MMESL4PB093690": "142281753431",  // Stock PM36903884
  "5YJ3E1EA2LF715812": "167870359085",  // Stock PE58123881
  "5YJYGDEE7MF243466": "638578936706",  // Stock PE34663882

  // ══════════════════════════════════════════════════════════════════════
  // DRIVEE DASHBOARD — Pages 10-13 (earliest, Jun-Aug 2025)
  // ══════════════════════════════════════════════════════════════════════
  "KNDJ33A18N7026025": "744371665438",  // Stock PE60253875
  "5YJ3E1EA0MF048188": "293143211049",  // Stock PE81883816
  "LRWYGDEE9RC658984": "651305477723",  // Stock PE89843839
  "KNDJ33A12N7025940": "213850451076",  // Stock PE59404003
  "5YJ3E1EA2PF489941": "928238243874",  // Stock PE99413960
  "KNDJ33A14N7023185": "542981164906",  // Stock PE31853845
  "KNDJ23A27N7022950": "406559792012",  // Stock PE29503846
  "7SAYGDEF4NF543186": "682802154259",  // Stock PE31863870
  "7SAYGDEE0RF030823": "629594604842",  // Stock PE08233839
  "7SAYGDEF1NF469225": "267128416527",  // Stock PE92253818
  "YV4ED3GL4P2047586": "625866462318",  // Stock PE75863551
  "1FMCU9GD9JUC15056": "494372774190",  // Stock PM50583830
  "5YJ3E1EA3NF349877": "168050049088",  // Stock PE98773507
  "LRW3E7EB0RC088039": "041672030432",  // Stock PE80393810
  "5YJ3E1EA9PF573321": "441483891415",  // Stock PE33213812
  "5YJ3E1EA8PF403502": "992907790267",  // Stock PE17313617
  "5YJ3E1EB8PF416341": "015947405251",  // Stock PE63413625
  "5YJ3E1EB7SF882948": "388127397314",  // Stock PE29483838
  "7SAYGDEE2PF776106": "136624185554",  // Stock PE12243536
  "KNDCE3LGXN5137322": "062510346884",  // Stock PE73223560
  "5YJ3E1EA9PF572251": "614743939028",  // Stock PE22513556
  "1G1FY6S03P4204483": "385182950772",  // Stock PE44833808
  "3FMTK3SU5PMB10196": "916996291729",  // Stock PE01963540
  "3FMTK3S57PMA98366": "217226206089",  // Stock PE83663788
  "1G1FY6S01P4183844": "594709716143",  // Stock PM38443800
  "KM8KRDDF7RU316825": "472909248211",  // Stock PE68253610
  "WA1GUAFZ0SP016900": "207752498048",  // Stock PE69003630
  "LRW3E7FA5RC101731": "588632098564",  // Stock PE17313611
  "7SAYGDEE7PF661128": "499804677467",  // Stock PE11283622

  // ══════════════════════════════════════════════════════════════════════
  // LEGACY — known aliases / sold vehicles
  // ══════════════════════════════════════════════════════════════════════
  "1C4JXRN68MW508009": "190171976531",  // 2021 Jeep Wrangler 4xe (sold, same shoot)

  // ══════════════════════════════════════════════════════════════════════
  // NOT YET PHOTOGRAPHED — these 9 VINs are in inventory but have NO
  // Drivee entry. Searched all 13 dashboard pages + search box: NO RESULTS.
  // They need to be photographed with the Drivee app on the lot.
  // ══════════════════════════════════════════════════════════════════════
  // "LRW3E7EB6RC102901":  // 2024 Tesla Model 3 Long Range
  // "LRW3E7FA5RC089290":  // 2024 Tesla Model 3
  // "7SAYGDEE9PF600377":  // 2023 Tesla Model Y Long Range
  // "LRW3E1EB3PC943116":  // 2023 Tesla Model 3 Long Range
  // "7SAYGDEF1NF374938":  // 2022 Tesla Model Y Performance
  // "7SAYGAEE0NF323551":  // 2022 Tesla Model Y Long Range
  // "7SAYGAEE2NF381838":  // 2022 Tesla Model Y Long Range
  // "5YJSA1E64NF476477":  // 2022 Tesla Model S Plaid
  // "5YJYGDED2MF121136":  // 2021 Tesla Model Y Standard Range
}

/** Look up the Drivee media ID for a given VIN. Returns null if not found. */
export function getDriveeMid(vin: string | null | undefined): string | null {
  if (!vin) return null
  return DRIVEE_VIN_MAP[vin] ?? null
}
