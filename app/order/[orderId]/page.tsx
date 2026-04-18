import { getOrderWithProduct, syncOrderPaymentStatus } from "@/lib/orders";
import { getOrderAccessToken } from "@/lib/delivery";
import { notFound, redirect } from "next/navigation";
import ContentViewer from "@/components/ContentViewer";
import Link from "next/link";
import ScrollAnimate from "@/components/ui/ScrollAnimate";

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

    // Show "Payment Processing" state with kinetic geometry
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 relative">
        {/* Kinetic Geometry Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <svg
            className="absolute w-full h-full"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <radialGradient id="pendingGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#eab308" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#eab308" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="500" cy="500" r="400" fill="url(#pendingGlow)" />

            <g className="animate-orbit-slow" style={{ transformOrigin: "500px 500px" }}>
              <circle
                cx="500"
                cy="500"
                r="350"
                fill="none"
                stroke="#eab308"
                strokeWidth="0.5"
                strokeOpacity="0.15"
              />
              <circle cx="850" cy="500" r="6" fill="#eab308" fillOpacity="0.2" />
            </g>
            <g className="animate-orbit-medium" style={{ transformOrigin: "500px 500px" }}>
              <circle
                cx="500"
                cy="500"
                r="250"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="0.5"
                strokeOpacity="0.1"
                strokeDasharray="15 8"
              />
              <circle cx="750" cy="500" r="8" fill="#f59e0b" fillOpacity="0.25" />
            </g>
            <g className="animate-orbit-reverse" style={{ transformOrigin: "500px 500px" }}>
              <circle
                cx="500"
                cy="500"
                r="150"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="0.5"
                strokeOpacity="0.15"
              />
              <circle cx="350" cy="500" r="5" fill="#fbbf24" fillOpacity="0.2" />
            </g>
          </svg>
        </div>

        <div className="max-w-lg w-full">
          <ScrollAnimate animation="scale">
            <div className="bg-white rounded-3xl p-10 md:p-14 shadow-2xl shadow-yellow-100/50 border border-yellow-100 text-center relative overflow-hidden">
              {/* Kinetic geometry accent */}
              <div className="absolute inset-0 pointer-events-none">
                <svg
                  className="absolute w-full h-full"
                  viewBox="0 0 400 500"
                  preserveAspectRatio="xMaxYMin slice"
                >
                  <g className="animate-orbit-fast" style={{ transformOrigin: "350px 80px" }}>
                    <circle
                      cx="350"
                      cy="80"
                      r="40"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="0.5"
                      strokeOpacity="0.2"
                    />
                    <circle cx="390" cy="80" r="3" fill="#eab308" fillOpacity="0.3" />
                  </g>
                </svg>
              </div>

              <div className="relative">
                {/* Animated Orbital Icon */}
                <div className="relative mb-8 inline-block">
                  <div className="relative w-24 h-24 mx-auto">
                    {/* Orbiting rings */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 96 96">
                      <g className="animate-orbit-slow" style={{ transformOrigin: "48px 48px" }}>
                        <circle
                          cx="48"
                          cy="48"
                          r="44"
                          fill="none"
                          stroke="#eab308"
                          strokeWidth="1"
                          strokeOpacity="0.3"
                        />
                        <circle cx="92" cy="48" r="4" fill="#eab308" fillOpacity="0.5" />
                      </g>
                      <g className="animate-orbit-reverse" style={{ transformOrigin: "48px 48px" }}>
                        <circle
                          cx="48"
                          cy="48"
                          r="32"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="1"
                          strokeOpacity="0.4"
                          strokeDasharray="6 4"
                        />
                        <circle cx="16" cy="48" r="3" fill="#f59e0b" fillOpacity="0.6" />
                      </g>
                    </svg>
                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl flex items-center justify-center border border-yellow-200 shadow-lg">
                        <svg
                          className="w-7 h-7 text-yellow-600"
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
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                  Payment Processing
                </h1>
                <p className="text-gray-500 mb-10 leading-relaxed max-w-sm mx-auto">
                  We&apos;re verifying your payment with the gateway. This usually takes just a few
                  moments.
                </p>

                <div className="space-y-4">
                  <a
                    href={`/order/${orderId}`}
                    className="group relative block w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-5 px-6 rounded-2xl shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/30 hover:-translate-y-1 active:translate-y-0 transition-all overflow-hidden"
                  >
                    <span className="absolute inset-0 opacity-20">
                      <svg
                        className="w-full h-full"
                        viewBox="0 0 300 60"
                        preserveAspectRatio="none"
                      >
                        <circle
                          cx="260"
                          cy="30"
                          r="20"
                          fill="none"
                          stroke="white"
                          strokeWidth="0.5"
                          className="animate-orbit-fast"
                          style={{ transformOrigin: "260px 30px" }}
                        />
                      </svg>
                    </span>
                    <span className="relative flex items-center justify-center gap-3">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                    className="block w-full text-gray-600 font-semibold py-4 px-6 rounded-2xl hover:bg-gray-50 hover:text-gray-900 transition-all"
                  >
                    Try Payment Again
                  </a>
                </div>

                {/* Progress Indicator */}
                <div className="mt-10 pt-8 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-breathe" />
                    <span>Waiting for payment confirmation...</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimate>
        </div>
      </div>
    );
  }

  // 3. Retrieve Access Token (Server-Side)
  const token = await getOrderAccessToken(orderId);

  return (
    <div className="min-h-[80vh] py-8 md:py-16 relative">
      {/* Kinetic Geometry Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="successGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#22c55e" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="500" cy="500" r="450" fill="url(#successGlow)" />

          <g className="animate-orbit-slow" style={{ transformOrigin: "500px 500px" }}>
            <circle
              cx="500"
              cy="500"
              r="400"
              fill="none"
              stroke="#22c55e"
              strokeWidth="0.5"
              strokeOpacity="0.1"
            />
            <circle cx="900" cy="500" r="6" fill="#22c55e" fillOpacity="0.15" />
          </g>
          <g className="animate-orbit-medium" style={{ transformOrigin: "500px 500px" }}>
            <circle
              cx="500"
              cy="500"
              r="300"
              fill="none"
              stroke="#4ade80"
              strokeWidth="0.5"
              strokeOpacity="0.1"
              strokeDasharray="20 10"
            />
            <circle cx="800" cy="500" r="8" fill="#4ade80" fillOpacity="0.2" />
          </g>
          <g className="animate-orbit-reverse" style={{ transformOrigin: "500px 500px" }}>
            <circle
              cx="500"
              cy="500"
              r="200"
              fill="none"
              stroke="#86efac"
              strokeWidth="0.5"
              strokeOpacity="0.1"
            />
            <circle cx="300" cy="500" r="5" fill="#86efac" fillOpacity="0.15" />
          </g>
        </svg>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Success Header with orbital animation */}
        <ScrollAnimate animation="scale">
          <div className="text-center mb-12">
            <div className="relative inline-block mb-6">
              <div className="relative w-24 h-24 mx-auto">
                {/* Orbiting success rings */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 96 96">
                  <g className="animate-orbit-slow" style={{ transformOrigin: "48px 48px" }}>
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="1"
                      strokeOpacity="0.3"
                    />
                    <circle cx="92" cy="48" r="4" fill="#22c55e" fillOpacity="0.5" />
                  </g>
                  <g className="animate-orbit-reverse" style={{ transformOrigin: "48px 48px" }}>
                    <circle
                      cx="48"
                      cy="48"
                      r="32"
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="1"
                      strokeOpacity="0.4"
                      strokeDasharray="6 4"
                    />
                    <circle cx="16" cy="48" r="3" fill="#4ade80" fillOpacity="0.6" />
                  </g>
                </svg>
                {/* Center checkmark */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                    <svg
                      className="w-8 h-8 text-white"
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
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
              Purchase Successful!
            </h1>
            <p className="text-gray-500 text-lg">Your digital content is ready to access.</p>
          </div>
        </ScrollAnimate>

        <div className="grid md:grid-cols-12 gap-8">
          {/* Order Info Sidebar */}
          <ScrollAnimate animation="slide-left">
            <div className="md:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                  <div className="relative w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
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
                  <h3 className="font-bold text-gray-900 uppercase tracking-wider text-sm">
                    Order Details
                  </h3>
                </div>

                <div className="space-y-5">
                  <div className="group">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                      Product
                    </span>
                    <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {order.product.title}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                      Total Paid
                    </span>
                    <span className="font-bold text-xl text-green-600">
                      Rp {order.amountPaid.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                      Date
                    </span>
                    <span className="text-gray-700">
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
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                      Payment Method
                    </span>
                    <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-breathe" />
                      <span className="font-semibold text-sm text-gray-700">
                        {order.paymentGateway}
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                      Order ID
                    </span>
                    <span className="font-mono text-xs text-gray-500 break-all">{orderId}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <ScrollAnimate animation="fade-up" delay={100}>
                <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100">
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
              </ScrollAnimate>
            </div>
          </ScrollAnimate>

          {/* Content Delivery Area */}
          <ScrollAnimate animation="slide-right">
            <div className="md:col-span-8">
              {!token ? (
                <div className="relative p-10 bg-gradient-to-br from-red-50 to-pink-50 text-red-700 rounded-3xl border border-red-100 shadow-lg overflow-hidden">
                  {/* Error kinetic accent */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg
                      className="absolute w-full h-full"
                      viewBox="0 0 400 200"
                      preserveAspectRatio="xMaxYMax slice"
                    >
                      <g className="animate-orbit-slow" style={{ transformOrigin: "350px 150px" }}>
                        <circle
                          cx="350"
                          cy="150"
                          r="40"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="0.5"
                          strokeOpacity="0.2"
                        />
                        <circle cx="390" cy="150" r="3" fill="#ef4444" fillOpacity="0.3" />
                      </g>
                    </svg>
                  </div>
                  <div className="flex items-start gap-4 relative">
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
                      <h3 className="font-bold text-xl mb-2">Delivery Error</h3>
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
          </ScrollAnimate>
        </div>
      </div>
    </div>
  );
}
