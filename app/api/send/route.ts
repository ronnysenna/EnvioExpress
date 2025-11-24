import axios from "axios";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";
import { checkPlanLimits, incrementUsage } from "@/lib/planLimits";
import { trackEvent, EventNames } from "@/lib/analytics";

export async function POST(req: Request) {
  try {
    const { tenant, user } = await requireAuth();
    const tenantId = tenant.id;

    const WEBHOOK_URL = process.env.WEBHOOK_URL;
    if (!WEBHOOK_URL) {
      return NextResponse.json(
        { error: "WEBHOOK_URL not configured on server" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { message, imageUrl, contacts, groupIds } = body;
    if (!message) {
      return NextResponse.json(
        { error: "Invalid payload: message is required" },
        { status: 400 }
      );
    }

    // Extrair apenas o caminho da URL da imagem (/api/uploads/filename)
    // Se não houver imagem, usar "sem-imagem"
    let imagemPath = "sem-imagem";
    if (imageUrl && typeof imageUrl === "string") {
      // Se for URL completa, extrair apenas o pathname
      if (imageUrl.includes("://")) {
        try {
          const url = new URL(imageUrl);
          imagemPath = url.pathname; // Resultado: /api/download/1761503198117-PM.jpg
        } catch {
          imagemPath = "sem-imagem";
        }
      } else {
        // Se já for um caminho, usar como está
        imagemPath = imageUrl;
      }
    }

    // build payload to n8n com contatos selecionados em estrutura organizada
    // Construir URL completa da imagem (para N8N conseguir fazer download)
    let imagemUrlCompleta = "sem-imagem";
    if (imagemPath !== "sem-imagem") {
      // Em produção no Easypanel, usar URL base do ambiente
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        (() => {
          const protocol = req.headers.get("x-forwarded-proto") || "https";
          const host =
            req.headers.get("x-forwarded-host") ||
            req.headers.get("host") ||
            "localhost:3000";
          return `${protocol}://${host}`;
        })();
      imagemUrlCompleta = `${baseUrl}${imagemPath}`;
    }

    const payload: Record<string, unknown> = {
      message,
      imagemUrl: imagemUrlCompleta,
      tenantId,
    };

    let totalMessagesToSend = 0;

    // Se groupIds foram fornecidos, buscar contatos desses grupos (garantindo pertencimento ao tenant)
    if (Array.isArray(groupIds) && groupIds.length > 0) {
      // Os groupIds agora são strings (cuid)
      const groupIdsString = groupIds.filter(
        (g: unknown) => typeof g === "string" && g.length > 0
      );

      const contactsFromGroups = await prisma.contact.findMany({
        where: {
          groups: {
            some: {
              group: {
                id: { in: groupIdsString },
                tenantId,
              },
            },
          },
        },
        select: { nome: true, telefone: true },
      });

      // deduplicar por telefone (enforce unique list)
      const seen = new Set<string>();
      const uniqueList: Array<{ nome: string; telefone: string }> = [];
      for (const c of contactsFromGroups) {
        if (!c || !c.telefone) continue;
        if (!seen.has(c.telefone)) {
          seen.add(c.telefone);
          uniqueList.push({ nome: c.nome, telefone: c.telefone });
        }
      }

      totalMessagesToSend = uniqueList.length;
      payload.selectedContacts = {
        total: uniqueList.length,
        list: uniqueList,
      };
    } else {
      // Se contatos foram fornecidos diretamente, incluir no payload como objeto estruturado
      if (Array.isArray(contacts) && contacts.length > 0) {
        totalMessagesToSend = contacts.length;
        payload.selectedContacts = {
          total: contacts.length,
          list: contacts.map((c: Record<string, unknown>) => ({
            nome: c.nome,
            telefone: c.telefone,
          })),
        };
      }
    }

    // Verificar limites do plano ANTES de enviar mensagens
    if (totalMessagesToSend > 0) {
      // Verificar se tem permissão para enviar mensagens
      const limitCheck = await checkPlanLimits("send_message", tenantId);
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: limitCheck.error || "Limite do plano excedido",
            limit: limitCheck.limit,
            current: limitCheck.current,
            upgradeRequired: true,
          },
          { status: 403 }
        );
      }

      // TODO: Verificar se o número total de mensagens + o que já foi enviado este mês não excede o limite
      // Isso seria uma verificação mais sofisticada do que apenas se pode enviar uma mensagem
    }

    // Log para debug (remover em produção se necessário)
    console.log("[WEBHOOK DEBUG]", {
      imagemPath,
      imagemUrlCompleta,
      baseUrl:
        imagemUrlCompleta !== "sem-imagem"
          ? imagemUrlCompleta.split("/api/uploads/")[0]
          : "N/A",
      messageLength: message.length,
      contactsCount: Array.isArray(contacts) ? contacts.length : 0,
    });

    try {
      const response = await axios.post(WEBHOOK_URL, payload, {
        timeout: 30000,
      });

      // Incrementar contador de mensagens enviadas
      if (totalMessagesToSend > 0) {
        await incrementUsage(tenantId, "messages", totalMessagesToSend);
      }

      // Track event de envio de mensagem
      await trackEvent({
        name: EventNames.MESSAGE_SENT,
        tenantId,
        userId: user.id,
        properties: {
          messageLength: message.length,
          contactsCount: totalMessagesToSend,
          hasImage: imagemPath !== "sem-imagem",
          useGroups: Array.isArray(groupIds) && groupIds.length > 0,
        },
      });

      return NextResponse.json(
        { success: true, status: response.status, data: response.data },
        { status: 200 }
      );
    } catch (axiosErr: unknown) {
      // if n8n responded with an error status, forward that information
      const upstreamErr = axiosErr as
        | { response?: { status?: number; data?: unknown } }
        | undefined;
      const upstreamStatus = upstreamErr?.response?.status ?? 502;
      const upstreamData = upstreamErr?.response?.data ?? null;
      return NextResponse.json(
        {
          error: "Upstream webhook error",
          status: upstreamStatus,
          data: upstreamData,
        },
        { status: upstreamStatus }
      );
    }
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
