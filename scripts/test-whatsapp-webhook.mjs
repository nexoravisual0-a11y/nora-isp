import { GET, POST } from "../src/app/api/webhooks/whatsapp/route.ts";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

// Cargar .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const content = fs.readFileSync(envPath, "utf-8");
for (const line of content.split("\n")) {
  const t = line.trim();
  if (t && !t.startsWith("#")) {
    const idx = t.indexOf("=");
    if (idx > -1) {
      let val = t.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      process.env[t.slice(0, idx).trim()] = val;
    }
  }
}

async function testWebhook() {
  console.log("=== TEST WHATSAPP WEBHOOK ===");

  // 1. Probar GET (Verificación de Meta)
  const reqGetValid = new NextRequest(
    "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=nora_isp_verify_token&hub.challenge=CHALLENGE_META_ABC"
  );
  const resGetValid = await GET(reqGetValid);
  const textChallenge = await resGetValid.text();
  console.log(`1. Test GET Verificación Válida: Status ${resGetValid.status} | Challenge: "${textChallenge}"`);

  const reqGetInvalid = new NextRequest(
    "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=CHALLENGE_META_ABC"
  );
  const resGetInvalid = await GET(reqGetInvalid);
  console.log(`2. Test GET Verificación Inválida: Status ${resGetInvalid.status} (Esperado: 403)`);

  // 2. Probar POST (Mensaje Entrante simulando WhatsApp de María Elena)
  const metaPayload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "5491100000000",
                phone_number_id: "10987654321",
              },
              messages: [
                {
                  from: "5491123456789", // Teléfono de María Elena Rostagno
                  id: "wamid.HBgLNTQ5MTEyMzQ1Njc4OQ==",
                  timestamp: "1729980000",
                  text: {
                    body: "Hola Nora, se me cortó la fibra y tengo la luz roja LOS titilando en la cajita blanca.",
                  },
                  type: "text",
                },
              ],
            },
            field: "messages",
          },
        ],
      },
    ],
  };

  const reqPost = new NextRequest("http://localhost:3000/api/webhooks/whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metaPayload),
  });

  console.log("3. Enviando mensaje entrante simulado de WhatsApp...");
  const resPost = await POST(reqPost);
  const postBody = await resPost.json();
  console.log(`4. Test POST Mensaje Entrante: Status ${resPost.status} | Body:`, postBody);
  console.log("=== TEST FINALIZADO CON ÉXITO ===");
}

testWebhook().catch(console.error);
