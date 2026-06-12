import { useState, useEffect, useCallback, useRef } from "react";

const API_KEY = "f0df5fe54c4c5f63c8cb2ee1f3e58acb";
const API_BASE = "https://v3.football.api-sports.io";

// Mapping noms FR → noms API-Football (anglais)
// Utilisé pour matcher les fixtures de l'API avec nos noms français
const FR_TO_EN = {
  "Mexique":"Mexico","Afrique du Sud":"South Africa","Corée du Sud":"South Korea",
  "République tchèque":"Czech Republic","Canada":"Canada","Bosnie-Herzégovine":"Bosnia",
  "Qatar":"Qatar","Suisse":"Switzerland","Brésil":"Brazil","Maroc":"Morocco",
  "Haïti":"Haiti","Écosse":"Scotland","États-Unis":"United States","Paraguay":"Paraguay",
  "Australie":"Australia","Turquie":"Turkey","Allemagne":"Germany","Curaçao":"Curacao",
  "Côte d'Ivoire":"Ivory Coast","Équateur":"Ecuador","Pays-Bas":"Netherlands","Japon":"Japan",
  "Suède":"Sweden","Tunisie":"Tunisia","Belgique":"Belgium","Égypte":"Egypt","Iran":"Iran",
  "Nouvelle-Zélande":"New Zealand","Espagne":"Spain","Cap-Vert":"Cape Verde",
  "Arabie Saoudite":"Saudi Arabia","Uruguay":"Uruguay","France":"France","Sénégal":"Senegal",
  "Irak":"Iraq","Norvège":"Norway","Argentine":"Argentina","Algérie":"Algeria",
  "Autriche":"Austria","Jordanie":"Jordan","Portugal":"Portugal","RD Congo":"DR Congo",
  "Ouzbékistan":"Uzbekistan","Colombie":"Colombia","Angleterre":"England","Croatie":"Croatia",
  "Ghana":"Ghana","Panama":"Panama"
};

// Vérifie si un nom API correspond à un nom français
function matchTeam(apiName, frName) {
  const en = FR_TO_EN[frName] || frName;
  const api = apiName.toLowerCase();
  const enL = en.toLowerCase();
  const frL = frName.toLowerCase();
  // Correspondance exacte ou partielle
  if (api === enL || api === frL) return true;
  if (api.includes(enL.slice(0,5)) || enL.includes(api.slice(0,5))) return true;
  if (api.includes(frL.slice(0,5)) || frL.includes(api.slice(0,5))) return true;
  // Cas spéciaux
  if (frName === "États-Unis" && (api.includes("united states") || api.includes("usa"))) return true;
  if (frName === "Corée du Sud" && (api.includes("korea") || api.includes("south korea"))) return true;
  if (frName === "République tchèque" && (api.includes("czech") || api.includes("czechia"))) return true;
  if (frName === "Côte d'Ivoire" && (api.includes("ivory") || api.includes("cote"))) return true;
  if (frName === "Bosnie-Herzégovine" && api.includes("bosnia")) return true;
  if (frName === "Arabie Saoudite" && api.includes("saudi")) return true;
  if (frName === "RD Congo" && (api.includes("congo") || api.includes("dr congo"))) return true;
  if (frName === "Cap-Vert" && api.includes("cape verde")) return true;
  if (frName === "Nouvelle-Zélande" && api.includes("new zealand")) return true;
  if (frName === "Pays-Bas" && api.includes("netherlands")) return true;
  if (frName === "Afrique du Sud" && api.includes("south africa")) return true;
  if (frName === "Ouzbékistan" && api.includes("uzbek")) return true;
  return false;
}

// Mapping noms football-data.org (anglais) → noms français du site
const EN_TO_FR = {
  "Mexico":"Mexique","South Africa":"Afrique du Sud","Korea Republic":"Corée du Sud",
  "Czech Republic":"République tchèque","Czechia":"République tchèque",
  "Canada":"Canada","Bosnia and Herzegovina":"Bosnie-Herzégovine",
  "Qatar":"Qatar","Switzerland":"Suisse","Brazil":"Brésil","Morocco":"Maroc",
  "Haiti":"Haïti","Scotland":"Écosse","United States":"États-Unis","USA":"États-Unis",
  "Paraguay":"Paraguay","Australia":"Australie","Türkiye":"Turquie","Turkey":"Turquie",
  "Germany":"Allemagne","Curaçao":"Curaçao","Ivory Coast":"Côte d'Ivoire",
  "Ecuador":"Équateur","Netherlands":"Pays-Bas","Japan":"Japon","Sweden":"Suède",
  "Tunisia":"Tunisie","Belgium":"Belgique","Egypt":"Égypte","Iran":"Iran",
  "New Zealand":"Nouvelle-Zélande","Spain":"Espagne","Cape Verde":"Cap-Vert",
  "Saudi Arabia":"Arabie Saoudite","Uruguay":"Uruguay","France":"France",
  "Senegal":"Sénégal","Iraq":"Irak","Norway":"Norvège","Argentina":"Argentine",
  "Algeria":"Algérie","Austria":"Autriche","Jordan":"Jordanie","Portugal":"Portugal",
  "DR Congo":"RD Congo","Uzbekistan":"Ouzbékistan","Colombia":"Colombie",
  "England":"Angleterre","Croatia":"Croatie","Ghana":"Ghana","Panama":"Panama",
  "South Korea":"Corée du Sud","Korea DPR":"Corée du Nord"
};

// Statuts football-data.org → format interne
const FD_STATUS = {
  "SCHEDULED":"scheduled","TIMED":"scheduled","IN_PLAY":"1H","PAUSED":"HT",
  "FINISHED":"FT","AWARDED":"FT","CANCELLED":"cancelled","POSTPONED":"postponed"
};



const FLAGS = {
  "France": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDIzOTUiLz48cmVjdCB4PSIxIiB3aWR0aD0iMSIgaGVpZ2h0PSIyIiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iMiIgd2lkdGg9IjEiIGhlaWdodD0iMiIgZmlsbD0iI0VEMjkzOSIvPjwvc3ZnPg==",
  "Espagne": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiNjNjBiMWUiLz48cmVjdCB5PSIwLjUiIHdpZHRoPSIzIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmM0MDAiLz48L3N2Zz4=",
  "Allemagne": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjMDAwIi8+PHJlY3QgeT0iMC42NjciIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjRDAwIi8+PHJlY3QgeT0iMS4zMzMiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjRkZDRTAwIi8+PC9zdmc+",
  "Portugal": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDY2MDAiLz48cmVjdCB4PSIxIiB3aWR0aD0iMiIgaGVpZ2h0PSIyIiBmaWxsPSIjRkYwMDAwIi8+PC9zdmc+",
  "Angleterre": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2IDQiPjxyZWN0IHdpZHRoPSI2IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiLz48cmVjdCB4PSIwIiB5PSIxLjUiIHdpZHRoPSI2IiBoZWlnaHQ9IjEiIGZpbGw9IiNDRTExMjQiLz48cmVjdCB4PSIyLjUiIHk9IjAiIHdpZHRoPSIxIiBoZWlnaHQ9IjQiIGZpbGw9IiNDRTExMjQiLz48L3N2Zz4=",
  "Écosse": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2IDQiPjxyZWN0IHdpZHRoPSI2IiBoZWlnaHQ9IjQiIGZpbGw9IiMwMDMwNzgiLz48bGluZSB4MT0iMCIgeTE9IjAiIHgyPSI2IiB5Mj0iNCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEuMiIvPjxsaW5lIHgxPSI2IiB5MT0iMCIgeDI9IjAiIHkyPSI0IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMS4yIi8+PC9zdmc+",
  "Pays-Bas": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjQUUxQzI4Ii8+PHJlY3QgeT0iMC42NjciIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjZmZmIi8+PHJlY3QgeT0iMS4zMzMiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjMjE0NjhCIi8+PC9zdmc+",
  "Belgique": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDAiLz48cmVjdCB4PSIxIiB3aWR0aD0iMSIgaGVpZ2h0PSIyIiBmaWxsPSIjRkFFMDQyIi8+PHJlY3QgeD0iMiIgd2lkdGg9IjEiIGhlaWdodD0iMiIgZmlsbD0iI0VGMzM0MCIvPjwvc3ZnPg==",
  "Croatie": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjRkYwMDAwIi8+PHJlY3QgeT0iMC42NjciIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjZmZmIi8+PHJlY3QgeT0iMS4zMzMiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjMDAwMENDIi8+PC9zdmc+",
  "Autriche": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjRUQyOTM5Ii8+PHJlY3QgeT0iMC42NjciIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjZmZmIi8+PHJlY3QgeT0iMS4zMzMiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjRUQyOTM5Ii8+PC9zdmc+",
  "Suisse": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjRkYwMDAwIi8+PHJlY3QgeD0iMTMiIHk9IjUiIHdpZHRoPSI2IiBoZWlnaHQ9IjIyIiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iNSIgeT0iMTMiIHdpZHRoPSIyMiIgaGVpZ2h0PSI2IiBmaWxsPSIjZmZmIi8+PC9zdmc+",
  "Suède": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxMCI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjEwIiBmaWxsPSIjMDA2QUE3Ii8+PHJlY3QgeD0iNCIgd2lkdGg9IjIiIGhlaWdodD0iMTAiIGZpbGw9IiNGRUNDMDIiLz48cmVjdCB5PSI0IiB3aWR0aD0iMTYiIGhlaWdodD0iMiIgZmlsbD0iI0ZFQ0MwMiIvPjwvc3ZnPg==",
  "Norvège": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMiAxNiI+PHJlY3Qgd2lkdGg9IjIyIiBoZWlnaHQ9IjE2IiBmaWxsPSIjRUYyQjJEIi8+PHJlY3QgeD0iNiIgd2lkdGg9IjQiIGhlaWdodD0iMTYiIGZpbGw9IiNmZmYiLz48cmVjdCB5PSI2IiB3aWR0aD0iMjIiIGhlaWdodD0iNCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjciIHdpZHRoPSIyIiBoZWlnaHQ9IjE2IiBmaWxsPSIjMDAzNjgwIi8+PHJlY3QgeT0iNyIgd2lkdGg9IjIyIiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDM2ODAiLz48L3N2Zz4=",
  "Brésil": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0IDIuOCI+PHJlY3Qgd2lkdGg9IjQiIGhlaWdodD0iMi44IiBmaWxsPSIjMDA5QzNCIi8+PHBvbHlnb24gcG9pbnRzPSIyLDAuMiAzLjgsMS40IDIsMi42IDAuMiwxLjQiIGZpbGw9IiNGRkRGMDAiLz48Y2lyY2xlIGN4PSIyIiBjeT0iMS40IiByPSIwLjciIGZpbGw9IiMwMDI3NzYiLz48L3N2Zz4=",
  "Argentine": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjNzRBQ0RGIi8+PHJlY3QgeT0iMC42NjciIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjZmZmIi8+PHJlY3QgeT0iMS4zMzMiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjNzRBQ0RGIi8+PGNpcmNsZSBjeD0iMS41IiBjeT0iMSIgcj0iMC4yNSIgZmlsbD0iI0Y2QjQwRSIvPjwvc3ZnPg==",
  "Colombie": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjEiIGZpbGw9IiNGQ0QxMTYiLz48cmVjdCB5PSIxIiB3aWR0aD0iMyIgaGVpZ2h0PSIwLjUiIGZpbGw9IiMwMDMwODciLz48cmVjdCB5PSIxLjUiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNSIgZmlsbD0iI0NFMTEyNiIvPjwvc3ZnPg==",
  "Uruguay": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2IDQiPjxyZWN0IHdpZHRoPSI2IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiLz48cmVjdCB5PSIwLjQ0NCIgd2lkdGg9IjYiIGhlaWdodD0iMC4yMjIiIGZpbGw9IiMwMDNEQTUiLz48cmVjdCB5PSIwLjg4OSIgd2lkdGg9IjYiIGhlaWdodD0iMC4yMjIiIGZpbGw9IiMwMDNEQTUiLz48cmVjdCB5PSIxLjMzMyIgd2lkdGg9IjYiIGhlaWdodD0iMC4yMjIiIGZpbGw9IiMwMDNEQTUiLz48cmVjdCB5PSIxLjc3OCIgd2lkdGg9IjYiIGhlaWdodD0iMC4yMjIiIGZpbGw9IiMwMDNEQTUiLz48cmVjdCB4PSIyIiB5PSIwIiB3aWR0aD0iNCIgaGVpZ2h0PSIyLjIyMiIgZmlsbD0iI2ZmZiIvPjxyZWN0IHk9IjIuMjIyIiB3aWR0aD0iNiIgaGVpZ2h0PSIwLjIyMiIgZmlsbD0iIzAwM0RBNSIvPjxyZWN0IHk9IjIuNjY3IiB3aWR0aD0iNiIgaGVpZ2h0PSIwLjIyMiIgZmlsbD0iIzAwM0RBNSIvPjxyZWN0IHk9IjMuMTExIiB3aWR0aD0iNiIgaGVpZ2h0PSIwLjIyMiIgZmlsbD0iIzAwM0RBNSIvPjxyZWN0IHk9IjMuNTU2IiB3aWR0aD0iNiIgaGVpZ2h0PSIwLjIyMiIgZmlsbD0iIzAwM0RBNSIvPjxjaXJjbGUgY3g9IjEiIGN5PSIxLjEiIHI9IjAuNCIgZmlsbD0iI0ZERDAxNiIvPjwvc3ZnPg==",
  "Équateur": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjEiIGZpbGw9IiNGRkQxMDAiLz48cmVjdCB5PSIxIiB3aWR0aD0iMyIgaGVpZ2h0PSIwLjUiIGZpbGw9IiMwMDMwODciLz48cmVjdCB5PSIxLjUiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNSIgZmlsbD0iI0NFMTEyNiIvPjwvc3ZnPg==",
  "Paraguay": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjRDUyQjFFIi8+PHJlY3QgeT0iMC42NjciIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjZmZmIi8+PHJlY3QgeT0iMS4zMzMiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjMDAzOEE4Ii8+PC9zdmc+",
  "États-Unis": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOSAxMCI+PHJlY3Qgd2lkdGg9IjE5IiBoZWlnaHQ9IjEwIiBmaWxsPSIjQjIyMjM0Ii8+PHJlY3QgeT0iMC43NjkiIHdpZHRoPSIxOSIgaGVpZ2h0PSIwLjc2OSIgZmlsbD0iI2ZmZiIvPjxyZWN0IHk9IjEuNTM4IiB3aWR0aD0iMTkiIGhlaWdodD0iMC43NjkiIGZpbGw9IiNCMjIyMzQiLz48cmVjdCB5PSIyLjMwOCIgd2lkdGg9IjE5IiBoZWlnaHQ9IjAuNzY5IiBmaWxsPSIjZmZmIi8+PHJlY3QgeT0iMy4wNzciIHdpZHRoPSIxOSIgaGVpZ2h0PSIwLjc2OSIgZmlsbD0iI0IyMjIzNCIvPjxyZWN0IHk9IjMuODQ2IiB3aWR0aD0iMTkiIGhlaWdodD0iMC43NjkiIGZpbGw9IiNmZmYiLz48cmVjdCB5PSI0LjYxNSIgd2lkdGg9IjE5IiBoZWlnaHQ9IjAuNzY5IiBmaWxsPSIjQjIyMjM0Ii8+PHJlY3QgeT0iNS4zODUiIHdpZHRoPSIxOSIgaGVpZ2h0PSIwLjc2OSIgZmlsbD0iI2ZmZiIvPjxyZWN0IHk9IjYuMTU0IiB3aWR0aD0iMTkiIGhlaWdodD0iMC43NjkiIGZpbGw9IiNCMjIyMzQiLz48cmVjdCB5PSI2LjkyMyIgd2lkdGg9IjE5IiBoZWlnaHQ9IjAuNzY5IiBmaWxsPSIjZmZmIi8+PHJlY3QgeT0iNy42OTIiIHdpZHRoPSIxOSIgaGVpZ2h0PSIwLjc2OSIgZmlsbD0iI0IyMjIzNCIvPjxyZWN0IHk9IjguNDYyIiB3aWR0aD0iMTkiIGhlaWdodD0iMC43NjkiIGZpbGw9IiNmZmYiLz48cmVjdCB5PSI5LjIzMSIgd2lkdGg9IjE5IiBoZWlnaHQ9IjAuNzY5IiBmaWxsPSIjQjIyMjM0Ii8+PHJlY3Qgd2lkdGg9IjcuNiIgaGVpZ2h0PSI1LjM4NSIgZmlsbD0iIzNDM0I2RSIvPjwvc3ZnPg==",
  "Mexique": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDY4NDciLz48cmVjdCB4PSIxIiB3aWR0aD0iMSIgaGVpZ2h0PSIyIiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iMiIgd2lkdGg9IjEiIGhlaWdodD0iMiIgZmlsbD0iI0NFMTEyNiIvPjwvc3ZnPg==",
  "Canada": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIwLjc1IiBoZWlnaHQ9IjIiIGZpbGw9IiNGRjAwMDAiLz48cmVjdCB4PSIwLjc1IiB3aWR0aD0iMS41IiBoZWlnaHQ9IjIiIGZpbGw9IiNmZmYiLz48cmVjdCB4PSIyLjI1IiB3aWR0aD0iMC43NSIgaGVpZ2h0PSIyIiBmaWxsPSIjRkYwMDAwIi8+PHBvbHlnb24gcG9pbnRzPSIxLjUsMC4zNSAxLjY1LDAuNzUgMi4wNSwwLjYgMS44NSwwLjk1IDIuMiwxLjAgMS41LDEuNSAwLjgsMS4wIDEuMTUsMC45NSAwLjk1LDAuNiAxLjM1LDAuNzUiIGZpbGw9IiNGRjAwMDAiLz48L3N2Zz4=",
  "Panama": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0IDIiPjxyZWN0IHdpZHRoPSIyIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiLz48cmVjdCB4PSIyIiB5PSIxIiB3aWR0aD0iMiIgaGVpZ2h0PSIxIiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iMiIgd2lkdGg9IjIiIGhlaWdodD0iMSIgZmlsbD0iI0RBMjkxQyIvPjxyZWN0IHk9IjEiIHdpZHRoPSIyIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDMwODIiLz48Y2lyY2xlIGN4PSIxIiBjeT0iMC41IiByPSIwLjMiIGZpbGw9IiMwMDMwODIiLz48Y2lyY2xlIGN4PSIzIiBjeT0iMS41IiByPSIwLjMiIGZpbGw9IiNEQTI5MUMiLz48L3N2Zz4=",
  "Japon": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIxLjUiIGN5PSIxIiByPSIwLjYiIGZpbGw9IiNCQzAwMkQiLz48L3N2Zz4=",
  "Corée du Sud": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIxLjUiIGN5PSIxIiByPSIwLjUiIGZpbGw9IiNDRDJFM0EiLz48cGF0aCBkPSJNMS41LDAuNSBBMC41LDAuNSAwIDAsMSAxLjUsMS41IEEwLjI1LDAuMjUgMCAwLDEgMS41LDEgQTAuMjUsMC4yNSAwIDAsMCAxLjUsMC41WiIgZmlsbD0iIzAwMzQ3OCIvPjxyZWN0IHg9IjAuNCIgeT0iMC4zIiB3aWR0aD0iMC40IiBoZWlnaHQ9IjAuMSIgZmlsbD0iIzAwMCIvPjxyZWN0IHg9IjAuNCIgeT0iMC40NSIgd2lkdGg9IjAuNCIgaGVpZ2h0PSIwLjEiIGZpbGw9IiMwMDAiLz48cmVjdCB4PSIwLjQiIHk9IjAuNiIgd2lkdGg9IjAuNCIgaGVpZ2h0PSIwLjEiIGZpbGw9IiMwMDAiLz48cmVjdCB4PSIyLjIiIHk9IjAuMyIgd2lkdGg9IjAuNCIgaGVpZ2h0PSIwLjEiIGZpbGw9IiMwMDAiLz48cmVjdCB4PSIyLjIiIHk9IjAuNDUiIHdpZHRoPSIwLjQiIGhlaWdodD0iMC4xIiBmaWxsPSIjMDAwIi8+PHJlY3QgeD0iMi4yIiB5PSIwLjYiIHdpZHRoPSIwLjQiIGhlaWdodD0iMC4xIiBmaWxsPSIjMDAwIi8+PC9zdmc+",
  "Australie": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0IDIiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDAwOEIiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMS41IiBoZWlnaHQ9IjEiIGZpbGw9IiMwMTIxNjkiLz48bGluZSB4MT0iMCIgeTE9IjAiIHgyPSIxLjUiIHkyPSIxIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC4yNSIvPjxsaW5lIHgxPSIxLjUiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIwLjI1Ii8+PGxpbmUgeDE9IjAiIHkxPSIwIiB4Mj0iMS41IiB5Mj0iMSIgc3Ryb2tlPSIjQ0MwMDAxIiBzdHJva2Utd2lkdGg9IjAuMTIiLz48bGluZSB4MT0iMS41IiB5MT0iMCIgeDI9IjAiIHkyPSIxIiBzdHJva2U9IiNDQzAwMDEiIHN0cm9rZS13aWR0aD0iMC4xMiIvPjxyZWN0IHg9IjAuNiIgeT0iMCIgd2lkdGg9IjAuMyIgaGVpZ2h0PSIxIiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iMCIgeT0iMC4zNSIgd2lkdGg9IjEuNSIgaGVpZ2h0PSIwLjMiIGZpbGw9IiNmZmYiLz48cmVjdCB4PSIwLjY3IiB5PSIwIiB3aWR0aD0iMC4xNiIgaGVpZ2h0PSIxIiBmaWxsPSIjQ0MwMDAxIi8+PHJlY3QgeD0iMCIgeT0iMC40MiIgd2lkdGg9IjEuNSIgaGVpZ2h0PSIwLjE2IiBmaWxsPSIjQ0MwMDAxIi8+PGNpcmNsZSBjeD0iMyIgY3k9IjEuNSIgcj0iMC4xOCIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjIuNSIgY3k9IjEuMiIgcj0iMC4xIiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMy41IiBjeT0iMS4yIiByPSIwLjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=",
  "Iran": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjMjM5RjQwIi8+PHJlY3QgeT0iMC42NjciIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjZmZmIi8+PHJlY3QgeT0iMS4zMzMiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjREEwMDAwIi8+PC9zdmc+",
  "Arabie Saoudite": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDZDMzUiLz48cmVjdCB5PSIxLjUiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNSIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjAuMiIgeT0iMC43IiB3aWR0aD0iMi42IiBoZWlnaHQ9IjAuMTUiIGZpbGw9IiNmZmYiIHJ4PSIwLjA3Ii8+PC9zdmc+",
  "Qatar": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDQiPjxyZWN0IHdpZHRoPSIyIiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiLz48cmVjdCB4PSIyIiB3aWR0aD0iNiIgaGVpZ2h0PSI0IiBmaWxsPSIjOEQxQjNEIi8+PHBvbHlnb24gcG9pbnRzPSIyLDAgMy41LDAuNSAyLDEgMy41LDEuNSAyLDIgMy41LDIuNSAyLDMgMy41LDMuNSAyLDQiIGZpbGw9IiNmZmYiLz48L3N2Zz4=",
  "Jordanie": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjMDA3QTNEIi8+PHJlY3QgeT0iMC42NjciIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjZmZmIi8+PHJlY3QgeT0iMS4zMzMiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjMDAwIi8+PHBvbHlnb24gcG9pbnRzPSIwLDAgMSwxIDAsMiIgZmlsbD0iI0NFMTEyNiIvPjwvc3ZnPg==",
  "Irak": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjQ0UxMTI2Ii8+PHJlY3QgeT0iMC42NjciIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjZmZmIi8+PHJlY3QgeT0iMS4zMzMiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjMDAwIi8+PC9zdmc+",
  "Ouzbékistan": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjAuNiIgZmlsbD0iIzAwOTlCNSIvPjxyZWN0IHk9IjAuNiIgd2lkdGg9IjMiIGhlaWdodD0iMC4xMyIgZmlsbD0iI2ZmZiIvPjxyZWN0IHk9IjAuNzMiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNTQiIGZpbGw9IiNmZmYiLz48cmVjdCB5PSIxLjI3IiB3aWR0aD0iMyIgaGVpZ2h0PSIwLjEzIiBmaWxsPSIjZmZmIi8+PHJlY3QgeT0iMS40IiB3aWR0aD0iMyIgaGVpZ2h0PSIwLjYiIGZpbGw9IiMxRUI1M0EiLz48L3N2Zz4=",
  "Maroc": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiNDMTI3MkQiLz48cG9seWdvbiBwb2ludHM9IjEuNSwwLjUgMS42NSwwLjk1IDIuMSwwLjk1IDEuNzUsMS4yMiAxLjg4LDEuNjcgMS41LDEuNDIgMS4xMiwxLjY3IDEuMjUsMS4yMiAwLjksMC45NSAxLjM1LDAuOTUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwNjIzMyIgc3Ryb2tlLXdpZHRoPSIwLjA2Ii8+PC9zdmc+",
  "Sénégal": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDg1M0YiLz48cmVjdCB4PSIxIiB3aWR0aD0iMSIgaGVpZ2h0PSIyIiBmaWxsPSIjRkRFRjQyIi8+PHJlY3QgeD0iMiIgd2lkdGg9IjEiIGhlaWdodD0iMiIgZmlsbD0iI0UzMUIyMyIvPjxwb2x5Z29uIHBvaW50cz0iMS41LDAuNTUgMS42LDAuODUgMS45LDAuODUgMS42NSwxLjAyIDEuNzUsMS4zMiAxLjUsMS4xNSAxLjI1LDEuMzIgMS4zNSwxLjAyIDEuMSwwLjg1IDEuNCwwLjg1IiBmaWxsPSIjMDA4NTNGIi8+PC9zdmc+",
  "Algérie": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIxLjUiIGhlaWdodD0iMiIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjEuNSIgd2lkdGg9IjEuNSIgaGVpZ2h0PSIyIiBmaWxsPSIjMDA2MjMzIi8+PGNpcmNsZSBjeD0iMS4zNSIgY3k9IjEiIHI9IjAuNDIiIGZpbGw9IiNEMjEwMzQiLz48Y2lyY2xlIGN4PSIxLjUiIGN5PSIxIiByPSIwLjM1IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMS4zNSIgY3k9IjEiIHI9IjAuNDIiIGZpbGw9Im5vbmUiLz48cG9seWdvbiBwb2ludHM9IjEuNiwwLjcgMS42NSwwLjg1IDEuOCwwLjgyIDEuNywwLjk1IDEuOCwxLjA3IDEuNjUsMS4wNSAxLjYsMS4yIDEuNTUsMS4wNSAxLjQsMS4wNyAxLjUsMC45NSAxLjQsMC44MiAxLjU1LDAuODUiIGZpbGw9IiNEMjEwMzQiLz48L3N2Zz4=",
  "Égypte": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjQ0UxMTI2Ii8+PHJlY3QgeT0iMC42NjciIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjZmZmIi8+PHJlY3QgeT0iMS4zMzMiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjMDAwIi8+PC9zdmc+",
  "Tunisie": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiNFNzAwMTMiLz48Y2lyY2xlIGN4PSIxLjUiIGN5PSIxIiByPSIwLjU1IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMS40IiBjeT0iMSIgcj0iMC4zOCIgZmlsbD0iI0U3MDAxMyIvPjxjaXJjbGUgY3g9IjEuNTUiIGN5PSIxIiByPSIwLjM1IiBmaWxsPSIjZmZmIi8+PHBvbHlnb24gcG9pbnRzPSIxLjY1LDAuOCAxLjcsMC45NSAxLjg1LDAuOTIgMS43NSwxLjA0IDEuODUsMS4xNSAxLjcsMS4xMiAxLjY1LDEuMjcgMS42LDEuMTIgMS40NSwxLjE1IDEuNTUsMS4wNCAxLjQ1LDAuOTIgMS42LDAuOTUiIGZpbGw9IiNFNzAwMTMiLz48L3N2Zz4=",
  "Ghana": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjMDA2QjNGIi8+PHJlY3QgeT0iMC42NjciIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjRkNEMTE2Ii8+PHJlY3QgeT0iMS4zMzMiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuNjY3IiBmaWxsPSIjQ0UxMTI2Ii8+PHBvbHlnb24gcG9pbnRzPSIxLjUsMC41NSAxLjYsMC44NSAxLjksMC44NSAxLjY1LDEuMDIgMS43NSwxLjMyIDEuNSwxLjE1IDEuMjUsMS4zMiAxLjM1LDEuMDIgMS4xLDAuODUgMS40LDAuODUiIGZpbGw9IiMwMDAiLz48L3N2Zz4=",
  "Côte d'Ivoire": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjIiIGZpbGw9IiNGNzdGMDAiLz48cmVjdCB4PSIxIiB3aWR0aD0iMSIgaGVpZ2h0PSIyIiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iMiIgd2lkdGg9IjEiIGhlaWdodD0iMiIgZmlsbD0iIzAwOUE0NCIvPjwvc3ZnPg==",
  "Afrique du Sud": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMiA4Ij48cmVjdCB3aWR0aD0iMTIiIGhlaWdodD0iOCIgZmlsbD0iIzAwN0E0RCIvPjxyZWN0IHdpZHRoPSIxMiIgaGVpZ2h0PSIzLjIiIGZpbGw9IiNERTM4MzEiLz48cmVjdCB5PSI0LjgiIHdpZHRoPSIxMiIgaGVpZ2h0PSIzLjIiIGZpbGw9IiMwMDMyQTAiLz48cG9seWdvbiBwb2ludHM9IjAsMCA1LDQgMCw4IiBmaWxsPSIjRkZCNjEyIi8+PHBvbHlnb24gcG9pbnRzPSIwLDAuNiA0LDQgMCw3LjQiIGZpbGw9IiMwMDAiLz48cG9seWdvbiBwb2ludHM9IjAsMi44IDIuNSw0IDAsNS4yIiBmaWxsPSIjMDA3QTREIi8+PHJlY3QgeT0iMy4yIiB3aWR0aD0iMTIiIGhlaWdodD0iMS42IiBmaWxsPSIjZmZmIi8+PC9zdmc+",
  "RD Congo": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0IDMiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjMiIGZpbGw9IiMwMDdGRkYiLz48bGluZSB4MT0iMCIgeTE9IjMiIHgyPSI0IiB5Mj0iMCIgc3Ryb2tlPSIjRjdEOTE4IiBzdHJva2Utd2lkdGg9IjAuOCIvPjxwb2x5Z29uIHBvaW50cz0iMC41LDAuMiAwLjcsMC44IDEuMiwwLjggMC44NSwxLjEgMC45NywxLjcgMC41LDEuMzUgMC4wMywxLjcgMC4xNSwxLjEgLTAuMiwwLjggMC4zLDAuOCIgZmlsbD0iI0Y3RDkxOCIvPjxwb2x5Z29uIHBvaW50cz0iMy44LDIuNyAzLjk1LDMgMywyLjciIGZpbGw9IiNERTIwMTAiLz48L3N2Zz4=",
  "Cap-Vert": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDM4OTMiLz48cmVjdCB5PSIxLjEiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuMTUiIGZpbGw9IiNmZmYiLz48cmVjdCB5PSIxLjMiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuMyIgZmlsbD0iI0NGMjAyNyIvPjxyZWN0IHk9IjEuNiIgd2lkdGg9IjMiIGhlaWdodD0iMC4xNSIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==",
  "Nouvelle-Zélande": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0IDIiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDI0N0QiLz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMS41IiBoZWlnaHQ9IjEiIGZpbGw9IiMwMTIxNjkiLz48bGluZSB4MT0iMCIgeTE9IjAiIHgyPSIxLjUiIHkyPSIxIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC4yIi8+PGxpbmUgeDE9IjEuNSIgeTE9IjAiIHgyPSIwIiB5Mj0iMSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjAuMiIvPjxsaW5lIHgxPSIwIiB5MT0iMCIgeDI9IjEuNSIgeTI9IjEiIHN0cm9rZT0iI0NDMDAwMSIgc3Ryb2tlLXdpZHRoPSIwLjEiLz48bGluZSB4MT0iMS41IiB5MT0iMCIgeDI9IjAiIHkyPSIxIiBzdHJva2U9IiNDQzAwMDEiIHN0cm9rZS13aWR0aD0iMC4xIi8+PHJlY3QgeD0iMC41NSIgeT0iMCIgd2lkdGg9IjAuMjgiIGhlaWdodD0iMSIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjAiIHk9IjAuMzMiIHdpZHRoPSIxLjUiIGhlaWdodD0iMC4yOCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjAuNjIiIHk9IjAiIHdpZHRoPSIwLjE0IiBoZWlnaHQ9IjEiIGZpbGw9IiNDQzAwMDEiLz48cmVjdCB4PSIwIiB5PSIwLjQiIHdpZHRoPSIxLjUiIGhlaWdodD0iMC4xNCIgZmlsbD0iI0NDMDAwMSIvPjxjaXJjbGUgY3g9IjIuNSIgY3k9IjAuNCIgcj0iMC4xMiIgZmlsbD0iI0NDMDAwMSIvPjxjaXJjbGUgY3g9IjMuMiIgY3k9IjAuNyIgcj0iMC4xMiIgZmlsbD0iI0NDMDAwMSIvPjxjaXJjbGUgY3g9IjMuNiIgY3k9IjAuMyIgcj0iMC4xMiIgZmlsbD0iI0NDMDAwMSIvPjxjaXJjbGUgY3g9IjMuMCIgY3k9IjEuNSIgcj0iMC4xMiIgZmlsbD0iI0NDMDAwMSIvPjwvc3ZnPg==",
  "Bosnie-Herzégovine": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDIzOTUiLz48cG9seWdvbiBwb2ludHM9IjAuNSwwIDIuNSwyIDAuNSwyIiBmaWxsPSIjRkZDRDAwIi8+PGxpbmUgeDE9IjAuNyIgeTE9IjAiIHgyPSIyLjkiIHkyPSIwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC4xMiIgc3Ryb2tlLWRhc2hhcnJheT0iMC4xMiAwLjIiLz48L3N2Zz4=",
  "République tchèque": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiLz48cmVjdCB5PSIxIiB3aWR0aD0iMyIgaGVpZ2h0PSIxIiBmaWxsPSIjRDcxNDFBIi8+PHBvbHlnb24gcG9pbnRzPSIwLDAgMS41LDEgMCwyIiBmaWxsPSIjMTE0NTdFIi8+PC9zdmc+",
  "Curaçao": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDJCN0YiLz48cmVjdCB5PSIxLjMiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuMiIgZmlsbD0iI0Y5RTgxNCIvPjxyZWN0IHk9IjEuNTUiIHdpZHRoPSIzIiBoZWlnaHQ9IjAuMiIgZmlsbD0iI0Y5RTgxNCIvPjxjaXJjbGUgY3g9IjAuNiIgY3k9IjAuNiIgcj0iMC4xMiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjAuOSIgY3k9IjAuNCIgcj0iMC4xMiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==",
  "Haïti": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDIwOUYiLz48cmVjdCB5PSIxIiB3aWR0aD0iMyIgaGVpZ2h0PSIxIiBmaWxsPSIjRDIxMDM0Ii8+PC9zdmc+",
  "Turquie": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiNFMzBBMTciLz48Y2lyY2xlIGN4PSIxLjIiIGN5PSIxIiByPSIwLjQ1IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iMS40IiBjeT0iMSIgcj0iMC4zNiIgZmlsbD0iI0UzMEExNyIvPjxwb2x5Z29uIHBvaW50cz0iMS44NSwwLjggMS45LDAuOTUgMi4wNSwwLjkyIDEuOTUsMS4wNSAyLjA1LDEuMTggMS45LDEuMTQgMS44NSwxLjI5IDEuOCwxLjE0IDEuNjUsMS4xOCAxLjc1LDEuMDUgMS42NSwwLjkyIDEuOCwwLjk1IiBmaWxsPSIjZmZmIi8+PC9zdmc+",
};

// Flag component — SVG inline base64, aucune requête réseau, Windows-compatible
function Flag({ country, size = 28 }) {
  const src = FLAGS[country];
  if (!src) return (
    <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:size, height:Math.round(size*0.67), background:"#1e293b", borderRadius:3, verticalAlign:"middle", flexShrink:0, fontSize:Math.round(size*0.5), color:"#475569" }}>?</span>
  );
  return (
    <img src={src} width={size} height={Math.round(size*0.67)} alt={country}
      style={{ display:"inline-block", borderRadius:3, verticalAlign:"middle", flexShrink:0, objectFit:"fill", border:"1px solid rgba(255,255,255,0.12)" }}
    />
  );
}

// Flag component — images SVG base64 inline, aucune requête réseau, 100% Windows


const GROUPS = {
  A:["Mexique","Afrique du Sud","Corée du Sud","République tchèque"],
  B:["Canada","Bosnie-Herzégovine","Qatar","Suisse"],
  C:["Brésil","Maroc","Haïti","Écosse"],
  D:["États-Unis","Paraguay","Australie","Turquie"],
  E:["Allemagne","Curaçao","Côte d'Ivoire","Équateur"],
  F:["Pays-Bas","Japon","Suède","Tunisie"],
  G:["Belgique","Égypte","Iran","Nouvelle-Zélande"],
  H:["Espagne","Cap-Vert","Arabie Saoudite","Uruguay"],
  I:["France","Sénégal","Irak","Norvège"],
  J:["Argentine","Algérie","Autriche","Jordanie"],
  K:["Portugal","RD Congo","Ouzbékistan","Colombie"],
  L:["Angleterre","Croatie","Ghana","Panama"]
};

const COACHES = {
  "France":"Didier Deschamps","Espagne":"Luis de la Fuente","Angleterre":"Thomas Tuchel",
  "Allemagne":"Julian Nagelsmann","Brésil":"Carlo Ancelotti","Argentine":"Lionel Scaloni",
  "Portugal":"Roberto Martínez","Pays-Bas":"Ronald Koeman","Belgique":"Rudi Garcia",
  "Uruguay":"Marcelo Bielsa","Mexique":"Javier Aguirre","États-Unis":"Mauricio Pochettino",
  "Japon":"Hajime Moriyasu","Maroc":"Mohamed Ouahbi","Sénégal":"Aliou Cissé",
  "Colombie":"Néstor Lorenzo","Équateur":"Sébastien Beccacece","Croatie":"Zlatko Dalić",
  "Canada":"Jesse Marsch","Suisse":"Murat Yakin","Arabie Saoudite":"Hervé Renard",
  "Australie":"Tony Popovic","Corée du Sud":"Hong Myung-bo","République tchèque":"Ivan Hašek",
  "Autriche":"Ralf Rangnick","Suède":"Jon Dahl Tomasson","Norvège":"Ståle Solbakken",
  "Algérie":"Vladimir Petković","Égypte":"Hossam El-Badry","Tunisie":"Faouzi Ghazali",
  "Ghana":"Otto Addo","Côte d'Ivoire":"Emerse Faé","RD Congo":"Sébastien Desabre",
  "Afrique du Sud":"Hugo Broos","Écosse":"Steve Clarke","Iran":"Amir Ghalenoei",
  "Irak":"Jesus Casas","Jordanie":"Hussein Ammouta","Qatar":"Marquez Lopez",
  "Ouzbékistan":"Srecko Katanec","Paraguay":"Gustavo Alfaro","Haïti":"Marc Collat",
  "Panama":"Thomas Christiansen","Nouvelle-Zélande":"Darren Bazeley","Curaçao":"Remko Bicentini",
  "Bosnie-Herzégovine":"Sergej Barbarez","Cap-Vert":"Bubista","Turquie":"Vincenzo Montella"
};

const SQUADS = {
  "France":{
    gardiens:["Mike Maignan (AC Milan)","Brice Samba (Stade Rennais)","Robin Risser (RC Lens)"],
    défenseurs:["Jules Koundé (FC Barcelone)","William Saliba (Arsenal)","Dayot Upamecano (Bayern Munich)","Ibrahima Konaté (Liverpool)","Lucas Hernandez (PSG)","Théo Hernandez (AC Milan)","Lucas Digne (Aston Villa)","Malo Gusto (Chelsea)","Maxence Lacroix (Crystal Palace)"],
    milieux:["Aurélien Tchouaméni (Real Madrid)","N'Golo Kanté (Fenerbahçe)","Manu Koné (AS Roma)","Adrien Rabiot (AC Milan)","Warren Zaïre-Emery (PSG)"],
    attaquants:["Kylian Mbappé © (Real Madrid)","Ousmane Dembélé (PSG)","Marcus Thuram (Inter Milan)","Bradley Barcola (PSG)","Rayan Cherki (Man City)","Michael Olise (Bayern Munich)","Désiré Doué (PSG)","Maghnès Akliouche (Monaco)","Jean-Philippe Mateta (Crystal Palace)"]
  },
  "Argentine":{
    gardiens:["Emiliano Martínez (Aston Villa)","Juan Musso (Atlético Madrid)","Gerónimo Rulli (Marseille)"],
    défenseurs:["Cristian Romero (Tottenham)","Lisandro Martínez (Man Utd)","Nicolás Otamendi (Benfica)","Nahuel Molina (Atlético Madrid)","Nicolás Tagliafico (Lyon)","Leonardo Balerdi (Marseille)","Gonzalo Montiel (River Plate)","Facundo Medina (Marseille)"],
    milieux:["Rodrigo De Paul (Inter Miami)","Alexis Mac Allister (Liverpool)","Enzo Fernández (Chelsea)","Leandro Paredes (Boca Juniors)","Giovani Lo Celso (Real Betis)","Exequiel Palacios (Leverkusen)","Valentín Barco (Strasbourg)"],
    attaquants:["Lionel Messi © (Inter Miami)","Julián Álvarez (Atlético Madrid)","Lautaro Martínez (Inter Milan)","Nicolás González (Atlético Madrid)","Giuliano Simeone (Atlético Madrid)","Nico Paz (Como)","Thiago Almada (Atlético Madrid)","José M. López (Palmeiras)"]
  },
  "Espagne":{
    gardiens:["David Raya (Arsenal)","Unai Simón (Athletic Club)","Álex Remiro (Real Sociedad)"],
    défenseurs:["Dani Carvajal (Real Madrid)","Pau Cubarsí (FC Barcelone)","Robin Le Normand (Atlético Madrid)","Marc Cucurella (Chelsea)","Alejandro Grimaldo (Leverkusen)","Aymeric Laporte (Al-Nassr)","Martín Zubimendi (Arsenal)"],
    milieux:["Pedri (FC Barcelone)","Gavi (FC Barcelone)","Rodri (Man City)","Mikel Merino (Arsenal)","Fabián Ruiz (PSG)","Dani Olmo (FC Barcelone)"],
    attaquants:["Lamine Yamal (FC Barcelone)","Nico Williams (Athletic Club)","Álvaro Morata © (AC Milan)","Ferran Torres (FC Barcelone)","Mikel Oyarzabal (Real Sociedad)","Yeremy Pino (Villarreal)"]
  },
  "Angleterre":{
    gardiens:["Jordan Pickford (Everton)","Aaron Ramsdale (Arsenal)","Dean Henderson (Crystal Palace)"],
    défenseurs:["Kyle Walker (Man City)","Harry Maguire (Man Utd)","Marc Guéhi (Crystal Palace)","Luke Shaw (Man Utd)","Trent Alexander-Arnold (Real Madrid)","Levi Colwill (Chelsea)","Joe Gomez (Liverpool)"],
    milieux:["Declan Rice (Arsenal)","Jude Bellingham © (Real Madrid)","Phil Foden (Man City)","Kobbie Mainoo (Man Utd)","Adam Wharton (Crystal Palace)"],
    attaquants:["Harry Kane (Bayern Munich)","Bukayo Saka (Arsenal)","Marcus Rashford (Aston Villa)","Ollie Watkins (Aston Villa)","Anthony Gordon (Liverpool)","Cole Palmer (Chelsea)"]
  },
  "Allemagne":{
    gardiens:["Manuel Neuer © (Bayern Munich)","Oliver Baumann (Bayern Munich)","Alexander Nübel (Stuttgart)"],
    défenseurs:["Antonio Rüdiger (Real Madrid)","Jonathan Tah (Leverkusen)","David Raum (Leipzig)","Waldemar Anton (Stuttgart)","Robin Koch (Frankfurt)","Benjamin Henrichs (Leipzig)"],
    milieux:["Joshua Kimmich (Bayern Munich)","Ilkay Gündogan (Man City)","Jamal Musiala (Bayern Munich)","Florian Wirtz (Liverpool)","Leroy Sané (Bayern Munich)","Leon Goretzka (Bayern Munich)"],
    attaquants:["Kai Havertz (Arsenal)","Thomas Müller (Bayern Munich)","Niclas Füllkrug (West Ham)","Serge Gnabry (Bayern Munich)","Deniz Undav (Stuttgart)"]
  },
  "Brésil":{
    gardiens:["Alisson (Liverpool)","Ederson (Fenerbahçe)","Weverton (Grêmio)"],
    défenseurs:["Marquinhos © (PSG)","Danilo Luiz (Flamengo)","Gabriel Magalhães (Arsenal)","Bremer (Juventus)","Wesley (Roma)","Roger Ibañez (Al-Ahli)","Léo Pereira (Flamengo)","Alex Sandro (Flamengo)"],
    milieux:["Casemiro (Man Utd)","Lucas Paquetá (Flamengo)","Bruno Guimarães (Newcastle)","Fabinho (Al-Ittihad)","Danilo (Botafogo)"],
    attaquants:["Neymar Jr (Santos)","Vinícius Júnior (Real Madrid)","Raphinha (FC Barcelone)","Gabriel Martinelli (Arsenal)","Matheus Cunha (Man Utd)","Endrick (Lyon)","Luiz Henrique (Zenit)","Igor Thiago (Brentford)","Rayan (Bournemouth)"]
  },
  "Portugal":{
    gardiens:["Diogo Costa (FC Porto)","José Sá (Wolverhampton)","Rui Patrício (AS Roma)"],
    défenseurs:["Diogo Dalot (Man Utd)","Rúben Dias (Man City)","Pepe (Al-Duhail)","Nuno Mendes (PSG)","Nélson Semedo (Wolverhampton)","João Gomes (Wolverhampton)"],
    milieux:["Vitinha (PSG)","Bruno Fernandes © (Man Utd)","João Palhinha (Bayern Munich)","Rúben Neves (Al-Hilal)","Otávio (Al-Nassr)"],
    attaquants:["Cristiano Ronaldo (Al-Nassr)","Rafael Leão (AC Milan)","Bernardo Silva (Man City)","Gonçalo Ramos (PSG)","Pedro Neto (Chelsea)","João Félix (Chelsea)"]
  },
  "Pays-Bas":{
    gardiens:["Mark Flekken (Brentford)","Bart Verbruggen (Brighton)","Jasper Cillessen (Valencia)"],
    défenseurs:["Virgil van Dijk © (Liverpool)","Stefan de Vrij (Inter)","Denzel Dumfries (Inter)","Nathan Aké (Man City)","Jurriën Timber (Arsenal)","Lutsharel Geertruida (Leverkusen)"],
    milieux:["Tijjani Reijnders (AC Milan)","Frenkie de Jong (FC Barcelone)","Jerdy Schouten (Bologne)","Ryan Gravenberch (Liverpool)"],
    attaquants:["Cody Gakpo (Liverpool)","Xavi Simons (PSG)","Memphis Depay (Atlético Madrid)","Steven Bergwijn (Ajax)","Brian Brobbey (Ajax)","Wout Weghorst (Hoffenheim)"]
  },
  "Belgique":{
    gardiens:["Thibaut Courtois (Real Madrid)","Senne Lammens (Antwerp)","Mike Penders (Genk)"],
    défenseurs:["Timothy Castagne (Fulham)","Zeno Debast (Sporting CP)","Maxim De Cuyper (Club Brugge)","Koni De Winter (Genoa)","Brandon Mechele (Club Brugge)","Thomas Meunier (Trabzonspor)","Arthur Theate (Rennes)"],
    milieux:["Kevin De Bruyne (Napoli)","Amadou Onana (Aston Villa)","Nicolas Raskin (Rangers)","Youri Tielemans (Aston Villa)","Hans Vanaken (Club Brugge)","Axel Witsel (Atlético Madrid)"],
    attaquants:["Romelu Lukaku (Napoli)","Charles De Ketelaere (Atalanta)","Jérémy Doku (Man City)","Leandro Trossard (Arsenal)","Alexis Saelemaekers (AC Milan)","Dodi Lukebakio (Séville)","Diego Moreira (Benfica)","Lois Openda (Leipzig)"]
  },
  "Croatie":{
    gardiens:["Dominik Livaković (Fenerbahçe)","Ivica Ivušić (Hajduk Split)","Nediljko Labrović (Osijek)"],
    défenseurs:["Joško Gvardiol (Man City)","Josip Šutalo (Ajax)","Duje Ćaleta-Car (Southampton)","Borna Sosa (Stuttgart)","Martin Erlic (Bologne)","Šime Vrsaljko (Hajduk Split)"],
    milieux:["Luka Modrić © (Real Madrid)","Marcelo Brozović (Al-Nassr)","Mateo Kovačić (Man City)","Mario Pašalić (Atalanta)","Lovro Majer (Wolfsburg)","Luka Sučić (RB Salzburg)"],
    attaquants:["Ivan Perišić (Hajduk Split)","Andrej Kramarić (Hoffenheim)","Bruno Petković (Zagreb)","Marko Pjaca (Torino)","Petar Musa (Benfica)"]
  },
  "Uruguay":{
    gardiens:["Sergio Rochet (Nacional)","Matías Aguirregaray (Peñarol)","G. De Amores (Peñarol)"],
    défenseurs:["José María Giménez (Atlético Madrid)","Ronald Araújo (FC Barcelone)","Mathías Olivera (Napoli)","Marcelo Saracchi (Leipzig)","Agustín Oliveros (Peñarol)","Damián Suárez (Getafe)"],
    milieux:["Federico Valverde (Real Madrid)","Rodrigo Bentancur (Tottenham)","Nicolás De La Cruz (Flamengo)","Manuel Ugarte (Man Utd)","Matías Vecino (Lazio)","Facundo Pellistri (Parma)"],
    attaquants:["Darwin Núñez (Liverpool)","Edinson Cavani (Peñarol)","Facundo Torres (Orlando City)","Luciano Rodríguez (Liverpool)","G. De Arrascaeta (Flamengo)","Brian Rodríguez (LAFC)"]
  },
  "Sénégal":{
    gardiens:["Édouard Mendy (Al-Ahli)","Alfred Gomis (Rennes)","Seny Dieng (Middlesbrough)"],
    défenseurs:["Kalidou Koulibaly (Al-Hilal)","Abdou Diallo (Leipzig)","Ismail Jakobs (Monaco)","Pape Abdou Cissé (Olympiakos)","Formose Mendy (Caen)","Moussa Niakhate (Nottingham Forest)"],
    milieux:["Idrissa Gana Guèye (Everton)","Pape Matar Sarr (Tottenham)","Lamine Camara (Monaco)","Krepin Diatta (Monaco)","Nampalys Mendy (Leicester)","Pathé Ciss (Rayo Vallecano)"],
    attaquants:["Sadio Mané (Al-Nassr)","Ismaïla Sarr (Crystal Palace)","Nicolas Jackson (Chelsea)","Boulaye Dia (Lazio)","Iliman Ndiaye (Everton)","Habib Diallo (Strasbourg)"]
  },
  "Maroc":{
    gardiens:["Yassine Bounou (Al-Hilal)","Munir Mohamedi (R. Berkane)","Ahmed Tagnaouti (Wydad AC)"],
    défenseurs:["Achraf Hakimi (PSG)","Noussair Mazraoui (Man Utd)","Issa Diop (Fulham)","Chadi Riad (Crystal Palace)","Anass Salah-Eddine (PSV)","Zakaria El Ouahdi (Genk)","Jawad El Yamiq (Real Valladolid)","Samy Mmaee (Ferencváros)"],
    milieux:["Sofyan Amrabat (Real Betis)","Azzedine Ounahi (Girona)","Bilal El Khannouss (Stuttgart)","Neil El Aynaoui (Roma)","Ayyoub Bouaddi (Lille)","Ismael Saibari (PSV)","Ilias Chair (Strasbourg)"],
    attaquants:["Youssef En-Nesyri (Fenerbahçe)","Ayoub El Kaabi (Olympiakos)","Brahim Díaz (Real Madrid)","Hakim Ziyech (Galatasaray)","Soufiane Rahimi (Al-Ain)","Abde Ezzalzouli (Real Betis)"]
  },
  "Algérie":{
    gardiens:["Oussama Benbot (Levante)","Melvin Masstil (Strasbourg)","Luca Zidane (Granada)"],
    défenseurs:["Rayan Aït-Nouri (Man City)","Ramy Bensebaini (Dortmund)","Aïssa Mandi (Lille)","Rafik Belghali (Real Betis)","Zinedine Belaïd (Brest)","Jaouen Hadjam (Young Boys)","Samir Chergui (CR Belouizdad)"],
    milieux:["Houssem Aouar (Al-Ittihad)","Nabil Bentaleb (Lille)","Hicham Boudaoui (Nice)","Farès Chaibi (Frankfurt)","Ibrahim Maza (Leverkusen)","Ramiz Zerrouki (Feyenoord)","Yassine Titraoui (Servette)"],
    attaquants:["Riyad Mahrez © (Al-Ahli)","Mohamed Amoura (Wolverhampton)","Amine Gouiri (Marseille)","Anis Hadj Moussa (Feyenoord)","Farès Ghedjemis (Le Havre)","Adil Boulbina (Al-Duhail)"]
  },
  "Colombie":{
    gardiens:["Camilo Vargas (Atlas)","David Ospina (Millonarios)","Kevin Mier (Ind. Santa Fe)"],
    défenseurs:["Dávinson Sánchez (Galatasaray)","Yerry Mina (Atlético Nacional)","Daniel Muñoz (Crystal Palace)","Johan Mojica (Villarreal)","Jhon Lucumí (Bologne)","Santiago Arias (Leverkusen)"],
    milieux:["James Rodríguez (Rayo Vallecano)","Richard Ríos (Palmeiras)","Jhon Arias (Fluminense)","Juan Quintero (Atlético Nacional)","Mateus Uribe (Porto)","Juan Cuadrado (Ind. Santa Fe)"],
    attaquants:["Luis Díaz (Liverpool)","Jhon Durán (Aston Villa)","R. Santos Borré (Frankfurt)","Miguel Borja (River Plate)","Déinner Quiñones (Tolima)"]
  },
  "Mexique":{
    gardiens:["Raul Rangel (Guadalajara)","Carlos Acevedo (Santos Laguna)","Guillermo Ochoa (AEL Limassol)"],
    défenseurs:["Jorge Sanchez (PAOK)","Cesar Montes (Lokomotiv Moscow)","Edson Alvarez (Fenerbahce)","Johan Vasquez (Genoa)","Israel Reyes (América)","Mateo Chavez (AZ Alkmaar)","Jesus Gallardo (Toluca)"],
    milieux:["Erik Lira (Cruz Azul)","Luis Romo (Guadalajara)","Alvaro Fidalgo (Real Betis)","Orbelin Pineda (AEK Athens)","Obed Vargas (Atlético Madrid)","Luis Chavez (Dynamo Moscow)","Brian Gutierrez (Guadalajara)"],
    attaquants:["Julian Quinones (Al-Qadsiah)","Raul Jimenez (Fulham)","Santiago Gimenez (AC Milan)","Roberto Alvarado (Guadalajara)","Hirving Lozano (PSV)"]
  },
  "États-Unis":{
    gardiens:["Matt Turner (New England Revolution)","Chris Brady (Chicago Fire)","Matt Freese (NYCFC)"],
    défenseurs:["Sergiño Dest (PSV)","Antonee Robinson (Fulham)","Chris Richards (Crystal Palace)","Tim Ream (Charlotte FC)","Miles Robinson (FC Cincinnati)","Mark McKenzie (Toulouse)","Joe Scally (Mönchengladbach)"],
    milieux:["Tyler Adams (Bournemouth)","Weston McKennie (Juventus)","Malik Tillman (Leverkusen)","Gio Reyna (Mönchengladbach)","Brenden Aaronson (Leeds)","Tim Weah (Marseille)","Alejandro Zendejas (Club América)"],
    attaquants:["Christian Pulisic (AC Milan)","Folarin Balogun (Monaco)","Ricardo Pepi (PSV)","Haji Wright (Coventry)"]
  },
  "Canada":{
    gardiens:["Maxime Crépeau (LAFC)","Dayne St. Clair (Minnesota Utd)","James Pantemis (CF Montréal)"],
    défenseurs:["Alphonso Davies (Bayern Munich)","Alistair Johnston (Celtic)","Kamal Miller (Inter Miami)","Richie Laryea (Toronto FC)","Derek Cornelius (NEC Nijmegen)","Doneil Henry (CF Montréal)","Zachary Brault-Guillard (CF Montréal)"],
    milieux:["Atiba Hutchinson (Besiktas)","Ismaël Koné (Marseille)","Stephen Eustáquio (FC Porto)","Liam Fraser (Kortrijk)","Theo Corbeanu (Trabzonspor)"],
    attaquants:["Jonathan David (Juventus)","Tajon Buchanan (Club Brugge)","Cyle Larin (Real Valladolid)","Luca Koleosho (Burnley)","Jacob Shaffelburg (Nashville SC)","Jacen Russell-Rowe (Columbus Crew)"]
  },
  "Australie":{
    gardiens:["Mathew Ryan © (Lens)","Paul Izzo (Randers)","Patrick Beach (Melbourne City)"],
    défenseurs:["Harry Souttar (Sheffield United)","Milos Degenek (Columbus Crew)","Cameron Burgess (Swansea)","Alessandro Circati (Parma)","Jordan Bos (Westerlo)","Jason Geria (Western United)","Aziz Behich (Melbourne City)"],
    milieux:["Jackson Irvine (St. Pauli)","Cameron Devlin (Hearts)","Ajdin Hrustic (Adelaide United)","Connor Metcalfe (St. Pauli)","Aiden O'Neill (Standard Liège)"],
    attaquants:["Mathew Leckie (Melbourne City)","Nestory Irankunda (Watford)","Awer Mabil (Grasshopper)","Cristian Volpato (Parma)","Tete Yengi (Lincoln City)"]
  },
  "Japon":{
    gardiens:["Zion Suzuki (Parma)","Mitch Langerak (Nagoya Grampus)","Kosei Tani (Gamba Osaka)"],
    défenseurs:["Maya Yoshida (FC Basileia)","Hiroki Ito (Stuttgart)","Ko Itakura (Mönchengladbach)","Takehiro Tomiyasu (Arsenal)","Yuta Nakayama (Huddersfield)","Mao Hosoya (KAA Gent)"],
    milieux:["Wataru Endo (Liverpool)","Hidemasa Morita (Sporting CP)","Ritsu Doan (Freiburg)","Daichi Kamada (Crystal Palace)","Ao Tanaka (Dortmund)","Kaoru Mitoma (Brighton)","Junya Ito (Reims)"],
    attaquants:["Takumi Minamino (Monaco)","Ayase Ueda (Feyenoord)","Keito Nakamura (Reims)","Shoya Nakajima (Portimonense)"]
  },
  "Corée du Sud":{
    gardiens:["Seunggyu Kim (Vissel Kobe)","Jo Hyeon-woo (Ulsan HD)","Song Bum-keun (Jeonbuk)"],
    défenseurs:["Kim Min-jae (Bayern Munich)","Kim Young-gwon (Ulsan HD)","Hong Chul (Jeonbuk)","Kim Jin-su (Bordeaux)","Kwon Kyung-won (Galatasaray)","Lee Ki-je (Seongnam)"],
    milieux:["Son Jun-ho (Jeonbuk)","Lee Jae-sung (Mainz)","Jeong Woo-yeong (Freiburg)","Hwang In-beom (Rubin Kazan)","Na Sang-ho (FC Seoul)"],
    attaquants:["Son Heung-min © (Tottenham)","Hwang Hee-chan (Wolverhampton)","Cho Gue-sung (Celta Vigo)","Oh Hyeon-gyu (Celtic)"]
  },
  "Norvège":{
    gardiens:["Ørjan Nyland (Southampton)","Mats Ørn Kristiansen (Brann)","André Hansen (Rosenborg)"],
    défenseurs:["Kristoffer Ajer (Brentford)","Leo Ostigard (Napoli)","Stefan Strandberg (CSKA Moscow)","Birger Meling (Nantes)","Marcus Pedersen (Feyenoord)","Andreas Hanche-Olsen (Mainz)"],
    milieux:["Martin Ødegaard (Arsenal)","Sander Berge (Burnley)","Mathias Normann (Istanbul Başakşehir)","Patrick Berg (Lecce)","Fredrik Aursnes (Benfica)","Morten Thorsby (Genoa)"],
    attaquants:["Erling Haaland © (Man City)","Alexander Sörloth (Atlético Madrid)","Joshua King (Besiktas)","Fredrik Gytkjær (Lech Poznań)"]
  },
  "Suède":{
    gardiens:["Robin Olsen (Aston Villa)","Karl-Johan Johnsson (Club Brugge)","Pontus Dahlberg (Almería)"],
    défenseurs:["Victor Lindelöf (Man Utd)","Ludwig Augustinsson (Villarreal)","Joakim Nilsson (Augsburg)","Carl Starfelt (Southampton)","Emil Krafth (Newcastle)"],
    milieux:["Mattias Svanberg (Wolfsburg)","Viktor Claesson (Krasnodar)","Emil Forsberg (Leipzig)","Jesper Karlsson (AZ Alkmaar)","Albin Ekdal (Sampdoria)"],
    attaquants:["Viktor Gyökeres (Arsenal)","Alexander Isak (Newcastle)","Dejan Kulusevski (Tottenham)","Robin Quaison (Palermo)"]
  },
  "Suisse":{
    gardiens:["Gregor Kobel (Dortmund)","Marvin Keller (Basel)","Yvon Mvogo (Lorient)"],
    défenseurs:["Manuel Akanji (Man City)","Aurele Amenda (Ajax)","Nico Elvedi (Mönchengladbach)","Ricardo Rodriguez (Torino)","Silvan Widmer (Mayence)","Eray Comert (Valencia)"],
    milieux:["Granit Xhaka (Leverkusen)","Michel Aebischer (Bologne)","Remo Freuler (Nottingham Forest)","Denis Zakaria (Lazio)","Fabian Rieder (Rennes)","Ardon Jashari (Club Brugge)","Djibril Sow (Séville)"],
    attaquants:["Breel Embolo (Monaco)","Zeki Amdouni (Burnley)","Dan Ndoye (Bologne)","Noah Okafor (AC Milan)","Cedric Itten (FC Zurich)"]
  },
  "Turquie":{
    gardiens:["Altay Bayındır (Man Utd)","Uğurcan Çakır (Trabzonspor)","Mert Günok (Galatasaray)"],
    défenseurs:["Çağlar Söyüncü (Atlético Madrid)","Merih Demiral (Al-Qadsiah)","Ferdi Kadıoğlu (Brighton)","Zeki Çelik (Roma)","Samet Akaydin (Panathinaikos)","Mert Müldür (Sassuolo)"],
    milieux:["Hakan Çalhanoğlu (Inter Milan)","Okay Yokuşlu (Real Sociedad)","Kaan Ayhan (Galatasaray)","Salih Özcan (Dortmund)","Arda Güler (Real Madrid)","Kerem Aktürkoğlu (Galatasaray)"],
    attaquants:["Baris Yilmaz (Galatasaray)","Cenk Tosun (Beşiktaş)","Umut Nayir (Trabzonspor)","Serdar Dursun (Darmstadt)"]
  },
  "Tunisie":{
    gardiens:["Aymen Dahmen (Stade Rennais)","Bechir Ben Said (Espérance Tunis)","Mouez Hassen (Partizan)"],
    défenseurs:["Montassar Talbi (Lorient)","Ali Maaloul (Al-Ahly)","Nader Ghandri (Marseille)","Dylan Bronn (Burnley)","Haythem Jouini (Espérance)","Bilel Ifa (Espérance)"],
    milieux:["Anis Ben Slimane (Leverkusen)","Ellyes Skhiri (Frankfurt)","Hannibal Mejbri (Sevilla)","Mohamed Ali Ben Romdhane (Stade Rennais)","Ghailene Chaalali (Espérance)"],
    attaquants:["Youssef Msakni (Al-Arabi)","Seifeddine Jaziri (Zamalek)","Issam Jebali (Angers)","Naïm Sliti (Guingamp)"]
  },
  "Écosse":{
    gardiens:["Angus Gunn (Norwich)","Zander Clark (Hearts)","Liam Kelly (Motherwell)"],
    défenseurs:["Jack Hendry (Al-Ettefaq)","Scott McKenna (Nottingham Forest)","Kieran Tierney (Arsenal)","Andy Robertson (Liverpool)","Anthony Ralston (Celtic)","Ryan Porteous (Watford)"],
    milieux:["Scott McTominay (Napoli)","Callum McGregor (Celtic)","Billy Gilmour (Brighton)","John McGinn (Aston Villa)","Ryan Jack (Rangers)","Stuart Armstrong (Southampton)"],
    attaquants:["Che Adams (Torino)","Lawrence Shankland (Hearts)","Lyndon Dykes (QPR)","Ryan Christie (Bournemouth)"]
  },
  "Haïti":{
    gardiens:["Josue Duverger (FC Differdange)","Carlens Arcus (Cavalry FC)","Héry Archange (Litex Lovech)"],
    défenseurs:["Andrew Jean-Baptiste (Charlotte FC)","Steeven Saba (Laval)","Mechack Jérôme (Cavalry FC)","Miguel Kervin (Amiens)","Duckens Nazon (Red Star)"],
    milieux:["Frantzdy Pierrot (Atlanta United)","Derrick Etienne Jr. (Columbus Crew)","Ben Lederman (CD Tenerife)","Al-Hassan Toure (Seattle Sounders)","Pierre-Yves Polomat (Amiens)"],
    attaquants:["Ronaldo Boving (Orlando City)","Kevens Jeanis (Cavalry FC)","Carnejy Antoine (Guingamp)","Dener Momberger (Atlético Grau)"]
  },
  "Bosnie-Herzégovine":{
    gardiens:["Nikola Vasilj (St. Pauli)","Martin Zlomislić (Rijeka)","Osman Hadžikić (Slaven Belupo)"],
    défenseurs:["Sead Kolašinac (Atalanta)","Amar Dedić (Benfica)","Nikola Katić (Schalke)","Tarik Muharemović (Sassuolo)","Stjepan Radeljić (Rijeka)","Nidal Celik (Lens)"],
    milieux:["Amir Hadžiahmetović (Hull City)","Benjamin Tahirović (Brøndby)","Ivan Šunjić (Pafos)","Armin Gigović (Young Boys)","Esmir Bajraktarević (PSV)","Dženis Burnić (Karlsruher SC)"],
    attaquants:["Edin Džeko © (Schalke)","Ermedin Demirović (Stuttgart)","Haris Tabaković (Mönchengladbach)","Samed Baždar (Jagiellonia)"]
  },
  "Qatar":{
    gardiens:["Meshaal Barsham (Al-Sadd)","Yousef Hassan (Al-Duhail)","Mohammed Al-Bakri (Al-Rayyan)"],
    défenseurs:["Pedro Miguel (Al-Duhail)","Abdulkarim Hassan (Al-Gharafa)","Bassam Al-Rawi (Al-Sadd)","Musab Kheder (Al-Ahli)","Homam Ahmed (Al-Wakrah)","Tarek Salman (Al-Wakrah)"],
    milieux:["Akram Afif © (Al-Sadd)","Karim Boudiaf (Al-Duhail)","Ali Asad (Al-Sadd)","Assim Madibo (Al-Duhail)","Salem Al Hajri (Al-Sadd)","Abdelkarim Hassan (Al-Gharafa)"],
    attaquants:["Almoez Ali (Al-Duhail)","Mohammed Muntari (Al-Duhail)","Yousuf Ali Mukhtar (Al-Sadd)","Khalid Muneer (Al-Arabi)"]
  },
  "Arabie Saoudite":{
    gardiens:["Mohammed Al-Owais © (Al-Hilal)","Nawaf Al-Aqidi (Al-Nassar)","Ibrahim Al-Ghanam (Al-Ittihad)"],
    défenseurs:["Ali Al-Bulayhi (Al-Hilal)","Abdulelah Al-Amri (Al-Hilal)","Hassan Al-Tambakti (Al-Hilal)","Mohammed Al-Breik (Al-Qadsiah)","Saud Abdulhamid (Roma)","Sultan Al-Ghannam (Al-Hilal)"],
    milieux:["Nasser Al-Dawsari (Al-Hilal)","Sami Al-Najei (Al-Ittihad)","Mohamed Kanno (Al-Hilal)","Saleh Al-Shehri (Al-Hilal)","Abdulrahman Al-Aboud (Al-Hilal)","Nasser Alotaibi (Al-Hilal)"],
    attaquants:["Firas Al-Buraikan (Al-Qadsiah)","Salem Al-Dawsari (Al-Hilal)","Haitham Asiri (Al-Ahli)","Riyadh Sharahili (Al-Faysaly)"]
  },
  "Iran":{
    gardiens:["Alireza Beiranvand (Tractor)","Seyed Hossein Hosseini (Sepahan)","Payam Niazmand (Persepolis)"],
    défenseurs:["Ehsan Hajsafi © (Sepahan)","Milad Mohammadi (Persepolis)","Hossein Kanaani (Persepolis)","Shoja Khalilzadeh (Tractor)","Ramin Rezaeian (Foolad)","Saleh Hardani (Esteghlal)"],
    milieux:["Saeid Ezatolahi (Shabab Al-Ahli)","Mehdi Ghaedi (Al-Nasr)","Mohammad Mohebi (Rostov)","Mehdi Torabi (Tractor)","Alireza Jahanbakhsh (Dender)","Rouzbeh Cheshmi (Esteghlal)"],
    attaquants:["Mehdi Taremi (Olympiakos)","Ali Alipour (Persepolis)","Dennis Dargahi (Standard Liège)","Amirhossein Hosseinzadeh (Tractor)","Shahriyar Moghanlou (Kalba)"]
  },
  "Égypte":{
    gardiens:["Mohamed El-Shennawy (Al-Ahly)","Mostafa Shobeir (Zamalek)","Ahmed El-Shenawy (Al-Ahly)"],
    défenseurs:["Omar Kamal (Al-Ahly)","Mahmoud Hamdi (Zamalek)","Ahmed Hegazy (Al-Ittihad)","Mohamed Abdel-Shafy (Watford)","Akram Tawfik (Pyramids FC)"],
    milieux:["Mohamed Elneny (Besiktas)","Tarek Hamed (Zamalek)","Mahmoud Trezeguet (Trabzonspor)","Amr El-Solia (Pyramids FC)","Ahmed Sayed Zizo (Zamalek)","Emam Ashour (Al-Ahly)"],
    attaquants:["Mohamed Salah © (Liverpool)","Omar Marmoush (Man City)","Mostafa Mohamed (Galatasaray)","Mahmoud Hassan Trezeguet (Trabzonspor)"]
  },
  "Nouvelle-Zélande":{
    gardiens:["Max Crocombe (Millwall)","Alex Paulsen (Lechia Gdańsk)","Michael Woud (Auckland FC)"],
    défenseurs:["Tim Payne (Wellington Phoenix)","Francis De Vries (Auckland FC)","Tyler Bindon (Nottingham Forest)","Liberato Cacace (Empoli)","Nando Rafael (Auckland FC)"],
    milieux:["Joe Bell (Dynamo Kyiv)","Clayton Lewis (Vancouver Whitecaps)","Matthew Ridenton (Auckland FC)","Louis Fenton (Dundee Utd)"],
    attaquants:["Chris Wood (Nottingham Forest)","Myer Bevan (Auckland FC)","Sarpreet Singh (Jahn Regensburg)","Callan Elliot (Wellington Phoenix)"]
  },
  "Cap-Vert":{
    gardiens:["Vozinha (Celta Vigo)","David Sousa (Académica)","Vítor Semedo (Sporting CP B)"],
    défenseurs:["Stopira (Universitatea Craiova)","Dylan Tavares (Werder Bremen)","Marco Moreno (Granada)","Logan Costa (Toulouse)","Steven Fortes (Eibar)"],
    milieux:["Garry Rodrigues (Gençlerbirliği)","Jamiro Monteiro (CF Montréal)","Ryan Mendes (Independiente)","Enoch Ackah (Silkeborg)","Carlinhos (Moreirense)"],
    attaquants:["Djaniny (Santos Laguna)","Willy Semedo (Servette)","Julio Tavares (Dijon)","Bryan Teixeira (Enschede)"]
  },
  "Curaçao":{
    gardiens:["Eloy Room (Columbus Crew)","Nino Van Duynhoven (FC Den Bosch)","Sven Braken (AZ Alkmaar)"],
    défenseurs:["Cuco Martina (VVV-Venlo)","Gianni Zuiverloon (FC Dordrecht)","Shurno Walter (FC Dordrecht)","Vurnon Anita (Sparta Rotterdam)","Jurien Gaari (Ajax)"],
    milieux:["Leandro Bacuna (Derby County)","Riechedly Bazoer (Utrecht)","Brandley Kuwas (FC Dordrecht)","Sheraldo Becker (Union Berlin)","Jürgen Locadia (Portland Timbers)"],
    attaquants:["Gino van Kessel (Colorado Rapids)","Denzell Doest (Fortuna Sittard)","Quentin Bere (FC Sion)","Cuco Martina (VVV-Venlo)"]
  },
  "Équateur":{
    gardiens:["Hernán Galíndez (Aucas)","Alexander Domínguez (Independiente del Valle)","Pedro Ortíz (Liga de Quito)"],
    défenseurs:["Byron Castillo (Liga de Quito)","Piero Hincapié (Leverkusen)","Robert Arboleda (São Paulo)","Ángelo Preciado (Genk)","Willian Pacho (PSG)","Diego Palacios (Toronto FC)"],
    milieux:["Moisés Caicedo (Chelsea)","Carlos Gruezo (Augsburg)","Ángel Mena (León)","Kevin Rodríguez (Ipswich Town)","Alan Minda (Troyes)"],
    attaquants:["Enner Valencia (Internacional)","Djorkaeff Reasco (Estoril)","Kevin Cabezas (Aucas)","Michael Estrada (Cruz Azul)"]
  },
  "Paraguay":{
    gardiens:["Antony Silva (Olimpia)","Alfredo Aguilar (Olimpia)","Santiago Rojas (Guaraní)"],
    défenseurs:["Junior Alonso (Atletico Mineiro)","Gustavo Velázquez (Huracán)","Santiago Arzamendia (Cádiz)","Omar Alderete (Hertha BSC)","Blas Riveros (Bologne)"],
    milieux:["Gastón Giménez (Vélez Sarsfield)","Mathías Villasanti (Grêmio)","Kaku (New York Red Bulls)","Andrés Cubas (Rayo Vallecano)","Julio Enciso (Brighton)","Ángel Cardozo Lucena (Olimpia)"],
    attaquants:["Almirón (Newcastle)","Antonio Sanabria (Torino)","Álex Arce (Liga de Quito)","Bernardo Cano (Nacional)"]
  },
  "Jordanie":{
    gardiens:["Amer Shafi (Al-Faisaly)","Mahmoud Eid (Al-Wehdat)","Ibrahim Shonnar (Al-Ramtha)"],
    défenseurs:["Baher Abdallah (Al-Wehdat)","Baha' Abdelrahman (Al-Jazira)","Anas Bani-Yaseen (Al-Jazira)","Mohammad Abu Zema (Al-Faisaly)","Tarek Khattab (Al-Wehdat)"],
    milieux:["Yazan Al-Naimat (Anorthosis)","Musa Al-Tamari (Montpellier)","Ahmad Qatato (Hapoel Acre)","Ahmad Fawaz (Al-Jazira)","Hamza Al-Dardour (Denizlispor)"],
    attaquants:["Mousa Al-Tamari (Montpellier)","Bader Ageel (Shabab Al-Ordon)","Khaled Al-Sahawneh (Al-Wahda)","Ali Olwan (Al-Yarmouk)"]
  },
  "Irak":{
    gardiens:["Jalal Hassan (Al-Shorta)","Hamid Nouri (Duhok)","Mohammed Hamid (Al-Quwa)"],
    défenseurs:["Ali Adnan (Al-Riffa)","Ahmed Ibrahim (Al-Shorta)","Mustafa Nadhim (Al-Zawraa)","Mohammed Qasim (Al-Zawraa)","Rebin Sulaka (Duhok)"],
    milieux:["Amjad Attwan (Al-Zawraa)","Hussein Ali (Al-Quwa)","Ali Jasim (Al-Zawraa)","Saad Natiq (Al-Zawraa)","Ahmed Yasin (Al-Talaba)"],
    attaquants:["Aymen Hussein (Al-Shorta)","Mohanad Ali (Al-Quwa Al-Jawiya)","Ibrahim Bayesh (Duhok)","Ahmed Mujahid (Al-Zawraa)"]
  },
  "Ouzbékistan":{
    gardiens:["Ulugbek Rashidov (Pakhtakor)","Jasur Yakhshiboev (Nasaf)","Abdulla Komilov (Lokomotiv Toshkent)"],
    défenseurs:["Sanjar Tursunov (Pakhtakor)","Otabek Shukurov (Pakhtakor)","Khojimat Erkinov (Pakhtakor)","Jamshid Iskanderov (Pakhtakor)","Bobur Abdixoliqov (Pakhtakor)"],
    milieux:["Jaloliddin Masharipov (Pakhtakor)","Otabek Fayzullaev (Red Star Belgrade)","Alijon Ibragimov (Pakhtakor)","Doniyor Ergashev (Pakhtakor)","Eldor Shomurodov (Roma)"],
    attaquants:["Dostonbek Khamdamov (Pakhtakor)","Khojiakbar Alijonov (Pakhtakor)","Mirzo Yunusov (Pakhtakor)","Muzaffar Nuriddinov (Pakhtakor)"]
  },
  "RD Congo":{
    gardiens:["Joël Kiassumbua (Charleroi)","Lionel Mpasi (AS FAR)","Dimitri Lavalée (Eupen)"],
    défenseurs:["Arthur Masuaku (Besiktas)","Chancel Mbemba (Marseille)","Marcel Tisserand (Fenerbahce)","Christ Malonga (Toulouse)","Nathan Lukoki (Kortrijk)"],
    milieux:["Yannick Carrasco (Al-Qadsiah)","Nicolas Ngamaleu (Young Boys)","Jean-Marc Makusu (Anderlecht)","Meschack Elia (Young Boys)","Samuel Bastien (Standard Liège)","Gaël Kakuta (Amiens)"],
    attaquants:["Dodi Lukebakio (Séville)","Paul-Jose Mpoku (Standard Liège)","Silas Wissa (Brentford)","Cédric Bakambu (Al-Qadsiah)"]
  },
  "Ghana":{
    gardiens:["Lawrence Ati-Zigi (St. Gallen)","Jojo Wollacott (Charlton Athletic)","Ibrahim Danlad (Asante Kotoko)"],
    défenseurs:["Tariq Lamptey (Brighton)","Daniel Amartey (Besiktas)","Alexander Djiku (Fenerbahce)","Abdul Rahman Baba (Reading)","Denis Odoi (Club Brugge)","Gideon Mensah (Auxerre)"],
    milieux:["Thomas Partey (Arsenal)","Mohammed Kudus (West Ham)","Daniel-Kofi Kyereh (Freiburg)","Elisha Owusu (Gent)","Edmund Addo (FK Sheriff)"],
    attaquants:["Jordan Ayew (Crystal Palace)","Antoine Semenyo (Bournemouth)","Osman Bukari (Red Star Belgrade)","Inaki Williams (Athletic Club)"]
  },
  "Panama":{
    gardiens:["Luis Mejía (Montpellier)","Orlando Mosquera (Dep. Cali)","Abdiel Arroyo (Olimpia)"],
    défenseurs:["Eric Davis (HNK Gorica)","Fidel Escobar (New York Red Bulls)","Roderick Miller (Vitoria Setubal)","Harold Cummings (Santos Laguna)","Michael Murillo (Anderlecht)"],
    milieux:["Adalberto Carrasquilla (Utah Royals)","Anibal Godoy (Nashville SC)","José Fajardo (Philadelphia Union)","Rolando Blackburn (Olimpia)","César Yanis (Columbus Crew)"],
    attaquants:["Ismael Díaz (Lyon)","Ronaldo Walker (Mazatlán)","Cecilio Waterman (Millonarios)","Gabriel Torres (Puebla)"]
  },
  "Afrique du Sud":{
    gardiens:["Ronwen Williams (Mamelodi Sundowns)","Veli Mothwa (AmaZulu)","Bruce Bvuma (Kaizer Chiefs)"],
    défenseurs:["Siyanda Xulu (Slavia Praha)","Rushine De Reuck (Mamelodi Sundowns)","Innocent Maela (Orlando Pirates)","Lyle Lakay (Mamelodi Sundowns)","Terrence Mashego (Cape Town City)","Bongani Zungu (Mamelodi Sundowns)"],
    milieux:["Oswin Appollis (Mamelodi Sundowns)","Thalente Mbatha (Orlando Pirates)","Relebohile Mofokeng (Orlando Pirates)","Jayden Adams (Mamelodi Sundowns)","Teboho Mokoena (Mamelodi Sundowns)","Themba Zwane (Mamelodi Sundowns)"],
    attaquants:["Evidence Makgopa (Orlando Pirates)","Lyle Foster (Burnley)","Iqraam Rayners (Mamelodi Sundowns)","Percy Tau (Al-Ahly)"]
  },
  "République tchèque":{
    gardiens:["Jiří Pavlenka (Werder Bremen)","Matěj Kovář (PSV)","Tomáš Vaclík (Olympiakos)"],
    défenseurs:["Jan Bořil (Slavia Praha)","Vladimír Coufal (West Ham)","David Zima (Torino)","Jakub Brabec (Plzeň)","Ladislav Krejčí (Arsenal)"],
    milieux:["Tomáš Souček (West Ham)","Alex Král (Schalke)","Lukáš Provod (Slavia Praha)","Jakub Jankto (Sparta Praha)","Martin Vitík (Sparta Praha)","Jan Kuchta (Slavia Praha)"],
    attaquants:["Patrik Schick (Leverkusen)","Mojmír Chytil (Freiburg)","Adam Hložek (Leverkusen)","Ondřej Lingr (Freiburg)"]
  },
  "Autriche":{
    gardiens:["Alexander Schlager (RB Salzburg)","Patrick Pentz (Brøndby)","Florian Wiegele (Plzeň)"],
    défenseurs:["David Alaba (Real Madrid)","Kevin Danso (Tottenham)","Marco Friedl (Werder Bremen)","Philipp Lienhart (Freiburg)","Stefan Posch (Mainz)","Alexander Prass (Hoffenheim)","Michael Svoboda (Venezia)"],
    milieux:["Christoph Baumgartner (Leipzig)","Konrad Laimer (Bayern Munich)","Marcel Sabitzer (Dortmund)","Xaver Schlager (Leipzig)","Romano Schmid (Werder Bremen)","Nicolas Seiwald (Leipzig)","Patrick Wimmer (Wolfsburg)"],
    attaquants:["Marko Arnautović (Red Star)","Michael Gregoritsch (Augsburg)","Saša Kalajdžić (LASK)","Andreas Weimann (West Brom)"]
  },
  "Côte d'Ivoire":{
    gardiens:["Badra Ali Sangaré (Wydad Casablanca)","Eliezer Koffi (Fulham)","Yahia Fofana (Leicester City)"],
    défenseurs:["Serge Aurier (Villarreal)","Evan Ndicka (Roma)","Odilon Kossounou (Leverkusen)","Wilfried Singo (Monaco)","Ghislain Konan (Reims)","Emmanuel Agbadou (Wolverhampton)"],
    milieux:["Franck Kessié (Al-Ahli)","Jean-Philippe Gbamin (PAOK)","Ibrahim Sangaré (Nottingham Forest)","Seko Fofana (Al-Nassr)","Emerse Faé (Crystal Palace)","Pape Gueye (Villarreal)"],
    attaquants:["Sébastien Haller (Dortmund)","Nicolas Pépé (Trabzonspor)","Simon Adingra (Brighton)","Oumar Diakité (Clermont Foot)","Didier Drogba Jr (LB Châteauroux)"]
  },
};

const M6 = new Set(["a1","a2","a3","a4","b1","b4","c1","c3","d1","d3","e1","e3","f1","f5","g1","g3","h1","h2","h3","h5","i1","i2","i3","i4","i5","i6","j1","j5","k1","k3","k5","l1","l3","l5"]);

const WIN = {
  "France":13.5,"Espagne":12,"Brésil":11.5,"Argentine":11,"Angleterre":9.5,"Allemagne":8.5,
  "Portugal":7,"Pays-Bas":5.5,"Belgique":4,"Uruguay":2.5,"Croatie":2,"Colombie":1.8,
  "États-Unis":1.5,"Mexique":1.2,"Maroc":1,"Japon":0.9,"Corée du Sud":0.8,"Suisse":0.8,
  "Autriche":0.7,"Équateur":0.6,"Sénégal":0.6,"Suède":0.5,"Algérie":0.4,
  "République tchèque":0.4,"Australie":0.3,"Turquie":0.3,"Norvège":0.3,"Iran":0.2,
  "Tunisie":0.2,"Égypte":0.15,"Ghana":0.15,"Écosse":0.12,"Côte d'Ivoire":0.12,
  "Paraguay":0.1,"RD Congo":0.1,"Canada":0.1,"Arabie Saoudite":0.08,"Ouzbékistan":0.06,
  "Qatar":0.05,"Jordanie":0.05,"Cap-Vert":0.04,"Panama":0.04,"Haïti":0.03,
  "Irak":0.03,"Nouvelle-Zélande":0.03,"Bosnie-Herzégovine":0.05,"Curaçao":0.02,"Afrique du Sud":0.04
};

const FIXTURES_INIT = [
  {id:"a1",date:"2026-06-11",time:"21:00",homeTeam:"Mexique",awayTeam:"Afrique du Sud",group:"A",venue:"Estadio Azteca, Mexico City",homeScore:2,awayScore:0,status:"FT"},
  {id:"a2",date:"2026-06-12",time:"04:00",homeTeam:"Corée du Sud",awayTeam:"République tchèque",group:"A",venue:"Estadio Akron, Guadalajara",homeScore:2,awayScore:1,status:"FT"},
  {id:"a3",date:"2026-06-19",time:"21:00",homeTeam:"Mexique",awayTeam:"Corée du Sud",group:"A",venue:"Estadio Akron, Guadalajara",homeScore:null,awayScore:null,status:null},
  {id:"a4",date:"2026-06-20",time:"00:00",homeTeam:"Afrique du Sud",awayTeam:"République tchèque",group:"A",venue:"Mercedes-Benz Stadium, Atlanta",homeScore:null,awayScore:null,status:null},
  {id:"a5",date:"2026-06-25",time:"00:00",homeTeam:"Mexique",awayTeam:"République tchèque",group:"A",venue:"Estadio Akron, Guadalajara",homeScore:null,awayScore:null,status:null},
  {id:"a6",date:"2026-06-25",time:"00:00",homeTeam:"Corée du Sud",awayTeam:"Afrique du Sud",group:"A",venue:"Mercedes-Benz Stadium, Atlanta",homeScore:null,awayScore:null,status:null},
  {id:"b1",date:"2026-06-12",time:"21:00",homeTeam:"Canada",awayTeam:"Bosnie-Herzégovine",group:"B",venue:"BMO Field, Toronto",homeScore:null,awayScore:null,status:null},
  {id:"b2",date:"2026-06-13",time:"02:00",homeTeam:"Qatar",awayTeam:"Suisse",group:"B",venue:"Levi's Stadium, Santa Clara",homeScore:null,awayScore:null,status:null},
  {id:"b3",date:"2026-06-19",time:"21:00",homeTeam:"Suisse",awayTeam:"Bosnie-Herzégovine",group:"B",venue:"SoFi Stadium, Los Angeles",homeScore:null,awayScore:null,status:null},
  {id:"b4",date:"2026-06-20",time:"03:00",homeTeam:"Canada",awayTeam:"Qatar",group:"B",venue:"BC Place, Vancouver",homeScore:null,awayScore:null,status:null},
  {id:"b5",date:"2026-06-26",time:"00:00",homeTeam:"Canada",awayTeam:"Suisse",group:"B",venue:"BC Place, Vancouver",homeScore:null,awayScore:null,status:null},
  {id:"b6",date:"2026-06-26",time:"00:00",homeTeam:"Bosnie-Herzégovine",awayTeam:"Qatar",group:"B",venue:"BMO Field, Toronto",homeScore:null,awayScore:null,status:null},
  {id:"c1",date:"2026-06-14",time:"01:00",homeTeam:"Brésil",awayTeam:"Maroc",group:"C",venue:"MetLife Stadium, New York",homeScore:null,awayScore:null,status:null},
  {id:"c2",date:"2026-06-14",time:"04:00",homeTeam:"Haïti",awayTeam:"Écosse",group:"C",venue:"Estadio BBVA, Monterrey",homeScore:null,awayScore:null,status:null},
  {id:"c3",date:"2026-06-20",time:"21:00",homeTeam:"Brésil",awayTeam:"Écosse",group:"C",venue:"AT&T Stadium, Dallas",homeScore:null,awayScore:null,status:null},
  {id:"c4",date:"2026-06-21",time:"00:00",homeTeam:"Maroc",awayTeam:"Haïti",group:"C",venue:"Hard Rock Stadium, Miami",homeScore:null,awayScore:null,status:null},
  {id:"c5",date:"2026-06-27",time:"00:00",homeTeam:"Brésil",awayTeam:"Haïti",group:"C",venue:"SoFi Stadium, Los Angeles",homeScore:null,awayScore:null,status:null},
  {id:"c6",date:"2026-06-27",time:"00:00",homeTeam:"Écosse",awayTeam:"Maroc",group:"C",venue:"Gillette Stadium, Boston",homeScore:null,awayScore:null,status:null},
  {id:"d1",date:"2026-06-13",time:"04:00",homeTeam:"États-Unis",awayTeam:"Paraguay",group:"D",venue:"SoFi Stadium, Los Angeles",homeScore:null,awayScore:null,status:null},
  {id:"d2",date:"2026-06-13",time:"07:00",homeTeam:"Australie",awayTeam:"Turquie",group:"D",venue:"BC Place, Vancouver",homeScore:null,awayScore:null,status:null},
  {id:"d3",date:"2026-06-20",time:"01:00",homeTeam:"États-Unis",awayTeam:"Turquie",group:"D",venue:"Levi's Stadium, Santa Clara",homeScore:null,awayScore:null,status:null},
  {id:"d4",date:"2026-06-21",time:"21:00",homeTeam:"Paraguay",awayTeam:"Australie",group:"D",venue:"Arrowhead Stadium, Kansas City",homeScore:null,awayScore:null,status:null},
  {id:"d5",date:"2026-06-26",time:"00:00",homeTeam:"États-Unis",awayTeam:"Australie",group:"D",venue:"AT&T Stadium, Dallas",homeScore:null,awayScore:null,status:null},
  {id:"d6",date:"2026-06-26",time:"00:00",homeTeam:"Turquie",awayTeam:"Paraguay",group:"D",venue:"Lincoln Financial Field, Philadelphia",homeScore:null,awayScore:null,status:null},
  {id:"e1",date:"2026-06-14",time:"18:00",homeTeam:"Allemagne",awayTeam:"Curaçao",group:"E",venue:"Hard Rock Stadium, Miami",homeScore:null,awayScore:null,status:null},
  {id:"e2",date:"2026-06-15",time:"01:00",homeTeam:"Côte d'Ivoire",awayTeam:"Équateur",group:"E",venue:"Arrowhead Stadium, Kansas City",homeScore:null,awayScore:null,status:null},
  {id:"e3",date:"2026-06-21",time:"21:00",homeTeam:"Allemagne",awayTeam:"Équateur",group:"E",venue:"Lincoln Financial Field, Philadelphia",homeScore:null,awayScore:null,status:null},
  {id:"e4",date:"2026-06-22",time:"00:00",homeTeam:"Curaçao",awayTeam:"Côte d'Ivoire",group:"E",venue:"AT&T Stadium, Dallas",homeScore:null,awayScore:null,status:null},
  {id:"e5",date:"2026-06-27",time:"00:00",homeTeam:"Allemagne",awayTeam:"Côte d'Ivoire",group:"E",venue:"Levi's Stadium, Santa Clara",homeScore:null,awayScore:null,status:null},
  {id:"e6",date:"2026-06-27",time:"00:00",homeTeam:"Équateur",awayTeam:"Curaçao",group:"E",venue:"Gillette Stadium, Boston",homeScore:null,awayScore:null,status:null},
  {id:"f1",date:"2026-06-14",time:"21:00",homeTeam:"Pays-Bas",awayTeam:"Japon",group:"F",venue:"Lincoln Financial Field, Philadelphia",homeScore:null,awayScore:null,status:null},
  {id:"f2",date:"2026-06-15",time:"18:00",homeTeam:"Suède",awayTeam:"Tunisie",group:"F",venue:"SoFi Stadium, Los Angeles",homeScore:null,awayScore:null,status:null},
  {id:"f3",date:"2026-06-21",time:"21:00",homeTeam:"Pays-Bas",awayTeam:"Tunisie",group:"F",venue:"BC Place, Vancouver",homeScore:null,awayScore:null,status:null},
  {id:"f4",date:"2026-06-22",time:"00:00",homeTeam:"Japon",awayTeam:"Suède",group:"F",venue:"Lumen Field, Seattle",homeScore:null,awayScore:null,status:null},
  {id:"f5",date:"2026-06-27",time:"21:00",homeTeam:"Pays-Bas",awayTeam:"Suède",group:"F",venue:"MetLife Stadium, New York",homeScore:null,awayScore:null,status:null},
  {id:"f6",date:"2026-06-28",time:"00:00",homeTeam:"Tunisie",awayTeam:"Japon",group:"F",venue:"Hard Rock Stadium, Miami",homeScore:null,awayScore:null,status:null},
  {id:"g1",date:"2026-06-15",time:"21:00",homeTeam:"Belgique",awayTeam:"Égypte",group:"G",venue:"Lumen Field, Seattle",homeScore:null,awayScore:null,status:null},
  {id:"g2",date:"2026-06-16",time:"03:00",homeTeam:"Iran",awayTeam:"Nouvelle-Zélande",group:"G",venue:"SoFi Stadium, Los Angeles",homeScore:null,awayScore:null,status:null},
  {id:"g3",date:"2026-06-22",time:"21:00",homeTeam:"Belgique",awayTeam:"Nouvelle-Zélande",group:"G",venue:"Arrowhead Stadium, Kansas City",homeScore:null,awayScore:null,status:null},
  {id:"g4",date:"2026-06-23",time:"00:00",homeTeam:"Égypte",awayTeam:"Iran",group:"G",venue:"AT&T Stadium, Dallas",homeScore:null,awayScore:null,status:null},
  {id:"g5",date:"2026-06-27",time:"21:00",homeTeam:"Belgique",awayTeam:"Iran",group:"G",venue:"Lincoln Financial Field, Philadelphia",homeScore:null,awayScore:null,status:null},
  {id:"g6",date:"2026-06-28",time:"00:00",homeTeam:"Nouvelle-Zélande",awayTeam:"Égypte",group:"G",venue:"Levi's Stadium, Santa Clara",homeScore:null,awayScore:null,status:null},
  {id:"h1",date:"2026-06-15",time:"18:00",homeTeam:"Espagne",awayTeam:"Cap-Vert",group:"H",venue:"Mercedes-Benz Stadium, Atlanta",homeScore:null,awayScore:null,status:null},
  {id:"h2",date:"2026-06-16",time:"00:00",homeTeam:"Arabie Saoudite",awayTeam:"Uruguay",group:"H",venue:"Hard Rock Stadium, Miami",homeScore:null,awayScore:null,status:null},
  {id:"h3",date:"2026-06-22",time:"18:00",homeTeam:"Espagne",awayTeam:"Arabie Saoudite",group:"H",venue:"Mercedes-Benz Stadium, Atlanta",homeScore:null,awayScore:null,status:null},
  {id:"h4",date:"2026-06-23",time:"01:00",homeTeam:"Cap-Vert",awayTeam:"Uruguay",group:"H",venue:"Estadio Akron, Guadalajara",homeScore:null,awayScore:null,status:null},
  {id:"h5",date:"2026-06-27",time:"21:00",homeTeam:"Espagne",awayTeam:"Uruguay",group:"H",venue:"Estadio Akron, Guadalajara",homeScore:null,awayScore:null,status:null},
  {id:"h6",date:"2026-06-28",time:"00:00",homeTeam:"Cap-Vert",awayTeam:"Arabie Saoudite",group:"H",venue:"Mercedes-Benz Stadium, Atlanta",homeScore:null,awayScore:null,status:null},
  {id:"i1",date:"2026-06-16",time:"21:00",homeTeam:"France",awayTeam:"Sénégal",group:"I",venue:"MetLife Stadium, New York",homeScore:null,awayScore:null,status:null},
  {id:"i2",date:"2026-06-17",time:"00:00",homeTeam:"Irak",awayTeam:"Norvège",group:"I",venue:"Gillette Stadium, Boston",homeScore:null,awayScore:null,status:null},
  {id:"i3",date:"2026-06-23",time:"00:00",homeTeam:"France",awayTeam:"Irak",group:"I",venue:"Lincoln Financial Field, Philadelphia",homeScore:null,awayScore:null,status:null},
  {id:"i4",date:"2026-06-22",time:"21:00",homeTeam:"Sénégal",awayTeam:"Norvège",group:"I",venue:"Gillette Stadium, Boston",homeScore:null,awayScore:null,status:null},
  {id:"i5",date:"2026-06-27",time:"21:00",homeTeam:"France",awayTeam:"Norvège",group:"I",venue:"Gillette Stadium, Boston",homeScore:null,awayScore:null,status:null},
  {id:"i6",date:"2026-06-27",time:"21:00",homeTeam:"Sénégal",awayTeam:"Irak",group:"I",venue:"MetLife Stadium, New York",homeScore:null,awayScore:null,status:null},
  {id:"j1",date:"2026-06-17",time:"03:00",homeTeam:"Argentine",awayTeam:"Algérie",group:"J",venue:"Arrowhead Stadium, Kansas City",homeScore:null,awayScore:null,status:null},
  {id:"j2",date:"2026-06-17",time:"21:00",homeTeam:"Autriche",awayTeam:"Jordanie",group:"J",venue:"AT&T Stadium, Dallas",homeScore:null,awayScore:null,status:null},
  {id:"j3",date:"2026-06-23",time:"21:00",homeTeam:"Argentine",awayTeam:"Jordanie",group:"J",venue:"AT&T Stadium, Dallas",homeScore:null,awayScore:null,status:null},
  {id:"j4",date:"2026-06-24",time:"00:00",homeTeam:"Algérie",awayTeam:"Autriche",group:"J",venue:"Arrowhead Stadium, Kansas City",homeScore:null,awayScore:null,status:null},
  {id:"j5",date:"2026-06-27",time:"21:00",homeTeam:"Argentine",awayTeam:"Autriche",group:"J",venue:"SoFi Stadium, Los Angeles",homeScore:null,awayScore:null,status:null},
  {id:"j6",date:"2026-06-28",time:"00:00",homeTeam:"Jordanie",awayTeam:"Algérie",group:"J",venue:"Levi's Stadium, Santa Clara",homeScore:null,awayScore:null,status:null},
  {id:"k1",date:"2026-06-17",time:"19:00",homeTeam:"Portugal",awayTeam:"RD Congo",group:"K",venue:"NRG Stadium, Houston",homeScore:null,awayScore:null,status:null},
  {id:"k2",date:"2026-06-18",time:"04:00",homeTeam:"Ouzbékistan",awayTeam:"Colombie",group:"K",venue:"Estadio Azteca, Mexico City",homeScore:null,awayScore:null,status:null},
  {id:"k3",date:"2026-06-23",time:"21:00",homeTeam:"Portugal",awayTeam:"Colombie",group:"K",venue:"Hard Rock Stadium, Miami",homeScore:null,awayScore:null,status:null},
  {id:"k4",date:"2026-06-24",time:"00:00",homeTeam:"RD Congo",awayTeam:"Ouzbékistan",group:"K",venue:"NRG Stadium, Houston",homeScore:null,awayScore:null,status:null},
  {id:"k5",date:"2026-06-27",time:"21:00",homeTeam:"Portugal",awayTeam:"Ouzbékistan",group:"K",venue:"Lumen Field, Seattle",homeScore:null,awayScore:null,status:null},
  {id:"k6",date:"2026-06-28",time:"00:00",homeTeam:"Colombie",awayTeam:"RD Congo",group:"K",venue:"BC Place, Vancouver",homeScore:null,awayScore:null,status:null},
  {id:"l1",date:"2026-06-17",time:"21:00",homeTeam:"Angleterre",awayTeam:"Croatie",group:"L",venue:"AT&T Stadium, Dallas",homeScore:null,awayScore:null,status:null},
  {id:"l2",date:"2026-06-18",time:"00:00",homeTeam:"Ghana",awayTeam:"Panama",group:"L",venue:"BMO Field, Toronto",homeScore:null,awayScore:null,status:null},
  {id:"l3",date:"2026-06-23",time:"21:00",homeTeam:"Angleterre",awayTeam:"Ghana",group:"L",venue:"Gillette Stadium, Boston",homeScore:null,awayScore:null,status:null},
  {id:"l4",date:"2026-06-24",time:"00:00",homeTeam:"Croatie",awayTeam:"Panama",group:"L",venue:"Lincoln Financial Field, Philadelphia",homeScore:null,awayScore:null,status:null},
  {id:"l5",date:"2026-06-27",time:"21:00",homeTeam:"Angleterre",awayTeam:"Panama",group:"L",venue:"MetLife Stadium, New York",homeScore:null,awayScore:null,status:null},
  {id:"l6",date:"2026-06-28",time:"00:00",homeTeam:"Croatie",awayTeam:"Ghana",group:"L",venue:"BMO Field, Toronto",homeScore:null,awayScore:null,status:null}
];

function getProbs(h,a){
  const hv=WIN[h]||1,av=WIN[a]||1,t=hv+av;
  const hw=Math.round((hv/t)*60+10),aw=Math.round((av/t)*60+10);
  return{home:hw,draw:Math.max(100-hw-aw,5),away:aw};
}
function getStandings(gid,fixtures){
  const s={};
  GROUPS[gid].forEach(t=>{s[t]={pts:0,j:0,gf:0,ga:0,g:0,n:0,p:0};});
  fixtures.filter(m=>m.group===gid&&m.homeScore!==null).forEach(m=>{
    const h=s[m.homeTeam],a=s[m.awayTeam];if(!h||!a)return;
    h.j++;a.j++;h.gf+=m.homeScore;h.ga+=m.awayScore;a.gf+=m.awayScore;a.ga+=m.homeScore;
    if(m.homeScore>m.awayScore){h.g++;h.pts+=3;a.p++;}
    else if(m.homeScore===m.awayScore){h.n++;a.n++;h.pts++;a.pts++;}
    else{a.g++;a.pts+=3;h.p++;}
  });
  return Object.entries(s).map(([team,st])=>({team,...st,diff:st.gf-st.ga})).sort((a,b)=>b.pts-a.pts||b.diff-a.diff||b.gf-a.gf);
}
function isGroupComplete(gid,fixtures){
  return fixtures.filter(m=>m.group===gid).every(m=>m.homeScore!==null);
}

// ─── LOADING ─────────────────────────────────────────────────────────────────
function Loading({onDone}){
  const[p,setP]=useState(0);
  useEffect(()=>{
    let v=0;const iv=setInterval(()=>{v+=Math.random()*12;if(v>=100){v=100;clearInterval(iv);setTimeout(onDone,350);}setP(v);},100);
    return()=>clearInterval(iv);
  },[]);
  return(
    <div style={{position:"fixed",inset:0,background:"#050a14",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:28,zIndex:9999}}>
      <div style={{position:"relative",width:90,height:90}}>
        <svg viewBox="0 0 90 90" style={{position:"absolute",inset:0,animation:"spin 3s linear infinite"}}>
          <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(99,179,237,0.12)" strokeWidth="5"/>
          <circle cx="45" cy="45" r="38" fill="none" stroke="#63b3ed" strokeWidth="5"
            strokeDasharray="239" strokeDashoffset={239-(239*p/100)} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.1s"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>⚽</div>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:26,fontWeight:900,background:"linear-gradient(135deg,#63b3ed,#90cdf4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>COUPE DU MONDE FIFA</div>
        <div style={{fontSize:13,color:"#4fc3f7",letterSpacing:5,marginTop:4}}>2026</div>
        <div style={{marginTop:12,color:"#374151",fontSize:12}}>Chargement des données…</div>
        <div style={{marginTop:10,width:180,height:3,background:"rgba(99,179,237,0.08)",borderRadius:2,overflow:"hidden",margin:"10px auto 0"}}>
          <div style={{height:"100%",background:"#63b3ed",width:`${p}%`,transition:"width 0.1s"}}/>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

// ─── MATCH CARD ───────────────────────────────────────────────────────────────
function MatchCard({match,onClick}){
  const[hov,setHov]=useState(false);
  const p=getProbs(match.homeTeam,match.awayTeam);
  const d=new Date(match.date+"T12:00:00");
  const ds=d.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});
  const hasSc=match.homeScore!==null;
  const isLive=["1H","2H","HT","ET"].includes(match.status);
  const isDone=["FT","AET","PEN"].includes(match.status);
  const onM6=M6.has(match.id);
  const base={background:isLive?"rgba(239,68,68,0.06)":"#0a111e",border:`1px solid ${isLive?"rgba(239,68,68,0.28)":"rgba(99,179,237,0.1)"}`,borderRadius:14,padding:"16px 18px",marginBottom:10,cursor:"pointer",transition:"all .15s"};
  const style=hov?{...base,transform:"translateY(-2px)",boxShadow:"0 8px 28px rgba(0,0,0,0.4)",borderColor:"rgba(99,179,237,0.3)"}:base;
  return(
    <div style={style} onClick={()=>onClick(match)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:12,color:"#6b7280",fontWeight:500}}>{ds} · {match.time} · Gr.{match.group}</span>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {isLive&&<div style={{display:"flex",alignItems:"center",gap:4,color:"#ef4444",fontSize:11,fontWeight:700}}><span style={{width:7,height:7,borderRadius:"50%",background:"#ef4444",animation:"pulse 1s infinite",display:"block"}}/>LIVE</div>}
          {isDone&&<span style={{color:"#374151",fontSize:11,fontWeight:600}}>TERMINÉ</span>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Flag country={match.homeTeam} size={26}/>
          <span style={{fontWeight:700,color:"#e2e8f0",fontSize:15}}>{match.homeTeam}</span>
        </div>
        <div style={{textAlign:"center",minWidth:70}}>
          {hasSc?<span style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:-1}}>{match.homeScore} - {match.awayScore}</span>
            :<span style={{fontSize:13,color:"#4b5563",background:"rgba(99,179,237,0.06)",padding:"4px 10px",borderRadius:7}}>vs</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"flex-end"}}>
          <span style={{fontWeight:700,color:"#e2e8f0",fontSize:15,textAlign:"right"}}>{match.awayTeam}</span>
          <Flag country={match.awayTeam} size={26}/>
        </div>
      </div>
      <div style={{display:"flex",borderRadius:4,overflow:"hidden",height:4,marginTop:12}}>
        <div style={{flex:p.home,background:"#3b82f6"}}/><div style={{flex:p.draw,background:"#1e293b"}}/><div style={{flex:p.away,background:"#f59e0b"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:3,fontSize:11}}>
        <span style={{color:"#60a5fa"}}>{p.home}%</span><span style={{color:"#6b7280"}}>Nul {p.draw}%</span><span style={{color:"#fbbf24"}}>{p.away}%</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
        <span style={{fontSize:11,color:"#374151",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📍 {match.venue}</span>
        <div style={{display:"flex",gap:4,flexShrink:0,marginLeft:8}}>
          {onM6&&<span style={{background:"rgba(249,115,22,0.14)",border:"1px solid rgba(249,115,22,0.35)",color:"#fb923c",padding:"2px 7px",borderRadius:4,fontSize:10,fontWeight:700}}>M6</span>}
          <span style={{background:"rgba(99,179,237,0.08)",border:"1px solid rgba(99,179,237,0.25)",color:"#63b3ed",padding:"2px 7px",borderRadius:4,fontSize:10,fontWeight:700}}>beIN</span>
        </div>
      </div>
    </div>
  );
}

// ─── BRACKET MATCH ───────────────────────────────────────────────────────────
function BracketMatch({t1,t2,hs,as:as_,st,label,date,onM6:onM6_}){
  const tbd1=!t1,tbd2=!t2;
  const hasSc=hs!==null&&hs!==undefined;
  const w1=hasSc&&hs>as_,w2=hasSc&&as_>hs;
  const p=(!tbd1&&!tbd2)?getProbs(t1,t2):null;
  const both=!tbd1&&!tbd2;
  return(
    <div style={{background:both?"#0a111e":"rgba(9,16,28,0.5)",border:`1px ${both?"solid":"dashed"} rgba(99,179,237,${both?0.12:0.08})`,borderRadius:12,padding:"14px 16px"}}>
      {label&&<div style={{fontSize:11,color:"#63b3ed",fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>{label}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {[{team:t1,score:hs,tbd:tbd1,winner:w1},{team:t2,score:as_,tbd:tbd2,winner:w2}].map((side,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 9px",borderRadius:7,background:side.winner?"rgba(99,179,237,0.08)":"transparent"}}>
            {side.tbd?<span style={{width:26,height:17,background:"#1e293b",borderRadius:3,display:"inline-block",flexShrink:0}}/>:<Flag country={side.team} size={26}/>}
            <span style={{flex:1,fontSize:14,fontWeight:600,color:side.tbd?"#4b5563":"#e2e8f0",fontStyle:side.tbd?"italic":"normal"}}>{side.team||"À déterminer"}</span>
            {hasSc&&<span style={{fontSize:16,fontWeight:800,color:"#fff"}}>{side.score}</span>}
          </div>
        ))}
      </div>
      {p&&!hasSc&&(
        <div style={{marginTop:8}}>
          <div style={{display:"flex",borderRadius:3,overflow:"hidden",height:4}}>
            <div style={{flex:p.home,background:"#3b82f6"}}/><div style={{flex:p.draw,background:"#1e293b"}}/><div style={{flex:p.away,background:"#f59e0b"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginTop:3}}>
            <span style={{color:"#60a5fa"}}>{p.home}%</span><span style={{color:"#6b7280"}}>Nul {p.draw}%</span><span style={{color:"#fbbf24"}}>{p.away}%</span>
          </div>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:9}}>
        <span style={{fontSize:11,color:"#374151"}}>{date||""}</span>
        <div style={{display:"flex",gap:4}}>
          {onM6_&&<span style={{background:"rgba(249,115,22,0.14)",border:"1px solid rgba(249,115,22,0.35)",color:"#fb923c",padding:"2px 7px",borderRadius:4,fontSize:10,fontWeight:700}}>M6</span>}
          <span style={{background:"rgba(99,179,237,0.08)",border:"1px solid rgba(99,179,237,0.25)",color:"#63b3ed",padding:"2px 7px",borderRadius:4,fontSize:10,fontWeight:700}}>beIN</span>
        </div>
      </div>
    </div>
  );
}

// ─── LIVE MODAL ───────────────────────────────────────────────────────────────
function LiveModal({match,onClose}){
  const[fd,setFd]=useState(null);
  const[loading,setLoading]=useState(true);
  const ivRef=useRef(null);
    const load=useCallback(async()=>{
    if(!match)return;
    try{
      const mid=match.apiMatchId||null;
      if(!mid){
        // Pas encore synchronisé — essayer de récupérer via /api/matches?type=all
        const r=await fetch("/api/matches?type=all");
        if(r.ok){
          const j=await r.json();
          const found=(j.matches||[]).find(m=>{
            const hFr=EN_TO_FR[m.homeTeam?.name]||m.homeTeam?.name;
            return hFr===match.homeTeam;
          });
          if(found){
            // Mettre à jour le match avec l'ID trouvé et réessayer
            match={...match,apiMatchId:found.id};
          }
        }
      }
      const mid2=match.apiMatchId||null;
      if(mid2){
        const r=await fetch(`/api/matches?type=match&fixtureId=${mid2}`);
        if(!r.ok)throw new Error("match proxy "+r.status);
        const j=await r.json();

        // ─── Score depuis cet appel (au cas où pas encore dans fixtures) ───
        const ft=j.score?.fullTime;
        const hs=(ft?.home!==null&&ft?.home!==undefined)?ft.home:null;
        const as_=(ft?.away!==null&&ft?.away!==undefined)?ft.away:null;

        // ─── Événements ────────────────────────────────────────────────────
        const events=[];
        (j.goals||[]).forEach(g=>{
          events.push({
            time:{elapsed:g.minute},
            type:"Goal",
            player:{name:g.scorer?.name||g.scorer?.shortName||"?"},
            team:{name:EN_TO_FR[g.team?.name]||g.team?.name}
          });
        });
        (j.bookings||[]).forEach(b=>{
          events.push({
            time:{elapsed:b.minute},
            type:"Card",
            detail:b.card==="YELLOW_CARD"?"Yellow Card":"Red Card",
            player:{name:b.player?.name||b.player?.shortName||"?"},
            team:{name:EN_TO_FR[b.team?.name]||b.team?.name}
          });
        });
        (j.substitutions||[]).forEach(s=>{
          events.push({
            time:{elapsed:s.minute},
            type:"subst",
            player:{name:s.playerIn?.name||s.playerIn?.shortName||"?"},
            team:{name:EN_TO_FR[s.team?.name]||s.team?.name}
          });
        });
        events.sort((a,b)=>(a.time?.elapsed||0)-(b.time?.elapsed||0));

        // ─── Compositions ──────────────────────────────────────────────────
        const lineups=[];
        if(j.homeTeam?.lineup?.length>0){
          lineups.push({
            team:{name:match.homeTeam},
            formation:j.homeTeam.formation||"",
            startXI:(j.homeTeam.lineup||[]).filter(p=>p.position!=="BENCH"&&p.status==="ACTIVE").map(p=>({
              player:{name:p.name||p.shortName||"?",number:p.shirtNumber||"?"}
            }))
          });
        }
        if(j.awayTeam?.lineup?.length>0){
          lineups.push({
            team:{name:match.awayTeam},
            formation:j.awayTeam.formation||"",
            startXI:(j.awayTeam.lineup||[]).filter(p=>p.position!=="BENCH"&&p.status==="ACTIVE").map(p=>({
              player:{name:p.name||p.shortName||"?",number:p.shirtNumber||"?"}
            }))
          });
        }

        // ─── Statistiques adaptées ─────────────────────────────────────────
        // football-data.org ne fournit pas les stats classiques (possession etc)
        // On affiche ce qu'on a: buts, cartons, changements par équipe
        const homeGoals=(j.goals||[]).filter(g=>EN_TO_FR[g.team?.name]===match.homeTeam||g.team?.name===match.homeTeam);
        const awayGoals=(j.goals||[]).filter(g=>EN_TO_FR[g.team?.name]===match.awayTeam||g.team?.name===match.awayTeam);
        const homeCards=(j.bookings||[]).filter(b=>EN_TO_FR[b.team?.name]===match.homeTeam||b.team?.name===match.homeTeam);
        const awayCards=(j.bookings||[]).filter(b=>EN_TO_FR[b.team?.name]===match.awayTeam||b.team?.name===match.awayTeam);
        const homeSubs=(j.substitutions||[]).filter(s=>EN_TO_FR[s.team?.name]===match.homeTeam||s.team?.name===match.homeTeam);
        const awaySubs=(j.substitutions||[]).filter(s=>EN_TO_FR[s.team?.name]===match.awayTeam||s.team?.name===match.awayTeam);
        const stats=[
          {type:"Buts",homeVal:homeGoals.length,awayVal:awayGoals.length},
          {type:"Cartons",homeVal:homeCards.length,awayVal:awayCards.length},
          {type:"Changements",homeVal:homeSubs.length,awayVal:awaySubs.length},
        ].filter(s=>s.homeVal>0||s.awayVal>0);

        const statsFormatted=stats.length>0?[
          {statistics:stats.map(s=>({type:s.type,value:s.homeVal}))},
          {statistics:stats.map(s=>({type:s.type,value:s.awayVal}))}
        ]:[];

        setFd({
          fixture:{...j,computedScore:{home:hs,away:as_}},
          stats:statsFormatted,
          lineups,
          events
        });
      }else{
        setFd({fixture:null,stats:[],lineups:[],events:[]});
      }
    }catch(e){
      console.warn("LiveModal:",e);
      setFd({fixture:null,stats:[],lineups:[],events:[]});
    }finally{setLoading(false);}
  },[match]);
  useEffect(()=>{load();ivRef.current=setInterval(load,30000);return()=>clearInterval(ivRef.current);},[load]);
  if(!match)return null;
  const p=getProbs(match.homeTeam,match.awayTeam);
  const isLive=["1H","2H","HT"].includes(match.status);
  const isDone=["FT","AET","PEN"].includes(match.status);
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(6px)",zIndex:1000,overflowY:"auto",display:"flex",padding:"20px 0"}}>
      <div style={{background:"linear-gradient(180deg,#0c1523,#070d18)",border:"1px solid rgba(99,179,237,0.18)",borderRadius:20,width:"min(860px,94vw)",padding:28,margin:"auto",position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.07)",border:"none",color:"#9ca3af",cursor:"pointer",borderRadius:8,padding:"5px 10px",fontSize:17,fontFamily:"inherit"}}>✕</button>
        <div style={{textAlign:"center",marginBottom:22}}>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:6}}>{match.date} · {match.time} · Groupe {match.group} · {match.venue}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:22}}>
            <div style={{textAlign:"center"}}><Flag country={match.homeTeam} size={52}/><div style={{fontSize:17,fontWeight:800,color:"#e2e8f0",marginTop:6}}>{match.homeTeam}</div></div>
            <div style={{textAlign:"center"}}>
              {(()=>{
              // Priorité: score du match (fetchLive) > score de l'API détail > VS
              const hs=match.homeScore!==null&&match.homeScore!==undefined?match.homeScore
                      :fd?.fixture?.score?.fullTime?.home!==null&&fd?.fixture?.score?.fullTime?.home!==undefined?fd.fixture.score.fullTime.home
                      :null;
              const as_=match.awayScore!==null&&match.awayScore!==undefined?match.awayScore
                       :fd?.fixture?.score?.fullTime?.away!==null&&fd?.fixture?.score?.fullTime?.away!==undefined?fd.fixture.score.fullTime.away
                       :null;
              if(hs!==null&&as_!==null){
                return<div style={{fontSize:44,fontWeight:900,color:"#fff",letterSpacing:-2}}>{hs} - {as_}</div>;
              }
              return<div style={{fontSize:24,color:"#4fc3f7",fontWeight:700}}>VS</div>;
            })()}
              {isLive&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,marginTop:4}}><span style={{width:7,height:7,borderRadius:"50%",background:"#ef4444",display:"block",animation:"pulse 1s infinite"}}/><span style={{color:"#ef4444",fontSize:13,fontWeight:700}}>LIVE</span></div>}
              {isDone&&<div style={{color:"#6b7280",fontSize:12,marginTop:4}}>Match terminé</div>}
            </div>
            <div style={{textAlign:"center"}}><Flag country={match.awayTeam} size={52}/><div style={{fontSize:17,fontWeight:800,color:"#e2e8f0",marginTop:6}}>{match.awayTeam}</div></div>
          </div>
          <div style={{marginTop:10,display:"flex",justifyContent:"center",gap:5}}>
            {M6.has(match.id)&&<span style={{background:"rgba(249,115,22,0.14)",border:"1px solid rgba(249,115,22,0.35)",color:"#fb923c",padding:"3px 9px",borderRadius:5,fontSize:11,fontWeight:700}}>M6</span>}
            <span style={{background:"rgba(99,179,237,0.08)",border:"1px solid rgba(99,179,237,0.25)",color:"#63b3ed",padding:"3px 9px",borderRadius:5,fontSize:11,fontWeight:700}}>beIN Sports</span>
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#9ca3af",marginBottom:6}}>
            <span style={{color:"#60a5fa"}}>{match.homeTeam} {p.home}%</span><span>Nul {p.draw}%</span><span style={{color:"#fbbf24"}}>{match.awayTeam} {p.away}%</span>
          </div>
          <div style={{display:"flex",borderRadius:7,overflow:"hidden",height:7}}>
            <div style={{flex:p.home,background:"linear-gradient(90deg,#3b82f6,#60a5fa)"}}/><div style={{flex:p.draw,background:"#1e293b"}}/><div style={{flex:p.away,background:"linear-gradient(90deg,#f59e0b,#fbbf24)"}}/>
          </div>
        </div>
        {loading?<div style={{textAlign:"center",padding:36,color:"#6b7280"}}><div style={{fontSize:28,animation:"spin 1s linear infinite",display:"inline-block"}}>⚽</div><div style={{marginTop:10,fontSize:13}}>Chargement des données API…</div></div>:
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div>
            <div style={{fontSize:12,color:"#6b7280",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Statistiques</div>
            {fd&&fd.stats.length>0?fd.stats[0].statistics.map((s,i)=>{
              const av=fd.stats[1]?.statistics?.[i]?.value||0;
              const hv=parseInt(s.value)||0,avn=parseInt(av)||0,tot=(hv+avn)||1;
              return(<div key={i} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#9ca3af",marginBottom:3}}><span style={{color:"#60a5fa"}}>{s.value??0}</span><span style={{fontSize:10,color:"#4b5563"}}>{s.type}</span><span style={{color:"#fbbf24"}}>{av??0}</span></div>
                <div style={{display:"flex",borderRadius:3,overflow:"hidden",height:3}}><div style={{flex:hv/tot,background:"#3b82f6"}}/><div style={{flex:avn/tot,background:"#f59e0b"}}/></div>
              </div>);
            }):<div style={{color:"#4b5563",fontSize:13,padding:"16px 0"}}>{match.homeScore===null?"Les statistiques seront disponibles lors du prochain match.":"Score: "+((match.homeScore??fd?.fixture?.score?.fullTime?.home)??"?")+" - "+((match.awayScore??fd?.fixture?.score?.fullTime?.away)??"?")+" · Données détaillées non incluses dans le plan API gratuit."}</div>}
          </div>
          <div>
            <div style={{fontSize:12,color:"#6b7280",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Événements</div>
            {fd&&fd.events.length>0?<div style={{maxHeight:180,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
              {fd.events.map((ev,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#e2e8f0"}}>
                <span style={{color:"#6b7280",minWidth:28,fontSize:11}}>{ev.time?.elapsed}'</span>
                <span>{ev.type==="Goal"?"⚽":ev.type==="subst"?"🔄":ev.detail==="Yellow Card"?"🟨":"🟥"}</span>
                <span>{ev.player?.name}</span><span style={{color:"#4b5563",fontSize:10}}>({ev.team?.name})</span>
              </div>)}
            </div>:<div style={{color:"#4b5563",fontSize:13,padding:"16px 0"}}>{match.homeScore===null?"Les événements apparaîtront lors du prochain match live.":"Buts & événements non disponibles sur le plan gratuit football-data.org."}</div>}
            <div style={{fontSize:12,color:"#6b7280",textTransform:"uppercase",letterSpacing:2,margin:"16px 0 12px"}}>Compositions</div>
            {fd&&fd.lineups.length>0?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {fd.lineups.map((lu,i)=><div key={i}><div style={{fontSize:11,color:"#9ca3af",marginBottom:5,display:"flex",alignItems:"center",gap:5}}><Flag country={i===0?match.homeTeam:match.awayTeam} size={14}/>{lu.formation}</div><PitchView lineup={lu}/></div>)}
            </div>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[match.homeTeam,match.awayTeam].map((t,i)=><div key={i}><div style={{fontSize:11,color:"#9ca3af",marginBottom:5,display:"flex",alignItems:"center",gap:5}}><Flag country={t} size={14}/>{t}</div><PitchView lineup={null}/></div>)}
            </div>}
          </div>
        </div>}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

function PitchView({lineup}){
  if(!lineup||!lineup.startXI)return(<div style={{background:"linear-gradient(180deg,#1a4731,#2d6a4f)",borderRadius:9,padding:12,minHeight:170,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6}}><div style={{fontSize:24}}>🏟️</div><div style={{color:"rgba(255,255,255,0.3)",fontSize:11}}>Compo non disponible</div></div>);
  const pls=lineup.startXI.map(x=>x.player);
  const rows=[[pls[0]]];let idx=1;
  (lineup.formation||"4-4-2").split("-").map(Number).reverse().forEach(c=>{rows.push(pls.slice(idx,idx+c));idx+=c;});
  return(<div style={{background:"linear-gradient(180deg,#1a4731,#2d6a4f,#1a4731)",borderRadius:9,padding:"10px 6px",minHeight:170,border:"1px solid rgba(255,255,255,0.05)"}}>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {rows.map((row,ri)=>(<div key={ri} style={{display:"flex",justifyContent:"center",gap:7}}>
        {row.map((pl,pi)=>(<div key={pi} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <div style={{width:26,height:26,borderRadius:"50%",background:"rgba(255,255,255,0.9)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#1a4731"}}>{pl.number}</div>
          <span style={{fontSize:8,color:"rgba(255,255,255,0.85)",textAlign:"center",maxWidth:40,lineHeight:1.1}}>{pl.name?.split(" ").pop()}</span>
        </div>))}
      </div>))}
    </div>
    <div style={{textAlign:"center",marginTop:5,fontSize:8,color:"rgba(255,255,255,0.3)"}}>{lineup.formation}</div>
  </div>);
}

// ─── ONGLETS CONFIG ───────────────────────────────────────────────────────────
const TABS=[{id:"conf",label:"⚽ Confrontations"},{id:"poules",label:"📊 Poules"},{id:"tableau",label:"🗂️ Tableau"},{id:"eff",label:"👥 Effectifs"},{id:"prob",label:"🎯 Probabilités"},{id:"parc",label:"🏆 Parcours"}];

// ─── CONFRONTATIONS ───────────────────────────────────────────────────────────
function ConfTab({fixtures,onMatchClick}){
  const[filter,setFilter]=useState("all");
  const grouped={};
  fixtures.forEach(m=>{
    const ok=filter==="all"||(filter==="france"&&(m.homeTeam==="France"||m.awayTeam==="France"))||(filter==="m6"&&M6.has(m.id))||(filter==="live"&&["1H","2H","HT"].includes(m.status));
    if(!ok)return;if(!grouped[m.date])grouped[m.date]=[];grouped[m.date].push(m);
  });
  return(<div>
    <div style={{fontSize:20,fontWeight:800,color:"#e2e8f0",marginBottom:4}}>Calendrier des matchs</div>
    <div style={{color:"#6b7280",fontSize:13,marginBottom:18}}>Heure française (Paris) · Cliquer pour les stats en direct</div>
    <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap"}}>
      {[["all","Tous"],["m6","📺 M6"],["live","🔴 Live"]].map(([id,lbl])=>(
        <button key={id} onClick={()=>setFilter(id)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:7,fontSize:13,fontWeight:600,cursor:"pointer",border:filter==="france"?"none":filter===id?"none":"1px solid rgba(99,179,237,0.15)",background:filter===id?"linear-gradient(135deg,#2563eb,#3b82f6)":"rgba(9,16,28,0.7)",color:filter===id?"#fff":"#9ca3af",fontFamily:"inherit",transition:"all .12s"}}>{lbl}</button>
      ))}
      <button onClick={()=>setFilter("france")} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:7,fontSize:13,fontWeight:600,cursor:"pointer",border:filter==="france"?"none":"1px solid rgba(99,179,237,0.15)",background:filter==="france"?"linear-gradient(135deg,#2563eb,#3b82f6)":"rgba(9,16,28,0.7)",color:filter==="france"?"#fff":"#9ca3af",fontFamily:"inherit",transition:"all .12s"}}><Flag country="France" size={18}/>France</button>
    </div>
    <div style={{background:"rgba(99,179,237,0.03)",border:"1px solid rgba(99,179,237,0.08)",borderRadius:9,padding:"9px 14px",marginBottom:18,fontSize:12,color:"#6b7280"}}>
      📺 <strong style={{color:"#fb923c"}}>M6</strong> — 54 matchs gratuits (France, demi-finales, finale) · <strong style={{color:"#63b3ed"}}>beIN Sports</strong> — 104 matchs intégralité
    </div>
    {Object.keys(grouped).sort().map(date=>{
      const d=new Date(date+"T12:00:00");
      const lbl=d.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
      const ms=grouped[date].sort((a,b)=>a.time.localeCompare(b.time));
      return(<div key={date}>
        <div style={{display:"flex",alignItems:"center",gap:12,margin:"18px 0 10px"}}>
          <div style={{height:1,flex:1,background:"rgba(99,179,237,0.08)"}}/>
          <span style={{fontSize:12,color:"#6b7280",fontWeight:600,textTransform:"capitalize",whiteSpace:"nowrap"}}>{lbl}</span>
          <div style={{height:1,flex:1,background:"rgba(99,179,237,0.08)"}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10}}>
          {ms.map(m=><MatchCard key={m.id} match={m} onClick={onMatchClick}/>)}
        </div>
      </div>);
    })}
    {!Object.keys(grouped).length&&<div style={{color:"#4b5563",textAlign:"center",padding:28,fontSize:14}}>Aucun match.</div>}
  </div>);
}

// ─── POULES — tableau sans superposition ─────────────────────────────────────
function PoulesTab({fixtures,onMatchClick}){
  const[sel,setSel]=useState("A");
  const std=getStandings(sel,fixtures);
  const gms=fixtures.filter(m=>m.group===sel).sort((a,b)=>a.date.localeCompare(b.date));
  return(<div>
    <div style={{fontSize:20,fontWeight:800,color:"#e2e8f0",marginBottom:4}}>Phase de groupes</div>
    <div style={{color:"#6b7280",fontSize:13,marginBottom:18}}>12 groupes · Top 2 + 8 meilleurs 3es → 32es de finale</div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:18}}>
      {Object.keys(GROUPS).map(g=>(
        <button key={g} onClick={()=>setSel(g)} style={{padding:"7px 14px",borderRadius:7,fontWeight:700,fontSize:13,border:sel===g?"none":"1px solid rgba(99,179,237,0.12)",background:sel===g?"linear-gradient(135deg,#2563eb,#3b82f6)":"rgba(9,16,28,0.7)",color:sel===g?"#fff":"#9ca3af",cursor:"pointer",fontFamily:"inherit",transition:"all .12s"}}>Gr.{g}</button>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
      {/* Classement */}
      <div style={{background:"#0a111e",border:"1px solid rgba(99,179,237,0.12)",borderRadius:14,overflow:"hidden"}}>
        <div style={{padding:"12px 18px",borderBottom:"1px solid rgba(99,179,237,0.08)",background:"rgba(99,179,237,0.03)",fontSize:14,fontWeight:700,color:"#e2e8f0"}}>Classement — Groupe {sel}</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:400}}>
            <thead>
              <tr style={{background:"rgba(99,179,237,0.03)"}}>
                <th style={{padding:"10px 12px",textAlign:"left",color:"#6b7280",fontSize:11,fontWeight:600,width:36}}>#</th>
                <th style={{padding:"10px 12px",textAlign:"left",color:"#6b7280",fontSize:11,fontWeight:600}}>Équipe</th>
                {["J","G","N","P","BP","BC","+/-"].map(h=><th key={h} style={{padding:"10px 8px",textAlign:"center",color:"#6b7280",fontSize:11,fontWeight:600,width:34}}>{h}</th>)}
                <th style={{padding:"10px 12px",textAlign:"center",color:"#6b7280",fontSize:11,fontWeight:600,width:44}}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {std.map((s,i)=>(
                <tr key={s.team} style={{borderTop:"1px solid rgba(99,179,237,0.05)",background:i<2?"rgba(59,130,246,0.04)":i===2?"rgba(251,191,36,0.02)":"transparent"}}>
                  <td style={{padding:"11px 12px",color:i<2?"#60a5fa":"#4b5563",fontSize:13,fontWeight:700}}>{i+1}</td>
                  <td style={{padding:"11px 12px"}}>
                    {/* Equipe + badge Q sur même ligne, pas superposé */}
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <Flag country={s.team} size={20}/>
                      <span style={{fontSize:13,color:"#e2e8f0",fontWeight:600,whiteSpace:"nowrap"}}>{s.team}</span>
                      {i<2&&<span style={{background:"rgba(59,130,246,0.2)",color:"#60a5fa",padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>Qualif.</span>}
                      {i===2&&<span style={{background:"rgba(251,191,36,0.15)",color:"#fbbf24",padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>3e</span>}
                    </div>
                  </td>
                  {[s.j,s.g,s.n,s.p,s.gf,s.ga,s.diff>0?"+"+s.diff:s.diff].map((v,vi)=>(
                    <td key={vi} style={{textAlign:"center",padding:"11px 8px",color:"#9ca3af",fontSize:13}}>{v}</td>
                  ))}
                  <td style={{textAlign:"center",padding:"11px 12px",fontWeight:800,color:"#e2e8f0",fontSize:15}}>{s.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{padding:"8px 16px",display:"flex",gap:14,borderTop:"1px solid rgba(99,179,237,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#60a5fa"}}><span style={{width:10,height:10,background:"rgba(59,130,246,0.2)",borderRadius:2,display:"block"}}/>Top 2 qualifiés</div>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#fbbf24"}}><span style={{width:10,height:10,background:"rgba(251,191,36,0.15)",borderRadius:2,display:"block"}}/>3e (si meilleur 3e)</div>
        </div>
      </div>
      {/* Matchs du groupe */}
      <div>{gms.map(m=><MatchCard key={m.id} match={m} onClick={onMatchClick}/>)}</div>
    </div>
  </div>);
}

// ─── TABLEAU ─────────────────────────────────────────────────────────────────
function TableauTab({fixtures}){
  const gW={},gR={},gDone={};
  Object.keys(GROUPS).forEach(g=>{
    const done=isGroupComplete(g,fixtures);gDone[g]=done;
    if(done){const s=getStandings(g,fixtures);gW[g]=s[0]?.team||null;gR[g]=s[1]?.team||null;}
    else{gW[g]=null;gR[g]=null;}
  });
  const r32=[
    {t1:gW.A,t2:gR.C,label:"32e M1",date:"28 juin"},{t1:gW.B,t2:gR.A,label:"32e M2",date:"28 juin"},
    {t1:gW.C,t2:gR.B,label:"32e M3",date:"29 juin"},{t1:gW.D,t2:gR.E,label:"32e M4",date:"29 juin"},
    {t1:gW.E,t2:gR.D,label:"32e M5",date:"30 juin"},{t1:gW.F,t2:gR.G,label:"32e M6",date:"30 juin"},
    {t1:gW.G,t2:gR.F,label:"32e M7",date:"1er juil."},{t1:gW.H,t2:gR.I,label:"32e M8",date:"1er juil."},
    {t1:gW.I,t2:gR.H,label:"32e M9",date:"2 juil."},{t1:gW.J,t2:gR.K,label:"32e M10",date:"2 juil."},
    {t1:gW.K,t2:gR.J,label:"32e M11",date:"3 juil."},{t1:gW.L,t2:null,label:"32e M12 · meilleur 3e",date:"3 juil."},
    {t1:null,t2:gR.L,label:"32e M13 · meilleur 3e",date:"4 juil."},{t1:null,t2:null,label:"32e M14 · meilleurs 3es",date:"4 juil."},
    {t1:null,t2:null,label:"32e M15 · meilleurs 3es",date:"5 juil."},{t1:null,t2:null,label:"32e M16 · meilleurs 3es",date:"5 juil."},
  ];
  const completedCount=Object.values(gDone).filter(Boolean).length;
  const secHd=(txt,col="#63b3ed")=><div style={{fontSize:15,fontWeight:700,color:col,margin:"22px 0 12px",padding:"7px 14px",background:`rgba(99,179,237,0.05)`,borderLeft:`3px solid ${col}`,borderRadius:"0 7px 7px 0"}}>{txt}</div>;
  return(<div>
    <div style={{fontSize:20,fontWeight:800,color:"#e2e8f0",marginBottom:4}}>Tableau des phases finales</div>
    <div style={{color:"#6b7280",fontSize:13,marginBottom:18}}>Mis à jour automatiquement · {completedCount}/12 groupes terminés</div>
    <div style={{background:"rgba(99,179,237,0.03)",border:"1px solid rgba(99,179,237,0.08)",borderRadius:9,padding:"9px 14px",marginBottom:18,fontSize:12,color:"#6b7280"}}>
      ℹ️ Phases finales : <strong style={{color:"#e2e8f0"}}>28 juin → 19 juillet 2026</strong> · Finale au MetLife Stadium, New York
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:7,marginBottom:22}}>
      {Object.keys(GROUPS).map(g=>{
        const done=gDone[g];
        return(<div key={g} style={{background:done?"rgba(34,197,94,0.06)":"rgba(99,179,237,0.03)",border:`1px solid ${done?"rgba(34,197,94,0.22)":"rgba(99,179,237,0.1)"}`,borderRadius:10,padding:"10px 12px"}}>
          <div style={{fontSize:11,color:done?"#22c55e":"#6b7280",fontWeight:700,marginBottom:5}}>GR.{g} {done?"✓":"⏳"}</div>
          <div style={{fontSize:12,color:"#e2e8f0",fontWeight:600,display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
            {gW[g]?<><Flag country={gW[g]} size={15}/><span>{gW[g]}</span></>:<span style={{color:"#4b5563",fontStyle:"italic"}}>En cours</span>}
          </div>
          <div style={{fontSize:11,color:"#9ca3af",display:"flex",alignItems:"center",gap:5}}>
            {gR[g]?<><Flag country={gR[g]} size={14}/><span>{gR[g]}</span></>:<span style={{color:"#374151"}}>—</span>}
          </div>
        </div>);
      })}
    </div>
    {secHd("⚡ 32es de finale — 28 juin au 5 juillet 2026")}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:9}}>
      {r32.map((m,i)=><BracketMatch key={i} t1={m.t1} t2={m.t2} label={m.label} date={m.date}/>)}
    </div>
    {secHd("🔥 8es de finale — 4 au 7 juillet 2026")}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:9}}>
      {[...Array(8)].map((_,i)=><BracketMatch key={i} label={`8e de finale — M${i+1}`} date={i<4?"4-5 juil.":"6-7 juil."}/>)}
    </div>
    {secHd("🏆 Quarts de finale — 9 & 11 juillet 2026")}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
      {[1,2,3,4].map(i=><BracketMatch key={i} label={`Quart de finale ${i}`} date={i<=2?"9 juil.":"11 juil."}/>)}
    </div>
    {secHd("💥 Demi-finales — 15 & 16 juillet 2026")}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
      <BracketMatch label="Demi-finale 1" date="15 juil. · Dallas" onM6={true}/>
      <BracketMatch label="Demi-finale 2" date="16 juil. · Atlanta" onM6={true}/>
    </div>
    {secHd("🌟 Finale & 3e place — 18 & 19 juillet 2026","#fbbf24")}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
      <BracketMatch label="Match pour la 3e place" date="18 juil. · Miami"/>
      <BracketMatch label="🏆 FINALE" date="19 juil. · MetLife Stadium, New York" onM6={true}/>
    </div>
  </div>);
}

// ─── EFFECTIFS ────────────────────────────────────────────────────────────────
function EffectifsTab(){
  const allTeams=Object.values(GROUPS).flat().sort();
  const[sel,setSel]=useState("France");
  const sq=SQUADS[sel];
  const grp=Object.entries(GROUPS).find(([,t])=>t.includes(sel))?.[0];
  const posL={gardiens:"🧤 Gardiens",défenseurs:"🛡️ Défenseurs",milieux:"⚙️ Milieux",attaquants:"⚡ Attaquants"};
  return(<div>
    <div style={{fontSize:20,fontWeight:800,color:"#e2e8f0",marginBottom:4}}>Effectifs CDM 2026</div>
    <div style={{color:"#6b7280",fontSize:13,marginBottom:18}}>48 équipes · Listes officielles FIFA</div>
    <div style={{display:"flex",gap:5,flexWrap:"wrap",maxHeight:190,overflowY:"auto",marginBottom:20}}>
      {allTeams.map(t=>(
        <button key={t} onClick={()=>setSel(t)} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 11px",borderRadius:7,border:`1px solid ${sel===t?"rgba(99,179,237,0.45)":"rgba(99,179,237,0.08)"}`,background:sel===t?"rgba(99,179,237,0.12)":"rgba(9,16,28,0.65)",color:sel===t?"#63b3ed":"#9ca3af",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",transition:"all .11s"}}>
          <Flag country={t} size={18}/>{t}
        </button>
      ))}
    </div>
    <div style={{background:"#0a111e",border:"1px solid rgba(99,179,237,0.12)",borderRadius:14,padding:24}}>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
        <Flag country={sel} size={54}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:"#e2e8f0"}}>{sel}</div>
          <div style={{color:"#6b7280",fontSize:13,marginTop:3}}>
            Sélectionneur : <span style={{color:"#90cdf4",fontWeight:600}}>{COACHES[sel]||"—"}</span>
            {grp&&<span> · Groupe <span style={{color:"#fbbf24",fontWeight:700}}>{grp}</span></span>}
          </div>
        </div>
      </div>
      {sq?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
        {["gardiens","défenseurs","milieux","attaquants"].filter(k=>sq[k]).map(k=><div key={k}>
          <div style={{fontSize:11,color:"#6b7280",textTransform:"uppercase",letterSpacing:2,marginBottom:8,fontWeight:700}}>{posL[k]}</div>
          {sq[k].map((p,i)=><div key={i} style={{background:"rgba(99,179,237,0.04)",border:"1px solid rgba(99,179,237,0.07)",borderRadius:6,padding:"6px 10px",fontSize:12,color:"#e2e8f0",marginBottom:4}}>{p}</div>)}
        </div>)}
      </div>:<div style={{color:"#4b5563",fontSize:13,fontStyle:"italic"}}>Effectif disponible via l'API en direct.</div>}
    </div>
  </div>);
}

// ─── PROBABILITÉS ─────────────────────────────────────────────────────────────
function ProbTab(){
  const allT=Object.values(GROUPS).flat();
  const sorted=Object.entries(WIN).filter(([t])=>allT.includes(t)).sort((a,b)=>b[1]-a[1]);
  const total=sorted.reduce((s,[,v])=>s+v,0);
  return(<div>
    <div style={{fontSize:20,fontWeight:800,color:"#e2e8f0",marginBottom:4}}>Probabilités de victoire finale</div>
    <div style={{color:"#6b7280",fontSize:13,marginBottom:18}}>Moyenne Opta · Gracenote · Betfair · Unibet</div>
    {sorted.map(([team,prob],i)=>{
      const pct=(prob/total*100).toFixed(1);
      const col=i===0?"#fbbf24":i<3?"#63b3ed":"#9ca3af";
      const bar=i===0?"#fbbf24":i<5?"#3b82f6":"rgba(99,179,237,0.25)";
      return(<div key={team} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderRadius:10,marginBottom:6,background:i<5?"rgba(99,179,237,0.04)":"rgba(9,16,28,0.7)",border:`1px solid ${i<5?"rgba(99,179,237,0.12)":"rgba(99,179,237,0.05)"}`}}>
        <span style={{minWidth:24,fontWeight:800,fontSize:14,color:col}}>{i+1}</span>
        <Flag country={team} size={24}/>
        <span style={{flex:1,fontWeight:600,color:"#e2e8f0",fontSize:14}}>{team}</span>
        <div style={{flex:2,background:"rgba(99,179,237,0.06)",borderRadius:5,height:6,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:5,background:bar,width:`${(prob/sorted[0][1])*100}%`,transition:"width 1s"}}/>
        </div>
        <span style={{minWidth:44,textAlign:"right",fontWeight:800,fontSize:14,color:col}}>{pct}%</span>
      </div>);
    })}
  </div>);
}

// ─── PARCOURS ─────────────────────────────────────────────────────────────────
function ParcoursTab(){
  const allTeams=Object.values(GROUPS).flat().sort();
  const[sel,setSel]=useState("France");
  const grp=Object.entries(GROUPS).find(([,t])=>t.includes(sel))?.[0];
  const opps=grp?GROUPS[grp].filter(t=>t!==sel):[];
  const w=WIN[sel]||1;
  const totalW=Object.entries(WIN).filter(([t])=>allTeams.includes(t)).reduce((s,[,p])=>s+p,0);
  const stages=[{l:"16es",v:Math.min(95,w*5+55)},{l:"8es",v:Math.min(88,w*4.5+30)},{l:"Quarts",v:Math.min(78,w*4+12)},{l:"Demis",v:Math.min(65,w*3.5+4)},{l:"Finale",v:Math.min(55,w*3)},{l:"Vainqueur",v:+(w/totalW*100).toFixed(2)}];
  return(<div>
    <div style={{fontSize:20,fontWeight:800,color:"#e2e8f0",marginBottom:4}}>Parcours & Probabilités</div>
    <div style={{color:"#6b7280",fontSize:13,marginBottom:18}}>Chances d'avancement à chaque tour</div>
    <div style={{display:"flex",gap:5,flexWrap:"wrap",maxHeight:190,overflowY:"auto",marginBottom:20}}>
      {allTeams.map(t=>(
        <button key={t} onClick={()=>setSel(t)} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 11px",borderRadius:7,border:`1px solid ${sel===t?"rgba(99,179,237,0.45)":"rgba(99,179,237,0.08)"}`,background:sel===t?"rgba(99,179,237,0.12)":"rgba(9,16,28,0.65)",color:sel===t?"#63b3ed":"#9ca3af",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",transition:"all .11s"}}>
          <Flag country={t} size={16}/>{t}
        </button>
      ))}
    </div>
    <div style={{background:"#0a111e",border:"1px solid rgba(99,179,237,0.12)",borderRadius:14,padding:24}}>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
        <Flag country={sel} size={50}/>
        <div><div style={{fontSize:20,fontWeight:800,color:"#e2e8f0"}}>{sel}</div><div style={{color:"#6b7280",fontSize:13}}>Groupe {grp} · {COACHES[sel]||"—"}</div></div>
      </div>
      <div style={{fontSize:11,color:"#6b7280",textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Adversaires Groupe {grp}</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:22}}>
        {opps.map(o=>{const p=getProbs(sel,o);return(<div key={o} style={{background:"rgba(99,179,237,0.04)",border:"1px solid rgba(99,179,237,0.09)",borderRadius:10,padding:"12px 14px",flex:1,minWidth:145}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:9,fontWeight:700,color:"#e2e8f0",fontSize:14}}><Flag country={o} size={22}/>{o}</div>
          <div style={{display:"flex",borderRadius:4,overflow:"hidden",height:5,marginBottom:5}}><div style={{flex:p.home,background:"#3b82f6"}}/><div style={{flex:p.draw,background:"#1e293b"}}/><div style={{flex:p.away,background:"#f59e0b"}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#6b7280"}}><span style={{color:"#60a5fa"}}>V.{p.home}%</span><span>N.{p.draw}%</span><span style={{color:"#fbbf24"}}>D.{p.away}%</span></div>
        </div>);})}
      </div>
      <div style={{fontSize:11,color:"#6b7280",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Chances par tour</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:9}}>
        {stages.map(({l,v})=>{const n=parseFloat(v);const col=n>55?"#22c55e":n>30?"#fbbf24":"#f87171";return(<div key={l} style={{background:"rgba(9,16,28,0.6)",border:`1px solid ${col}20`,borderRadius:10,padding:"13px 10px",textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:900,color:col}}>{typeof v==="number"?v.toFixed(n<10?1:0):v}%</div>
          <div style={{fontSize:12,color:"#6b7280",marginTop:3}}>{l}</div>
          <div style={{marginTop:8,background:"rgba(99,179,237,0.06)",borderRadius:3,height:4,overflow:"hidden"}}><div style={{height:"100%",background:col,width:`${Math.min(n,100)}%`,borderRadius:3}}/></div>
        </div>);})}
      </div>
    </div>
  </div>);
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App(){
  const[loaded,setLoaded]=useState(false);
  const[tab,setTab]=useState("conf");
  const[fixtures,setFixtures]=useState(FIXTURES_INIT);
  const[selMatch,setSelMatch]=useState(null);
  const[apiOk,setApiOk]=useState(false);

  useEffect(()=>{
    if(!loaded)return;
    const fetchLive=async()=>{
      try{
        // Utilise notre proxy Vercel /api/matches pour éviter CORS et plan limité
        const r=await fetch("/api/matches?type=all");
        if(!r.ok) throw new Error("API proxy: "+r.status);
        const j=await r.json();
        const matches=j.matches||[];
        if(matches.length>0){
          setFixtures(prev=>{
            const upd=[...prev];
            matches.forEach(m=>{
              // Convertir noms EN→FR pour trouver le match dans nos données
              const homeFr=EN_TO_FR[m.homeTeam?.name]||m.homeTeam?.name;
              const idx=upd.findIndex(s=>s.homeTeam===homeFr);
              if(idx!==-1){
                const st=FD_STATUS[m.status]||null;
                // football-data.org: score.fullTime = {home: N, away: N} après le match
                // score.regularTime ou score.halfTime pendant le match
                const ft=m.score?.fullTime;
                const ht=m.score?.halfTime;
                // Lire le score depuis football-data.org
                const hsNew=(ft?.home!==null&&ft?.home!==undefined)?ft.home
                           :(ht?.home!==null&&ht?.home!==undefined)?ht.home:null;
                const asNew=(ft?.away!==null&&ft?.away!==undefined)?ft.away
                           :(ht?.away!==null&&ht?.away!==undefined)?ht.away:null;
                // NE JAMAIS écraser un score déjà présent par null
                const hsFinal=hsNew!==null?hsNew:upd[idx].homeScore;
                const asFinal=asNew!==null?asNew:upd[idx].awayScore;
                upd[idx]={...upd[idx],
                  apiMatchId:m.id,
                  homeScore:hsFinal,
                  awayScore:asFinal,
                  status:st,
                  elapsed:m.minute||null
                };
              }
            });
            return upd;
          });
          setApiOk(true);
        }
      }catch(e){console.warn("API proxy error:",e);}
    };
    fetchLive();
    const iv=setInterval(fetchLive,60000);
    return()=>clearInterval(iv);
  },[loaded]);

  if(!loaded)return<Loading onDone={()=>setLoaded(true)}/>;

  return(
    <div style={{minHeight:"100vh",background:"#060d1a",fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",color:"#e2e8f0"}}>
      {/* HEADER */}
      <header style={{background:"rgba(7,17,31,0.97)",borderBottom:"1px solid rgba(99,179,237,0.1)",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:26}}>⚽</span>
              <div>
                <div style={{fontWeight:900,fontSize:17,background:"linear-gradient(135deg,#63b3ed,#90cdf4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>COUPE DU MONDE FIFA</div>
                <div style={{fontSize:10,color:"#374151",letterSpacing:4,marginTop:-1}}>2026 · CANADA · USA · MEXIQUE</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <Flag country="Canada" size={20}/><Flag country="États-Unis" size={20}/><Flag country="Mexique" size={20}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:apiOk?"#22c55e":"#f59e0b",background:"rgba(0,0,0,0.2)",padding:"4px 10px",borderRadius:18}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:apiOk?"#22c55e":"#f59e0b",display:"block",animation:"pulse 2s infinite"}}/>
                {apiOk?"Live":"Données locales"}
              </div>
            </div>
          </div>
          <nav style={{display:"flex",overflowX:"auto"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"11px 16px",background:"transparent",border:"none",borderBottom:tab===t.id?"2px solid #63b3ed":"2px solid transparent",color:tab===t.id?"#63b3ed":"#6b7280",cursor:"pointer",fontSize:13,fontWeight:600,whiteSpace:"nowrap",fontFamily:"inherit",transition:"all .12s"}}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main style={{maxWidth:1200,margin:"0 auto",padding:"28px 20px"}}>
        {tab==="conf"&&<ConfTab fixtures={fixtures} onMatchClick={setSelMatch}/>}
        {tab==="poules"&&<PoulesTab fixtures={fixtures} onMatchClick={setSelMatch}/>}
        {tab==="tableau"&&<TableauTab fixtures={fixtures}/>}
        {tab==="eff"&&<EffectifsTab/>}
        {tab==="prob"&&<ProbTab/>}
        {tab==="parc"&&<ParcoursTab/>}
      </main>

      <footer style={{borderTop:"1px solid rgba(99,179,237,0.06)",padding:"18px 20px",textAlign:"center",color:"#1e293b",fontSize:11,marginTop:36}}>
        <div>API-Football · Mise à jour automatique toutes les 60s · M6 : 54 matchs gratuits · beIN Sports : 104 matchs</div>
        <div style={{marginTop:3}}>11 juin – 19 juillet 2026 · 48 équipes · 104 matchs · 16 stades · Canada, USA, Mexique</div>
      </footer>

      {selMatch&&<LiveModal match={selMatch} onClose={()=>setSelMatch(null)}/>}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,179,237,0.18); border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.3; } }
        body { background: #060d1a; }
      `}</style>
    </div>
  );
}
