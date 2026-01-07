"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Settings {
  emailEnabled: boolean;
  emailFromName: string;
  emailFromAddress: string;
  emailSubjectTemplate: string;
  emailBodyTemplate: string;
  mailgunDomain: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({
    emailEnabled: false,
    emailFromName: "",
    emailFromAddress: "",
    emailSubjectTemplate: "",
    emailBodyTemplate: "",
    mailgunDomain: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function handleSendTestEmail() {
    setSendingTest(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmailRecipient }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send test email");
      }

      setSuccess("Test email sent - check your inbox!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      const data = await res.json();
      setSettings(data);
      setSuccess("Settings saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: keyof Settings, value: string | boolean) {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/dashboard" className="text-indigo-600 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-2">Email Settings</h1>
          <p className="text-gray-500 mt-1">Configure email notifications for successful orders</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Email Toggle */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Email Notifications</h3>
              <p className="text-sm text-gray-500">
                Send order confirmation emails to customers via Mailgun
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={(e) => handleChange("emailEnabled", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Mailgun Configuration */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h3 className="text-lg font-semibold">Mailgun Configuration</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mailgun Domain</label>
              <input
                type="text"
                value={settings.mailgunDomain}
                onChange={(e) => handleChange("mailgunDomain", e.target.value)}
                placeholder="mg.yourdomain.com"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1">Your Mailgun sending domain</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input
                type="text"
                disabled
                value="••••••••••••••••"
                className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">Set via MAILGUN_API_KEY in .env file</p>
            </div>
          </div>
        </div>

        {/* Sender Configuration */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h3 className="text-lg font-semibold">Sender Configuration</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
              <input
                type="text"
                value={settings.emailFromName}
                onChange={(e) => handleChange("emailFromName", e.target.value)}
                placeholder="AutoBeli Store"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Email Address
              </label>
              <input
                type="email"
                value={settings.emailFromAddress}
                onChange={(e) => handleChange("emailFromAddress", e.target.value)}
                placeholder="noreply@yourdomain.com"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1">Must be verified in Mailgun</p>
            </div>
          </div>
        </div>

        {/* Email Templates */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Email Template</h3>
            <p className="text-sm text-gray-500">
              Use these variables: {"{{orderId}}"}, {"{{productTitle}}"}, {"{{amountPaid}}"},{" "}
              {"{{orderDate}}"}, {"{{orderLink}}"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
            <input
              type="text"
              value={settings.emailSubjectTemplate}
              onChange={(e) => handleChange("emailSubjectTemplate", e.target.value)}
              placeholder="Your purchase is complete - {{productTitle}}"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
            <textarea
              value={settings.emailBodyTemplate}
              onChange={(e) => handleChange("emailBodyTemplate", e.target.value)}
              rows={12}
              placeholder="Hello! Thank you for your purchase..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
            />
          </div>
        </div>

        {/* Test Email */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h3 className="text-lg font-semibold">Send Test Email</h3>
          <p className="text-sm text-gray-500">
            Send a test email to verify your settings and template.
          </p>

          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="Enter recipient email"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={sendingTest || !testEmailRecipient}
              className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
            >
              {sendingTest ? "Sending..." : "Send Test"}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
