import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/settings";
import { validate, updateSettingsSchema } from "@/lib/validation";

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get application settings
 *     description: Retrieves all application settings including email configuration. Requires admin authentication.
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       401:
 *         description: Unauthorized - Admin login required
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();

  // Don't expose sensitive internal fields
  const { _id, ...publicSettings } = settings;
  void _id; // Suppress unused variable warning

  return NextResponse.json(publicSettings);
}

/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update application settings
 *     description: Updates application settings including email configuration. Requires admin authentication.
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
 *               emailEnabled:
 *                 type: boolean
 *               emailFromName:
 *                 type: string
 *               emailFromAddress:
 *                 type: string
 *               emailSubjectTemplate:
 *                 type: string
 *               emailBodyTemplate:
 *                 type: string
 *               mailgunDomain:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized - Admin login required
 */
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = validate(updateSettingsSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const updatedSettings = await updateSettings(validation.data!);

    // Don't expose sensitive internal fields
    const { _id, ...publicSettings } = updatedSettings;
    void _id;

    return NextResponse.json(publicSettings);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
