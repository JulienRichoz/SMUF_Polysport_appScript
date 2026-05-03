/**
 * ============================================================================
 * POLYSPORT 2026 - BACKEND SCRIPT
 * ============================================================================
 */

const ADMIN_TOKEN = "PolySportGames2026"; 
const BACKEND_PIN = "2526";               

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

function verifyStaffPin(inputPin) {
  return inputPin === BACKEND_PIN;
}

/**
 * ============================================================================
 * API : APPLICATION PUBLIQUE
 * ============================================================================
 */
function getInitialAppData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheetGen = ss.getSheetByName('PLANNING_GENERAL');
  const dataGen = sheetGen.getDataRange().getDisplayValues();
  
  const rawDate = sheetGen.getRange("B2").getValue(); 
  let tournamentDate = (rawDate instanceof Date) ? rawDate.toISOString() : rawDate;

  let timeline = [];
  let afterMessage = "";

  for (let i = 1; i < dataGen.length; i++) {
    const act = dataGen[i][0];
    if (!act) continue;
    if (act.toLowerCase().includes("date")) continue; 
    
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

  const sheetMatches = ss.getSheetByName('AFFICHAGE_FINAL');
  const matchData = sheetMatches.getDataRange().getDisplayValues();
  const appUrl = ScriptApp.getService().getUrl();

  const sheetTeams = ss.getSheetByName('REF_Equipes');
  const teams = sheetTeams.getRange("B2:B150").getValues().flat().filter(String).sort();

  return { timeline, afterMessage, tournamentDate, matchData, teams, appUrl };
}

/**
 * ============================================================================
 * API : APPLICATION STAFF (ADMIN)
 * ============================================================================
 */
function getInitialAdminData(pin) {
  if (pin !== BACKEND_PIN) {
    throw new Error("Accès refusé : PIN invalide ou manquant.");
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
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

  const sheetMatches = ss.getSheetByName('AFFICHAGE_FINAL');
  const matchData = sheetMatches.getDataRange().getDisplayValues();
  const appUrl = ScriptApp.getService().getUrl();

  // --- RÉCUPÉRATION DES BÉNÉVOLES ET VARIABLES GLOBALES ---
  let staffMap = {};
  let staffShift1Header = "18h00 - 20h30";
  let staffShift2Header = "20h30 - 23h00";
  let globalMep = "17h30";
  let globalRangement = "23h00";
  let globalAfter = "23h30";

  const sheetStaff = ss.getSheetByName('REF_Benevoles');
  
  if (sheetStaff) {
    const staffData = sheetStaff.getDataRange().getDisplayValues();
    
    // Extraction des En-têtes des Shifts (Ligne 1)
    if(staffData.length > 0) {
       staffShift1Header = staffData[0][5] || staffShift1Header;
       staffShift2Header = staffData[0][6] || staffShift2Header;
    }
    
    // Extraction des Horaires Globaux (Depuis la ligne 2, index 1)
    if(staffData.length > 1 && staffData[1]) {
       globalMep = staffData[1][7] ? formatToFrenchTime(staffData[1][7]) : globalMep;
       globalRangement = staffData[1][8] ? formatToFrenchTime(staffData[1][8]) : globalRangement;
       globalAfter = staffData[1][9] ? formatToFrenchTime(staffData[1][9]) : globalAfter;
    }

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

  // --- CRÉATION DE LA TIMELINE SPÉCIFIQUE ADMIN (Basée sur REF_Benevoles) ---
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
 * UTILITAIRES
 * ============================================================================
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
