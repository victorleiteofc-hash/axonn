import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import { ACTIVES_DATABASE } from "./src/data";

dotenv.config();

// Load Firebase Config dynamically
let firebaseConfig: any = null;
try {
  const configFile = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configFile)) {
    const raw = fs.readFileSync(configFile, "utf8");
    firebaseConfig = JSON.parse(raw);
  }
} catch (e) {
  console.warn("Nenhum arquivo firebase-applet-config.json encontrado ou erro de leitura: ", e);
}

// 1. Sanitizer Helper for Input Validation and Sanitization (Item 4)
function sanitizeInput(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, "") // Remove tags HTML para conter injeção de tags/scripts
    .trim();
}

// Validador simples de e-mail usando regex padrão e sanitização de string
function validateEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Cache of Google public certificates for verification
let publicKeysCache: { keys: Record<string, string>; expires: number } | null = null;

async function getGooglePublicKeys(): Promise<Record<string, string>> {
  const now = Date.now();
  if (publicKeysCache && publicKeysCache.expires > now) {
    return publicKeysCache.keys;
  }

  const res = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
  if (!res.ok) throw new Error("Failed to fetch Firebase public keys from Google");
  
  const cacheControl = res.headers.get("cache-control") || "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) * 1000 : 3600000;

  const keys = await res.json();
  publicKeysCache = { keys, expires: now + maxAge };
  return keys;
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return Buffer.from(str, "base64").toString("utf8");
}

// 2. Custom Native helper to verify Firebase Token directly with Google APIs
async function verifyFirebaseToken(idToken: string): Promise<any> {
  if (!idToken) return null;
  if (!firebaseConfig || !firebaseConfig.projectId) {
    console.error("Firebase Project ID não configurado no servidor.");
    return null;
  }

  const parts = idToken.split(".");
  if (parts.length !== 3) {
    console.error("Token Firebase em formato inválido.");
    return null;
  }

  try {
    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(base64UrlDecode(headerB64));
    const payload = JSON.parse(base64UrlDecode(payloadB64));

    if (header.alg !== "RS256") {
      console.error("Algoritmo de assinatura inválido:", header.alg);
      return null;
    }

    const keys = await getGooglePublicKeys();
    const cert = keys[header.kid];
    if (!cert) {
      console.error("Chave pública correspondente ao kid não encontrada.");
      return null;
    }

    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(`${headerB64}.${payloadB64}`);
    const signature = Buffer.from(signatureB64, "base64url");
    const isValid = verify.verify(cert, signature);
    if (!isValid) {
      console.error("Assinatura do token Firebase é inválida.");
      return null;
    }

    const projectId = firebaseConfig.projectId;
    if (payload.aud !== projectId) {
      console.error(`Audience (aud) incorreta. Esperada: ${projectId}, Recebida: ${payload.aud}`);
      return null;
    }

    const expectedIss = `https://securetoken.google.com/${projectId}`;
    if (payload.iss !== expectedIss) {
      console.error(`Issuer (iss) incorreto. Esperado: ${expectedIss}, Recebido: ${payload.iss}`);
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      console.error("Token Firebase expirado.");
      return null;
    }

    if (!payload.sub) {
      console.error("Token Firebase não possui subject (sub).");
      return null;
    }

    return {
      uid: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified
    };
  } catch (error) {
    console.error("Exceção na validação do token Firebase: ", error);
    return null;
  }
}

// Cache system for Clinical Actives from Firestore Cloud Database
let cachedActives: any[] = [];
let lastCacheTime = 0;
const CACHE_TTL_MS = 600000; // 10 minutes

async function getActivesFromFirestore(): Promise<any[]> {
  const now = Date.now();
  if (cachedActives.length > 0 && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedActives;
  }

  if (!firebaseConfig || !firebaseConfig.projectId) {
    console.warn("Configuração do Firebase indisponível para carregar ativos da nuvem. Usando banco estático.");
    return ACTIVES_DATABASE;
  }

  try {
    const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
    const projectId = firebaseConfig.projectId;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/actives?pageSize=100`;
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Google API returned status ${res.status}`);
    }
    
    const data = await res.json();
    const documents = data.documents || [];
    
    if (documents.length === 0) {
      console.warn("Coleção 'actives' vazia no Firestore. Utilizando base local.");
      return ACTIVES_DATABASE;
    }

    cachedActives = documents.map((doc: any) => {
      const fields = doc.fields || {};
      const id = doc.name.split("/").pop() || "";
      
      return {
        id,
        name: fields.name?.stringValue || "",
        namePt: fields.namePt?.stringValue || "",
        nameEn: fields.nameEn?.stringValue || "",
        scientificName: fields.scientificName?.stringValue || "",
        studiesCount: parseInt(fields.studiesCount?.integerValue || "0", 10),
        clinicalStudiesCount: parseInt(fields.clinicalStudiesCount?.integerValue || "0", 10),
        mechanism: fields.mechanism?.stringValue || "",
        concentration: fields.concentration?.stringValue || "",
        synergies: fields.synergies?.stringValue || "",
        conflicts: fields.conflicts?.stringValue || "",
        char: fields.char?.stringValue || "",
        chemicalClass: fields.chemicalClass?.stringValue || "",
        category: fields.category?.stringValue || "",
        efficacyRate: parseInt(fields.efficacyRate?.integerValue || "0", 10),
        synapsisConnection: fields.synapsisConnection?.stringValue || ""
      };
    });

    lastCacheTime = now;
    console.log(`[AXON CACHE] Carregados ${cachedActives.length} ativos clínicos do Firestore Cloud com sucesso.`);
    return cachedActives;
  } catch (err: any) {
    console.error("Erro na conexão com Firestore para obter ativos:", err.message || err);
    return ACTIVES_DATABASE;
  }
}

// 3. Structured Activity Logger (Item 6)
function formatIP(ip: string): string {
  // Mascara parte do IP por privacidade do usuário
  if (ip.includes("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.x.x`;
    }
  }
  return ip.length > 8 ? ip.substring(0, 8) + "...x" : ip;
}

function logActivity(level: "INFO" | "WARNING" | "SECURITY_ALERT" | "ERROR", message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const logObj = {
    timestamp,
    level,
    message,
    ...(meta || {})
  };
  console.log(`[ACTIVITY LOG] [${level}] ${JSON.stringify(logObj)}`);
}

// 4. Rate Limiting Memory Store and Middleware (Item 7)
const rateLimitMemory: Record<string, { count: number; resetTime: number }> = {};
const LIMIT_WINDOW_MS = 60000; // 1 minuto
const MAX_REQUESTS = 80; // 80 reqs/min

// Periodic cleanup of rate limiting memory (prevents memory leaks)
const rateLimitCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of Object.entries(rateLimitMemory)) {
    if (now > limit.resetTime) {
      delete rateLimitMemory[ip];
    }
  }
}, 60000);
if (rateLimitCleanupInterval.unref) {
  rateLimitCleanupInterval.unref();
}

function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  if (!rateLimitMemory[ip]) {
    rateLimitMemory[ip] = { count: 1, resetTime: now + LIMIT_WINDOW_MS };
    return next();
  }

  const clientLimit = rateLimitMemory[ip];
  if (now > clientLimit.resetTime) {
    clientLimit.count = 1;
    clientLimit.resetTime = now + LIMIT_WINDOW_MS;
    return next();
  }

  clientLimit.count += 1;
  const cleanIp = formatIP(ip);
  if (clientLimit.count > MAX_REQUESTS) {
    logActivity("SECURITY_ALERT", "Limite de requisições excedido no Rate Limiter", { ip: cleanIp, path: req.originalUrl });
    return res.status(429).json({
      error: "Muitas requisições enviadas de forma sequencial rápida. Limite ativo nas rotas da Axon Skin Lab. Aguarde 60 segundos."
    });
  }

  next();
}

// Middleware de Autenticação para validar o Token do Firebase e verificar o Perfil no Firestore
async function authenticateRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers["authorization"] || req.headers["x-session-token"];
  if (!authHeader || typeof authHeader !== "string") {
    logActivity("WARNING", "Tentativa de acesso não autorizado a recurso protegido", { 
      ip: formatIP(req.ip || req.socket.remoteAddress || "unknown"), 
      path: req.originalUrl 
    });
    return res.status(401).json({ error: "Sua sessão expirou ou você não está devidamente autenticado clinica ou cientificamente no Axon Skin." });
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
  const decoded = await verifyFirebaseToken(token);

  if (!decoded) {
    logActivity("WARNING", "Token de autenticação inválido ou expirado", { 
      ip: formatIP(req.ip || req.socket.remoteAddress || "unknown"), 
      path: req.originalUrl 
    });
    return res.status(401).json({ error: "Sessão inválida, expirada ou corrompida. Por favor, reinicie e faça autenticação novamente." });
  }



  // Validate that a corresponding clinical profile exists in Firestore
  // We call the official Google REST API using the user's idToken to preserve full RLS
  if (firebaseConfig && firebaseConfig.projectId) {
    try {
      const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
      const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${databaseId}/documents/clinical_profiles/${decoded.uid}`;
      const firestoreRes = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!firestoreRes.ok) {
        logActivity("SECURITY_ALERT", "Token de autenticação válido mas sem perfil correspondente no Firestore (BOLA/IDOR mitigado)", {
          uid: decoded.uid,
          email: decoded.email,
          status: firestoreRes.status
        });
        return res.status(403).json({ error: "Acesso negado: Perfil clínico correspondente não encontrado no banco de dados. Por favor, registre seu perfil clínico antes de prosseguir." });
      }
    } catch (fsErr: any) {
      logActivity("ERROR", "Erro ao verificar perfil clínico via API REST do Firestore", { error: fsErr?.message || fsErr });
      return res.status(500).json({ error: "Erro de rede interno ao validar credenciais clínicas." });
    }
  }

  (req as any).user = decoded;
  next();
}

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Configure Express to trust the reverse proxy IP headers securely
  // Trust only the first hop proxy (prevents X-Forwarded-For spoofing)
  app.set("trust proxy", 1);

  // Security Headers Middleware (Native Protection)
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    
    // Content Security Policy — only enforce on production public domains, never restrict localhost
    if (process.env.NODE_ENV === "production" && !req.headers.host?.includes("localhost") && !req.headers.host?.includes("127.0.0.1")) {
      res.setHeader("Content-Security-Policy", [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "connect-src * 'self' blob: data: ws: wss:",
        "img-src * 'self' data: blob: https://lh3.googleusercontent.com",
        "media-src * 'self' data: blob:",
        "worker-src 'self' blob: data:",
        "frame-ancestors 'self'"
      ].join("; "));
    }
    
    // Force HTTPS / HSTS only in production under real HTTPS (never on local HTTP/localhost)
    if (process.env.NODE_ENV === "production" && req.secure) {
      res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    }
    
    // Prevent caching of sensitive API requests
    if (req.url.startsWith("/api/")) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
    next();
  });

  // Body parsing middleware
  app.use(express.json());

  // API Route: Send client-safe non-sensitive Firebase configuration dynamically (Item 5)
  app.get("/api/firebase-config", rateLimiter, (req, res) => {
    try {
      if (!firebaseConfig) {
        logActivity("ERROR", "Configuração do Firebase não encontrada ou não inicializada no servidor.");
        return res.status(500).json({ error: "Configuração do Firebase indisponível ou não provisionada." });
      }
      res.json({
        projectId: firebaseConfig.projectId,
        appId: firebaseConfig.appId,
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId
      });
    } catch (error: any) {
      logActivity("ERROR", "Erro ao obter configuração do Firebase", { error: error?.message || error });
      return res.status(500).json({ error: "Erro interno ao obter a configuração do portal." });
    }
  });

  app.post("/api/analyze", rateLimiter, authenticateRequest, async (req, res) => {
    try {
      let { formula } = req.body;

      const clientIP = formatIP(req.ip || req.socket.remoteAddress || "unknown");
      const userEmail = (req as any).user?.email || "unknown";

      if (!formula || typeof formula !== "string" || !formula.trim()) {
        logActivity("WARNING", "Análise rejeitada: fórmula vazia", { ip: clientIP, user: userEmail });
        return res.status(400).json({
          error: "Por favor, insira uma fórmula cosmética válida para análise molecular.",
        });
      }

      // Validação estrita de tamanho do input contra ataques DoS (Item 4)
      if (formula.length > 1000) {
        logActivity("SECURITY_ALERT", "Análise rejeitada: payload muito grande (DoS Prevent)", { 
          ip: clientIP, 
          user: userEmail,
          length: formula.length 
        });
        return res.status(400).json({
          error: "A fórmula informada excede o limite máximo de segurança de 1000 caracteres.",
        });
      }

      // Sanitização completa do input da fórmula contra XSS e injeções de scripts (Item 4)
      formula = sanitizeInput(formula);

      logActivity("INFO", "Iniciando processamento de análise molecular da fórmula", { 
        ip: clientIP, 
        user: userEmail,
        formulaSnippet: formula.substring(0, 50) + (formula.length > 50 ? "..." : "")
      });

      // Parse and match formula ingredients ingredient-by-ingredient with exact keyword registry
      const matchedLocal: any[] = [];
      const unregisteredLocal: string[] = [];

      // Registry of highly specific key terms mapping to each active in ACTIVES_DATABASE
      const SPECIFIC_KEYWORDS: Record<string, string[]> = {
        "malic-acid": ["malico", "malic"],
        "citric-acid": ["citrico", "citric"],
        "salicylic-acid": ["salicilico", "salicylic"],
        "acetyl-hexapeptide-8": ["acetyl hexapeptide", "acetil hexapeptide", "argireline", "hexapeptide-8", "hexapeptideo-8"],
        "aloe-barbadensis-leaf-juice": ["aloe", "babosa", "barbadensis"],
        "bakuchiol": ["bakuchiol"],
        "calendula-officinalis-flower-extract": ["calendula", "marigold"],
        "hydrolyzed-collagen": ["collagen", "colageno"],
        "salix-alba-bark-extract": ["salix", "salgueiro", "willow bark"],
        "copper-tripeptide-1": ["copper tripeptide", "tripeptideo de cobre", "ghk-cu", "ghk cu"],
        "gluconolactone": ["gluconolactona", "gluconolactone"],
        "niacinamide": ["niacinamida", "niacinamide", "vitamin b3", "vitamina b3"],
        "ascorbyl-palmitate": ["ascorbyl palmitate", "palmitato de ascorbila", "ascorbila palmitato"],
        "chamomilla-recutita-flower-extract": ["chamomilla", "camomila", "recutita"],
        "retinol-tretinoin": ["retinol", "retioide", "retinoide", "retinoid", "retinois", "retinoids"],
        "sodium-lauryl-sulfate": ["lauril sulfato", "lauryl sulfate", "sodium lauryl", "sodium laureth", "laureth sulfate", "laurilsulfato", "sls", "sles"],
        "lactobionic-acid": ["lactobionico", "lactobionic"],
        "pyruvic-acid": ["piruvico", "pyruvic"],
        "magnesium-ascorbyl-phosphate": ["magnesium ascorbyl", "ascorbil fosfato de magnesio"],
        "avena-sativa-kernel-flour": ["avena", "aveia", "oatmeal"],
        "camellia-sinensis-leaf-extract": ["camellia sinensis", "cha verde", "green tea"],
        "ceramides": ["ceramida", "ceramide", "ceramidas", "ceramides"],
        "squalane": ["esqualano", "squalane"],
        "mandelic-acid": ["mandelico", "mandelic"],
        "pdrn": ["pdrn", "polidesoxirribonucleotideo", "polydeoxyribonucleotide"],
        "palmitoyl-pentapeptide-4": ["palmitoyl pentapeptide", "palmitoil pentapeptideo", "matrixyl"],
        "propylene-glycol": ["propylene glycol", "propilenoglicol"],
        "asiaticoside": ["asiaticoside"],
        "hydroxyphenyl-propamidobenzoic-acid": ["hydroxyphenyl propamidobenzoic", "hidroxifenil propamidobenzoico", "avenantramida", "avenanthramide"],
        "bisabolol": ["bisabolol", "levomenol"],
        "sorbitol": ["sorbitol"],
        "tocopherol": ["tocopherol", "tocoferol", "tocopheryl", "vitamina e", "vitamin e"],
        "tretinoin": ["tretinoina", "tretinoin", "retinoico", "retinoic"],
        "urea": ["ureia", "urea"],
        "adapalene": ["adapaleno", "adapalene"],
        "azelaic-acid": ["azelaico", "azelaic"],
        "hyaluronic-acid": ["hialuronico", "hyaluronic", "hialuronato", "hyaluronate", "sodium hyaluronate"],
        "kojic-acid": ["kojico", "kojic"],
        "thioctic-acid": ["thioctic", "tioctico", "lipoico", "lipoic"],
        "ascorbic-acid": ["ascorbico", "ascorbic", "vitamina c pura", "vitamin c pura", "l-ascorbico", "l-ascorbic", "vitamina c", "vitamin c"],
        "epigallocatechin-gallate": ["epigallocatechin", "epigalocatequina", "egcg"],
        "ferulic-acid": ["ferulico", "ferulic"],
        "benzoyl-peroxide": ["benzoyl peroxide", "peroxido de benzoila", "peroxido de benzoyla"],
        "carnosine": ["carnosina", "carnosine"],
        "centella-asiatica-extract": ["centella", "asiatica", "cica"],
        "sodium-ascorbyl-phosphate": ["sodium ascorbyl", "ascorbil fosfato de sodio"],
        "retinyl-palmitate": ["retinyl palmitate", "palmitato de retinila", "retinila de palmitato"],
        "resveratrol-pure": ["resveratrol"],
        "lactic-acid": ["latico", "lactic"],
        "ubiquinone": ["ubiquinone", "ubiquinona", "coenzima q10", "coenzyme q10", "q10"],
        "glycerin": ["glicerina", "glycerin"],
        "panthenol-provitamin": ["panthenol", "pantenol", "provitamin b5", "pro-vitamina b5"],
        "exosomes-biomimetic": ["exosome", "exossomo"]
      };

      // Fetch active ingredients list from Firestore cloud cache/fallback
      const actives = await getActivesFromFirestore();

      // Split input into individual raw ingredients on common separators
      const rawIngs = formula
        .split(/[,;\n+]+/)
        .map((i: string) => i.trim())
        .filter((i: string) => i.length > 0);

      for (const ing of rawIngs) {
        const normIng = ing.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        if (normIng.length < 2) continue;

        let matchedItem: any = null;

        // Scan our Registry to identify if the Ingredient relates to any documented Active
        for (const [activeId, keywords] of Object.entries(SPECIFIC_KEYWORDS)) {
          let foundMatch = false;

          for (const kw of keywords) {
            const cleanKw = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

            // Phrase match (e.g., "sodium hyaluronate", "ascorbyl palmitate")
            if (cleanKw.includes(" ")) {
              if (normIng.includes(cleanKw)) {
                foundMatch = true;
                break;
              }
            } else {
              // Single word keyword: exact match or exact word within sentence
              if (normIng === cleanKw) {
                foundMatch = true;
                break;
              }

              const words = normIng.split(/[\s,;+\-()_]+/).filter(Boolean);
              if (words.includes(cleanKw)) {
                foundMatch = true;
                break;
              }

              // Plurality matching
              for (const w of words) {
                if (w.length >= 4) {
                  if (w === cleanKw || w + "s" === cleanKw || cleanKw + "s" === w || w === cleanKw + "a" || cleanKw === w + "a") {
                    foundMatch = true;
                    break;
                  }
                }
              }
            }
            if (foundMatch) break;
          }

          if (foundMatch) {
            // Look up full details in Firestore loaded actives
            const dbItem = actives.find(item => item.id === activeId);
            if (dbItem) {
              matchedItem = dbItem;
              break;
            }
          }
        }

        if (matchedItem) {
          if (!matchedLocal.some(m => m.id === matchedItem.id)) {
            matchedLocal.push({
              id: matchedItem.id,
              name: matchedItem.name,
              namePt: matchedItem.namePt,
              nameEn: matchedItem.nameEn,
              mechanism: matchedItem.mechanism,
              concentration: matchedItem.concentration,
              synergies: matchedItem.synergies,
              conflicts: matchedItem.conflicts,
              category: matchedItem.category,
              efficacyRate: matchedItem.efficacyRate,
              studiesCount: matchedItem.studiesCount,
              chemicalClass: matchedItem.chemicalClass
            });
          }
        } else {
          // Exclude generic base/solvents/vehicles like Aqua/Water from unregistered active lists if too common, but keep them if user explicitly pasted them to show on unregistered tab
          if (!unregisteredLocal.some(u => u.toLowerCase() === ing.toLowerCase())) {
            unregisteredLocal.push(ing);
          }
        }
      }

      // Análise baseada exclusivamente no Banco de Dados de Ativos Axon Skin (Compêndio Local)
      const result = fallbackAnalyze(formula, matchedLocal, unregisteredLocal);
      return res.json(result);
    } catch (error: any) {
      logActivity("ERROR", "Erro crítico durante a análise da fórmula", { error: error?.message || error });
      return res.status(500).json({ error: "Erro interno no servidor ao processar a análise bioquímica da fórmula." });
    }
  });

  // Fast static file serving if dist exists, or fallback to Vite dev middleware
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));

  if (process.env.NODE_ENV === "production" || hasDist) {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`[AXON SERVER] Motor Molecular Online na porta ${port}...`);
  });
}

// Clinical dermocosmetics compendium-driven database search and auto-validator
function fallbackAnalyze(text: string, matchedLocal: any[], unregisteredLocal: string[]) {
  const found = matchedLocal;
  const synergies: string[] = [];
  const recommendations: string[] = [];

  if (found.length === 0) {
    return {
      overallClass: "Ingredientes Primários / Excipientes Neutros",
      evidenceLevel: "Grau C",
      clinicalRating: 35,
      activesAnalyzed: [
        {
          name: "Umidade / Soluções Base",
          chemicalClass: "Fila de Excipientes Gerais",
          mechanism: "A composição inserida não contém nenhum ativo dermatológico atualmente catalogado em nosso compêndio científico de alto desempenho.",
          evidence: "Grau C"
        }
      ],
      synergies: [
        "A composição fornecida não pôde ser associada às interações ativas do banco de dados."
      ],
      conflicts: [],
      recommendations: [
        "Verifique se o nome dos compostos ativos está correto.",
        "Dica: Tente pesquisar por ativos de alta performance cadastrados no banco, como 'Retinol', 'Niacinamida', 'Ácido Salicílico', 'Ácido Hialurônico' ou 'Carnosina'!"
      ],
      unregisteredIngredients: unregisteredLocal
    };
  }

  // Format chemical classes into readable Portuguese
  const mappedActivesAnalyzed = found.map(item => {
    let chemicalClassName = item.chemicalClass;
    if (chemicalClassName === "ACIDS") chemicalClassName = "Ácidos Esfoliantes";
    else if (chemicalClassName === "AMIDES") chemicalClassName = "Amidas Hidrossolúveis";
    else if (chemicalClassName === "RETINOIDS") chemicalClassName = "Retinoides e Fitoanálogos";
    else if (chemicalClassName === "ANTIOXIDANTS") chemicalClassName = "Antioxidantes Celulares";
    else if (chemicalClassName === "PEPTIDES") chemicalClassName = "Peptídeos de Alta Sinergia";
    else if (chemicalClassName === "SOOTHING") chemicalClassName = "Regenerativos & Protetores de Barreira";
    else if (chemicalClassName === "ANTIMICROBIAL") chemicalClassName = "Agentes Antimicrobianos";
    else if (chemicalClassName === "SURFACTANTS") chemicalClassName = "Surfactantes & Limpeza";
    else if (chemicalClassName === "HUMECTANTS") chemicalClassName = "Umectantes & Solventes";
    else if (chemicalClassName === "BIOTECH") chemicalClassName = "Ativos Biotecnológicos";

    let evidenceLevelStr = "Grau C";
    if (item.studiesCount >= 50) evidenceLevelStr = "Grau A";
    else if (item.studiesCount >= 30) evidenceLevelStr = "Grau B";

    return {
      name: item.name,
      chemicalClass: chemicalClassName,
      mechanism: item.mechanism,
      evidence: evidenceLevelStr
    };
  });

  // Calculate scores from matched asset efficacies
  const totalEfficacy = found.reduce((sum, item) => sum + (item.efficacyRate || 80), 0);
  let averageEfficacy = Math.round(totalEfficacy / found.length);

  // Check for conflicts among matched items dynamically using database relations
  let conflictDeductions = 0;
  const activeConflictsFound: string[] = [];
  const processedConflictPairs = new Set<string>();

  for (const item of found) {
    const itemConflictsLower = (item.conflicts || "").toLowerCase();
    
    for (const other of found) {
      if (other.id === item.id) continue;
      
      const pairKey = [item.id, other.id].sort().join("<->");
      if (processedConflictPairs.has(pairKey)) continue;

      const otherNames = [other.name, other.namePt, other.nameEn, other.id].filter(Boolean).map(n => n.toLowerCase());
      const hasConflict = otherNames.some(name => itemConflictsLower.includes(name));
      
      if (hasConflict) {
        const clauses = (item.conflicts || "").split(/[;.]+/).map((c: string) => c.trim()).filter(Boolean);
        const matchingClause = clauses.find((clause: string) => {
          const clauseLower = clause.toLowerCase();
          return otherNames.some(name => clauseLower.includes(name));
        });
        const conflictDescription = matchingClause ? matchingClause : item.conflicts;

        activeConflictsFound.push(`Alerta de Conflito (${item.name} + ${other.name}): ${conflictDescription}.`);
        conflictDeductions += 15;
        processedConflictPairs.add(pairKey);
      }
    }
  }

  let finalRating = Math.max(20, averageEfficacy - conflictDeductions);
  finalRating = Math.min(98, finalRating);

  // Collect synergies from the database dynamically
  for (const item of found) {
    if (item.synergies) {
      synergies.push(`Sinergia (${item.name}): ${item.synergies}`);
    }
  }

  // Collect concentration guidelines and usage recommendations
  for (const item of found) {
    recommendations.push(
      `Faixa recomendada de ${item.name}: ${item.concentration}.`
    );
  }
  
  const categoriesLower = found.map(item => item.category.toLowerCase());
  if (categoriesLower.some(c => c.includes("despigmentante") || c.includes("rejuvenescimento"))) {
    recommendations.push("Importante: Associar fotoproteção avançada FPS 50+ na rotina diurna ao utilizar esta composição.");
  }
  if (categoriesLower.some(c => c.includes("hidratação") || c.includes("reparação"))) {
    recommendations.push("Excelente para integridade da barreira transepidérmica e hidratação.");
  }

  // Find predominant category
  const categoriesCount: Record<string, number> = {};
  for (const item of found) {
    categoriesCount[item.category] = (categoriesCount[item.category] || 0) + 1;
  }
  let predominantCategory = "Formulação Bio-Ativa";
  let maxCount = 0;
  for (const [cat, count] of Object.entries(categoriesCount)) {
    if (count > maxCount) {
      predominantCategory = cat;
      maxCount = count;
    }
  }

  const totalStudies = found.reduce((sum, item) => sum + (item.studiesCount || 0), 0);
  const averageStudies = totalStudies / found.length;

  let finalEvidenceLevel = "Grau C";
  if (averageStudies >= 50) {
    finalEvidenceLevel = "Grau A";
  } else if (averageStudies >= 30) {
    finalEvidenceLevel = "Grau B";
  }

  return {
    overallClass: `Foco em ${predominantCategory} (Mapeamento de Compêndio)`,
    evidenceLevel: finalEvidenceLevel,
    clinicalRating: finalRating,
    activesAnalyzed: mappedActivesAnalyzed,
    synergies: synergies,
    conflicts: activeConflictsFound,
    recommendations: recommendations,
    unregisteredIngredients: unregisteredLocal
  };
}

startServer();
