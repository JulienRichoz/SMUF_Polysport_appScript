/**
 * ============================================================================
 * POLYSPORT 2026 - BACKEND SCRIPT
 * System API logic to connect Google Sheets data with the frontend web apps.
 * ============================================================================
 */

const ADMIN_TOKEN = "PolySportGames2026"; 
const BACKEND_PIN = "2526";               

/**
 * FUNCTION: doGet
 * Entry point for Google Apps Script Web Apps.
 * Renders the Staff (Admin) page if correct token is provided in the URL parameters.
 * Otherwise, falls back to rendering the public-facing 'index' app.
 */
function doGet(e) {
  if (e.parameter.page === 'admin' && e.parameter.token === ADMIN_TOKEN) {
    return HtmlService.createTemplateFromFile('admin')
      .evaluate()
      .setTitle('Staff - Polysport')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Planning Polysport')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * FUNCTION: verifyStaffPin
 * Simple authenticator for the Staff Dashboard.
 * @param {string} inputPin - PIN provided by the user in frontend.
 * @returns {boolean} Validity of the PIN.
 */
function verifyStaffPin(inputPin) {
  return inputPin === BACKEND_PIN;
}

/**
 * ============================================================================
 * API : APPLICATION PUBLIQUE
 * ============================================================================
 */

/**
 * FUNCTION: getInitialAppData
 * Gathers essential data for the public-facing user application.
 * Collects general timeline, date, alert messages, teams list, and matches from sheets.
 * @returns {Object} Clean payload of public data for the frontend.
 */
function getInitialAppData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheetGen = ss.getSheetByName('PLANNING_GENERAL');
  const dataGen = sheetGen.getDataRange().getDisplayValues();
  
  const rawDate = sheetGen.getRange("B2").getValue(); 
  let tournamentDate = (rawDate instanceof Date) ? rawDate.toISOString() : rawDate;

  let timeline = [];
  let afterMessage = "";

  // Iterate over general schedule to build timeline
  for (let i = 1; i < dataGen.length; i++) {
    const act = dataGen[i][0];
    if (!act) continue;
    if (act.toLowerCase().includes("date")) continue; 
    
    // Extract live info/alert separately
    if (act.toLowerCase().includes("info") || act.toLowerCase().includes("live")) {
      afterMessage = dataGen[i][2];
      continue;
    }
    
    timeline.push({ 
      label: act, 
      time: formatToFrenchTime(dataGen[i][1]), 
      details: dataGen[i][2] 
    });
  }

  // Fetch final matches grid
  const sheetMatches = ss.getSheetByName('AFFICHAGE_FINAL');
  const matchData = sheetMatches.getDataRange().getDisplayValues();
  const appUrl = ScriptApp.getService().getUrl();

  // Fetch team names list
  const sheetTeams = ss.getSheetByName('REF_Equipes');
  const teams = sheetTeams.getRange("B2:B150").getValues().flat().filter(String).sort();

  return { timeline, afterMessage, tournamentDate, matchData, teams, appUrl };
}

/**
 * ============================================================================
 * API : APPLICATION STAFF (ADMIN)
 * ============================================================================
 */

/**
 * FUNCTION: getInitialAdminData
 * Gathers comprehensive data required for the Staff Dashboard.
 * Checks PIN security, then fetches teams info (including contacts/stats), 
 * staff duties, schedules, and global timeline.
 * @param {string} pin - Server-side revalidation of security PIN.
 * @returns {Object} Massive structured payload of teams, staff, and matches.
 */
function getInitialAdminData(pin) {
  if (pin !== BACKEND_PIN) {
    throw new Error("Accès refusé : PIN invalide ou manquant.");
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Extract Tournament General info
  const sheetGen = ss.getSheetByName('PLANNING_GENERAL');
  const dataGen = sheetGen.getDataRange().getDisplayValues();
  
  const rawDate = sheetGen.getRange("B2").getValue(); 
  const tournamentDate = (rawDate instanceof Date) ? rawDate.toISOString() : rawDate;
  
  let afterMessage = "";

  for (let i = 1; i < dataGen.length; i++) {
    const act = dataGen[i][0];
    if (!act) continue;
    if (act.toLowerCase().includes("date")) continue;
    
    if (act.toLowerCase().includes("info") || act.toLowerCase().includes("live")) {
      afterMessage = dataGen[i][2];
      continue;
    }
  }

  // Fetch specific Teams metadata (Contacts, stats, roster)
  const sheetTeams = ss.getSheetByName('REF_Equipes');
  const teamData = sheetTeams.getDataRange().getValues();
  let teamMap = {};
  
  for (let i = 1; i < teamData.length; i++) {
    const name = teamData[i][1];
    if (!name) continue;
    
    teamMap[name.toLowerCase()] = {
      nom: name, capitaine: teamData[i][2], phone: teamData[i][3], email: teamData[i][4],
      participants: [
        teamData[i][5], teamData[i][6], teamData[i][7], teamData[i][8], teamData[i][9], teamData[i][10], teamData[i][11]
      ].filter(String),
      stats: { femmes: teamData[i][12], hommes: teamData[i][13] }
    };
  }

  // Fetch match schedule grid
  const sheetMatches = ss.getSheetByName('AFFICHAGE_FINAL');
  const matchData = sheetMatches.getDataRange().getDisplayValues();
  const appUrl = ScriptApp.getService().getUrl();

  // --- STAFF & VOLUNTEER EXTRACTION ---
  let staffMap = {};
  let staffShift1Header = "18h00 - 20h30";
  let staffShift2Header = "20h30 - 23h00";
  let globalMep = "17h30";
  let globalRangement = "23h00";
  let globalAfter = "23h30";

  const sheetStaff = ss.getSheetByName('REF_Benevoles');
  
  if (sheetStaff) {
    const staffData = sheetStaff.getDataRange().getDisplayValues();
    
    // Extract Shift Headers dynamically (Row 1)
    if(staffData.length > 0) {
       staffShift1Header = staffData[0][5] || staffShift1Header;
       staffShift2Header = staffData[0][6] || staffShift2Header;
    }
    
    // Extract Global Timings (Row 2, from specific columns)
    if(staffData.length > 1 && staffData[1]) {
       globalMep = staffData[1][7] ? formatToFrenchTime(staffData[1][7]) : globalMep;
       globalRangement = staffData[1][8] ? formatToFrenchTime(staffData[1][8]) : globalRangement;
       globalAfter = staffData[1][9] ? formatToFrenchTime(staffData[1][9]) : globalAfter;
    }

    // Build map for each individual staff member
    for (let i = 1; i < staffData.length; i++) {
      const name = staffData[i][1]; 
      if (!name) continue;
      
      staffMap[name.toLowerCase()] = {
        nom: name,
        groupe: staffData[i][2],     
        posteFixe: staffData[i][3],  
        terrains: staffData[i][4],   
        shift1: staffData[i][5],     
        shift2: staffData[i][6]     
      };
    }
  }

  // --- BUILD ADMIN TIMELINE (Based on dynamic parameters) ---
  let adminTimeline = [
      { time: globalMep, label: "Mise en place", details: "Préparation et accueil du staff" },
      { time: staffShift1Header, label: "Shift 1", details: "Première vague d'activités" },
      { time: staffShift2Header, label: "Shift 2", details: "Deuxième vague d'activités" },
      { time: globalRangement, label: "Rangement", details: "Nettoyage et clôture des terrains" },
      { time: globalAfter, label: "After", details: "Moment de détente bien mérité" }
  ];

  return { teamMap, matchData, tournamentDate, appUrl, adminTimeline, afterMessage, staffMap, staffShift1Header, staffShift2Header, globalMep, globalRangement, globalAfter };
}

/**
 * ============================================================================
 * UTILITAIRES / UTILITIES
 * ============================================================================
 */

/**
 * FUNCTION: formatToFrenchTime
 * Cleans up raw times into a standard "XXhXX" formatting for better UI presentation.
 * @param {string} timeInput - Raw time string from sheet.
 * @returns {string} Formatted french time.
 */
function formatToFrenchTime(timeInput) {
  if (!timeInput) return "";
  const parts = timeInput.toString().split('-');
  const formatted = parts.map(p => {
    const t = p.trim().split(':');
    return t.length >= 2 ? `${t[0].padStart(2, '0')}h${t[1].padStart(2, '0')}` : p.trim();
  });
  return formatted.join(' - ');
}
