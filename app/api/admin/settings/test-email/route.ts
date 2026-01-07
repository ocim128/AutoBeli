import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendTestEmail } from "@/lib/mailgun";
import { validate, sendTestEmailSchema } from "@/lib/validation";

/**
 * @swagger
 * /api/admin/settings/test-email:
 *   post:
 *     summary: Send a test email
 *     description: Sends a test email to the specified recipient to verify Email/Mailgun settings. Requires admin authentication.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test email sent successfully
 *       400:
 *         description: Invalid email or configuration error
 *       401:
 *         description: Unauthorized - Admin login required
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = validate(sendTestEmailSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { email } = validation.data!;

    const result = await sendTestEmail(email);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, messageId: result.message });
  } catch (error) {
    console.error("Failed to send test email:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
