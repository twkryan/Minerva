import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!process.env.CLERK_WEBHOOK_SIGNING_SECRET) {
    return NextResponse.json(
      { error: "Clerk webhook signing secret is not configured." },
      { status: 503 }
    );
  }

  try {
    const event = await verifyWebhook(request);

    if (event.type === "user.created") {
      const preferredName = [event.data.first_name, event.data.last_name]
        .filter(Boolean)
        .join(" ");

      await getPrisma().user.upsert({
        where: { id: event.data.id },
        create: {
          id: event.data.id,
          preferredName: preferredName || event.data.username || null,
        },
        update: {
          preferredName: preferredName || event.data.username || undefined,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Unable to verify Clerk webhook.", error);

    return NextResponse.json(
      { error: "Invalid webhook request." },
      { status: 400 }
    );
  }
}
