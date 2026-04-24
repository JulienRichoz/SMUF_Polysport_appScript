/**
 * ============================================================================
 * POLYSPORT 2026 - BACKEND SCRIPT
 * ============================================================================
 * Gestion centralisée des données pour les vues Publique et Staff.
 * Stratégie : Chargement unique des données pour optimiser les performances.
 */

const ADMIN_TOKEN = "PolySportGames2026"; // Clé secrète d'accès à l'URL Admin
const BACKEND_PIN = "2526";               // Code de déverrouillage de la page

/**
 * Point d'entrée de l'application Web.
 * Route l'utilisateur vers la page Admin ou Publique selon l'URL.
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
 * Vérifie le code PIN du Staff côté serveur.
 * @param {string} inputPin - Le code PIN saisi par l'utilisateur.
 * @returns {boolean} True si le PIN est correct.
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
 * Charge toutes les données nécessaires pour l'application Publique en un seul appel.
 * @returns {Object} Objet contenant la timeline, la date, les matchs et les équipes.
 */
function getInitialAppData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Récupération du Planning Général
  const sheetGen = ss.getSheetByName('PLANNING_GENERAL');
  const dataGen = sheetGen.getDataRange().getDisplayValues();
  let timeline = [];
  let afterMessage = "";
  let tournamentDate = "";

  for (let i = 1; i < dataGen.length; i++) {
    const act = dataGen[i][0];
    if (!act) continue;
    
    if (act.toLowerCase().includes("date")) { 
      tournamentDate = dataGen[i][1]; 
      continue; 
    }
    if (act.toLowerCase().includes("info") || act.toLowerCase().includes("after")) {
      afterMessage = dataGen[i][2];
    }
    
    timeline.push({ 
      label: act, 
      time: formatToFrenchTime(dataGen[i][1]), 
      details: dataGen[i][2] 
    });
  }

  // 2. Récupération de tous les Matchs (pour filtrage local rapide)
  const sheetMatches = ss.getSheetByName('AFFICHAGE_FINAL');
  const matchData = sheetMatches.getDataRange().getDisplayValues();

  // 3. Récupération de toutes les Equipes
  const sheetTeams = ss.getSheetByName('REF_Equipes');
  const teams = sheetTeams.getRange("B2:B150").getValues().flat().filter(String).sort();

  return { timeline, afterMessage, tournamentDate, matchData, teams };
}

/**
 * ============================================================================
 * API : APPLICATION STAFF (ADMIN)
 * ============================================================================
 */

/**
 * Charge toutes les données détaillées pour le Staff en un seul appel.
 * @returns {Object} Objet contenant le dictionnaire des équipes et la matrice des matchs.
 */
/**
 * API : APPLICATION STAFF (ADMIN)
 */
function getInitialAdminData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // --- NOUVEAU : Récupération de la date du tournoi pour l'admin ---
  const sheetGen = ss.getSheetByName('PLANNING_GENERAL');
  const rawDate = sheetGen.getRange("B2").getValue(); 
  // On transforme la date en texte ISO (format universel) pour éviter les inversions jour/mois
  const tournamentDate = (rawDate instanceof Date) ? rawDate.toISOString() : rawDate;

  // 1. Création du dictionnaire des équipes
  const sheetTeams = ss.getSheetByName('REF_Equipes');
  const teamData = sheetTeams.getDataRange().getValues();
  let teamMap = {};
  
  for (let i = 1; i < teamData.length; i++) {
    const name = teamData[i][1];
    if (!name) continue;
    
    teamMap[name.toLowerCase()] = {
      nom: name, 
      capitaine: teamData[i][2], 
      phone: teamData[i][3], 
      email: teamData[i][4],
      participants: [
        teamData[i][5], teamData[i][6], teamData[i][7], 
        teamData[i][8], teamData[i][9], teamData[i][10], teamData[i][11]
      ].filter(String),
      stats: { femmes: teamData[i][12], hommes: teamData[i][13] }
    };
  }

  // 2. Récupération de la grille des matchs
  const sheetMatches = ss.getSheetByName('AFFICHAGE_FINAL');
  const matchData = sheetMatches.getDataRange().getDisplayValues();

  // On renvoie bien TOUT, y compris la date
  return { teamMap, matchData, tournamentDate };
}

/**
 * ============================================================================
 * UTILITAIRES
 * ============================================================================
 */

/**
 * Formate une heure ou une plage horaire brute en format français (ex: 14h30 - 15h00).
 * @param {string} timeInput - L'heure brute (ex: "14:30:00 - 15:00:00").
 * @returns {string} L'heure formatée.
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
