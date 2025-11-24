#!/usr/bin/env node

/**
 * Script para verificação automática de trials expirados
 * Pode ser executado como cron job ou manualmente
 *
 * Uso:
 * node scripts/check-trials.js
 *
 * Como cron job (executar diariamente às 9:00):
 * 0 9 * * * cd /caminho/para/projeto && node scripts/check-trials.js >> /var/log/trial-check.log 2>&1
 */

const https = require("https");
const http = require("http");

// Configuração
const config = {
  baseUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
  apiKey: process.env.ADMIN_API_KEY || "", // Opcional: para autenticação de admin
};

/**
 * Faz uma requisição HTTP/HTTPS
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === "https:" ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const req = lib.request(requestOptions, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Verifica trials expirados
 */
async function checkExpiredTrials() {
  try {
    console.log(
      `[${new Date().toISOString()}] 🔄 Iniciando verificação de trials expirados...`
    );

    const response = await makeRequest(
      `${config.baseUrl}/api/cron/check-trials`,
      {
        method: "POST",
        headers: config.apiKey
          ? { Authorization: `Bearer ${config.apiKey}` }
          : {},
      }
    );

    if (response.statusCode === 200) {
      const { summary } = response.data;
      console.log(`✅ Verificação concluída com sucesso:`);
      console.log(`   - Trials verificados: ${summary.totalChecked}`);
      console.log(`   - Trials expirados: ${summary.expired}`);
      console.log(`   - Notificações enviadas: ${summary.notified}`);
      return true;
    } else {
      console.error(`❌ Erro na verificação: ${response.statusCode}`);
      console.error(`   Response:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`💥 Erro fatal na verificação:`, error.message);
    return false;
  }
}

/**
 * Envia notificações de trial
 */
async function sendTrialNotifications() {
  try {
    console.log(
      `[${new Date().toISOString()}] 📧 Enviando notificações de trial...`
    );

    const response = await makeRequest(
      `${config.baseUrl}/api/trials/notifications`,
      {
        method: "POST",
        headers: config.apiKey
          ? { Authorization: `Bearer ${config.apiKey}` }
          : {},
      }
    );

    if (response.statusCode === 200) {
      const { data } = response.data;
      console.log(`✅ Notificações processadas:`);
      console.log(`   - Enviadas: ${data.sent}`);
      console.log(`   - Falhas: ${data.failed}`);
      return true;
    } else {
      console.error(`❌ Erro nas notificações: ${response.statusCode}`);
      console.error(`   Response:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`💥 Erro fatal nas notificações:`, error.message);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log("🚀 Trial Check Script v1.0");
  console.log(`📅 ${new Date().toLocaleString("pt-BR")}`);
  console.log(`🌐 Base URL: ${config.baseUrl}`);
  console.log("━".repeat(50));

  let success = true;

  // 1. Verificar trials expirados
  success = (await checkExpiredTrials()) && success;

  // 2. Enviar notificações
  success = (await sendTrialNotifications()) && success;

  console.log("━".repeat(50));

  if (success) {
    console.log("🎉 Verificação automática concluída com sucesso!");
    process.exit(0);
  } else {
    console.log("❌ Verificação concluída com erros.");
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente (não via require)
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Erro não capturado:", error);
    process.exit(1);
  });
}

module.exports = {
  checkExpiredTrials,
  sendTrialNotifications,
  main,
};
