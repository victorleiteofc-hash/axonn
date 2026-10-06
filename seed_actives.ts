import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { ACTIVES_DATABASE } from "./src/data";

async function main() {
  console.log("Iniciando carga de dados no Firebase Firestore...");
  
  // 1. Load config
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    throw new Error("Arquivo firebase-applet-config.json não encontrado!");
  }
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  
  // 2. Initialize Firebase
  const app = initializeApp(config);
  const db = getFirestore(app, config.firestoreDatabaseId || undefined);
  
  console.log(`Conectado ao Firebase. Database ID: ${config.firestoreDatabaseId || "(default)"}`);
  console.log(`Enviando ${ACTIVES_DATABASE.length} ativos...`);
  
  for (const active of ACTIVES_DATABASE) {
    try {
      const activeRef = doc(db, "actives", active.id);
      await setDoc(activeRef, {
        id: active.id,
        name: active.name || "",
        namePt: active.namePt || "",
        nameEn: active.nameEn || "",
        scientificName: active.scientificName || "",
        studiesCount: active.studiesCount || 0,
        clinicalStudiesCount: active.clinicalStudiesCount || 0,
        mechanism: active.mechanism || "",
        concentration: active.concentration || "",
        synergies: active.synergies || "",
        conflicts: active.conflicts || "",
        char: active.char || "",
        chemicalClass: active.chemicalClass || "",
        category: active.category || "",
        efficacyRate: active.efficacyRate || 0,
        synapsisConnection: active.synapsisConnection || ""
      });
      console.log(`✓ Ativo enviado: ${active.id}`);
    } catch (err) {
      console.error(`✗ Erro ao enviar ativo ${active.id}:`, err);
    }
  }
  
  console.log("Carga de ativos concluída com sucesso!");
}

main().catch(console.error);
