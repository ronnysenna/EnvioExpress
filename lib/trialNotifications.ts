import prisma from "./prisma";
import { getTrialInfo } from "./trial";

export interface TrialNotificationData {
  email: string;
  name: string;
  companyName: string;
  daysRemaining: number;
  trialEndsAt: Date;
}

/**
 * Get tenants with trials that need notifications
 */
export async function getTrialsNeedingNotification(): Promise<
  TrialNotificationData[]
> {
  const now = new Date();

  // Get all active trials
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: "TRIAL",
      trialEndsAt: {
        gte: now,
      },
    },
    include: {
      tenant: {
        include: {
          users: {
            where: {
              role: "OWNER",
            },
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  const notifications: TrialNotificationData[] = [];

  for (const subscription of subscriptions) {
    const trialInfo = await getTrialInfo(subscription.tenantId);
    const owner = subscription.tenant.users[0]?.user;

    if (!owner || !trialInfo.isOnTrial) continue;

    // Send notifications for 3 days, 1 day, and expiration
    const shouldNotify =
      trialInfo.trialDaysRemaining === 3 ||
      trialInfo.trialDaysRemaining === 1 ||
      trialInfo.trialDaysRemaining === 0;

    if (shouldNotify) {
      notifications.push({
        email: owner.email,
        name: owner.name || owner.username,
        companyName: subscription.tenant.name,
        daysRemaining: trialInfo.trialDaysRemaining,
        trialEndsAt: subscription.trialEndsAt!,
      });
    }
  }

  return notifications;
}

/**
 * Send trial notification email
 */
export async function sendTrialNotification(
  data: TrialNotificationData
): Promise<boolean> {
  try {
    // For now, we'll just log the notification
    // In a real app, you'd integrate with an email service like SendGrid, Nodemailer, etc.

    const subject = getEmailSubject(data.daysRemaining);
    const message = getEmailMessage(data);

    console.log(`📧 Trial Notification Email:
To: ${data.email}
Subject: ${subject}
Company: ${data.companyName}
Days Remaining: ${data.daysRemaining}

${message}
`);

    // TODO: Implement actual email sending
    // Example with a hypothetical email service:
    /*
        await emailService.send({
            to: data.email,
            subject,
            html: getEmailTemplate(data),
            text: message
        });
        */

    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação de trial:", error);
    return false;
  }
}

/**
 * Get email subject based on days remaining
 */
function getEmailSubject(daysRemaining: number): string {
  if (daysRemaining === 0) {
    return "🚨 Seu trial gratuito expirou hoje - EnvioExpress";
  } else if (daysRemaining === 1) {
    return "⏰ Último dia do seu trial gratuito - EnvioExpress";
  } else if (daysRemaining === 3) {
    return "⚠️ Seu trial gratuito expira em 3 dias - EnvioExpress";
  }
  return `📅 ${daysRemaining} dias restantes no seu trial - EnvioExpress`;
}

/**
 * Get email message based on trial status
 */
function getEmailMessage(data: TrialNotificationData): string {
  const { name, companyName, daysRemaining, trialEndsAt } = data;
  const endDate = trialEndsAt.toLocaleDateString("pt-BR");

  if (daysRemaining === 0) {
    return `
Olá ${name},

Seu período de avaliação gratuito de 7 dias para ${companyName} expirou hoje (${endDate}).

Para continuar aproveitando todos os recursos premium do EnvioExpress, você precisa escolher um plano pago.

🚀 O que você perde sem um plano ativo:
• Envio de mensagens em massa
• Gestão avançada de contatos
• Relatórios e analytics detalhados
• Suporte prioritário

Mantenha seu fluxo de trabalho sem interrupções - atualize agora!

[Escolher Plano]

Obrigado por experimentar o EnvioExpress!
`;
  }

  if (daysRemaining === 1) {
    return `
Olá ${name},

Este é seu último dia de trial gratuito para ${companyName}! 

Seu acesso aos recursos premium expira amanhã (${endDate}).

💎 Continue aproveitando:
• Envios ilimitados
• Segmentação avançada
• Analytics em tempo real
• Integrações via API

Não perca seus dados e configurações - faça upgrade hoje!

[Atualizar Plano]

Equipe EnvioExpress
`;
  }

  return `
Olá ${name},

Você tem apenas ${daysRemaining} dias restantes no seu trial gratuito para ${companyName}.

Seu trial expira em ${endDate}.

🎯 Aproveite ao máximo estes dias finais:
• Teste todos os recursos premium
• Configure suas campanhas
• Importe seus contatos
• Explore nossa API

Não deixe para a última hora - garante sua continuidade!

[Ver Planos]

Atenciosamente,
Equipe EnvioExpress
`;
}

/**
 * Get HTML email template
 */
function getEmailTemplate(data: TrialNotificationData): string {
  const { name, companyName, daysRemaining } = data;

  const isExpired = daysRemaining === 0;
  const isLastDay = daysRemaining === 1;

  const bgColor = isExpired ? "#dc2626" : isLastDay ? "#ea580c" : "#3b82f6";
  const title = isExpired
    ? "Trial Expirado"
    : `${daysRemaining} Dias Restantes`;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EnvioExpress Trial Notification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; margin-top: 20px;">
        <div style="background-color: ${bgColor}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${title}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">EnvioExpress Trial - ${companyName}</p>
        </div>
        
        <div style="padding: 30px;">
            <p style="font-size: 18px; margin-top: 0;">Olá ${name},</p>
            
            ${getEmailMessage(data)
              .split("\n")
              .map((line) =>
                line.trim()
                  ? `<p style="line-height: 1.6; color: #374151;">${line.trim()}</p>`
                  : ""
              )
              .join("")}
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://envioexpress.com/plans" 
                   style="background-color: ${bgColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    ${
                      isExpired
                        ? "Escolher Plano"
                        : isLastDay
                        ? "Atualizar Agora"
                        : "Ver Planos"
                    }
                </a>
            </div>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                © 2024 EnvioExpress. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>
`;
}

/**
 * Process all trial notifications
 */
export async function processTrialNotifications(): Promise<{
  sent: number;
  failed: number;
}> {
  const notifications = await getTrialsNeedingNotification();

  let sent = 0;
  let failed = 0;

  for (const notification of notifications) {
    const success = await sendTrialNotification(notification);
    if (success) {
      sent++;
    } else {
      failed++;
    }

    // Small delay to avoid overwhelming email service
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(
    `🏁 Trial notifications processed: ${sent} sent, ${failed} failed`
  );

  return { sent, failed };
}
