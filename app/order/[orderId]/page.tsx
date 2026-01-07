import { getOrderWithProduct, syncOrderPaymentStatus } from "@/lib/orders";
import { getOrderAccessToken } from "@/lib/delivery";
import { notFound, redirect } from "next/navigation";
import ContentViewer from "@/components/ContentViewer";
import Link from "next/link";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderPage({ params }: Props) {
  const { orderId } = await params;

  // 0. Sync Status with Gateway (in case webhook was missed)
  await syncOrderPaymentStatus(orderId);

  // 1. Fetch Order Status
  const order = await getOrderWithProduct(orderId);
  if (!order) notFound();

  // 2. Handle Pending State
  if (order.status !== "PAID") {
    // If sending fresh to checkout, check if we have a transaction ref (meaning user attempted payment)
    const hasPendingPayment = order.paymentMetadata?.transaction_ref;

    if (!hasPendingPayment) {
      redirect(`/checkout/${orderId}`);
    }

    // Show "Payment Processing" state with premium UI
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="max-w-lg w-full">
          <div className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-2xl shadow-yellow-100/50 border border-yellow-100/50 text-center relative overflow-hidden">
            {/* Decorative corner gradient */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-2xl" />

            <div className="relative">
              {/* Animated Icon */}
              <div className="relative mb-8 inline-block">
                <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-yellow-50 to-orange-50 rounded-full flex items-center justify-center border-2 border-yellow-200/50 shadow-lg shadow-yellow-100">
                  <svg
                    className="w-12 h-12 text-yellow-600 animate-spin-slow"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">
                Payment Processing
              </h1>
              <p className="text-gray-500 mb-10 leading-relaxed max-w-sm mx-auto">
                We&apos;re verifying your payment with the gateway. This usually takes just a few
                moments.
              </p>

              <div className="space-y-4">
                <a
                  href={`/order/${orderId}`}
                  className="group relative block w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-black py-5 px-6 rounded-2xl shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/30 hover:-translate-y-1 active:translate-y-0 transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                  <span className="relative flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Check Payment Status
                  </span>
                </a>
                <a
                  href={`/checkout/${orderId}?retry=true`}
                  className="block w-full text-gray-600 font-bold py-4 px-6 rounded-2xl hover:bg-gray-50 hover:text-gray-900 transition-all"
                >
                  Try Payment Again
                </a>
              </div>

              {/* Progress Indicator */}
              <div className="mt-10 pt-8 border-t border-gray-100">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span>Waiting for payment confirmation...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Retrieve Access Token (Server-Side)
  // This token is passed to the client component to "claim" the content.
  const token = await getOrderAccessToken(orderId);

  return (
    <div className="min-h-[80vh] py-8 md:py-16">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">
            Purchase Successful!
          </h1>
          <p className="text-gray-500 font-medium text-lg">
            Your digital content is ready to access.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          {/* Order Info Sidebar */}
          <div className="md:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="font-black text-gray-900 uppercase tracking-wider text-sm">
                  Order Details
                </h3>
              </div>

              <div className="space-y-5">
                <div className="group">
                  <span className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
                    Product
                  </span>
                  <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {order.product.title}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
                    Total Paid
                  </span>
                  <span className="font-black text-xl text-green-600">
                    Rp {order.amountPaid.toLocaleString("id-ID")}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
                    Date
                  </span>
                  <span className="font-medium text-gray-700">
                    {new Date(order.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
                    Payment Method
                  </span>
                  <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-bold text-sm text-gray-700">{order.paymentGateway}</span>
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
                    Order ID
                  </span>
                  <span className="font-mono text-xs text-gray-500 break-all">{orderId}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
              <p className="text-sm text-indigo-900 font-bold mb-3">Need help?</p>
              <Link
                href="/recover"
                className="flex items-center gap-2 text-indigo-600 font-medium text-sm hover:text-indigo-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Find your other orders →
              </Link>
            </div>
          </div>

          {/* Content Delivery Area */}
          <div className="md:col-span-8">
            {!token ? (
              <div className="p-10 bg-gradient-to-br from-red-50 to-pink-50 text-red-700 rounded-[2rem] border border-red-100 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-black text-xl mb-2">Delivery Error</h3>
                    <p className="text-red-600">
                      Payment was successful, but the access token could not be found. Please
                      contact support with your order ID.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <ContentViewer token={token} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
