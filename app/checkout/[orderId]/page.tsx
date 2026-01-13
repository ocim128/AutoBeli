import { getOrderWithProduct } from "@/lib/orders";
import { notFound, redirect } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import Link from "next/link";

interface Props {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { retry } = await searchParams;
  const order = await getOrderWithProduct(orderId);

  if (!order) {
    notFound();
  }

  // If already paid OR has pending payment (and not retrying), redirect to order status page
  const isRetrying = retry === "true";
  if (order.status === "PAID" || (order.paymentMetadata?.transaction_ref && !isRetrying)) {
    redirect(`/order/${orderId}`);
  }

  // Calculate total amount
  const quantity = order.quantity || 1;
  const totalAmount = order.product.priceIdr * quantity;

  return (
    <div className="min-h-[80vh] py-8 md:py-16 relative">
      {/* Kinetic Geometry Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Central glow */}
          <defs>
            <radialGradient id="checkoutGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="500" cy="500" r="450" fill="url(#checkoutGlow)" />

          {/* Orbiting rings */}
          <g className="animate-orbit-slow" style={{ transformOrigin: "500px 500px" }}>
            <circle
              cx="500"
              cy="500"
              r="400"
              fill="none"
              stroke="#6366f1"
              strokeWidth="0.5"
              strokeOpacity="0.1"
            />
            <circle cx="900" cy="500" r="6" fill="#6366f1" fillOpacity="0.15" />
          </g>
          <g className="animate-orbit-medium" style={{ transformOrigin: "500px 500px" }}>
            <circle
              cx="500"
              cy="500"
              r="300"
              fill="none"
              stroke="#818cf8"
              strokeWidth="0.5"
              strokeOpacity="0.1"
              strokeDasharray="20 10"
            />
            <circle cx="800" cy="500" r="8" fill="#818cf8" fillOpacity="0.2" />
          </g>
          <g className="animate-orbit-reverse" style={{ transformOrigin: "500px 500px" }}>
            <circle
              cx="500"
              cy="500"
              r="200"
              fill="none"
              stroke="#a5b4fc"
              strokeWidth="0.5"
              strokeOpacity="0.1"
            />
            <circle cx="300" cy="500" r="5" fill="#a5b4fc" fillOpacity="0.15" />
          </g>
        </svg>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-xs font-semibold uppercase tracking-wider text-gray-400 mb-8 space-x-3 bg-white/80 backdrop-blur-sm w-fit px-5 py-2.5 rounded-full border border-indigo-100 shadow-sm scroll-fade-in">
          <Link
            href="/"
            className="hover:text-indigo-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Store
          </Link>
          <span className="opacity-30">/</span>
          <Link
            href={`/product/${order.product.slug}`}
            className="hover:text-indigo-600 transition-colors truncate max-w-[120px]"
          >
            {order.product.title}
          </Link>
          <span className="opacity-30">/</span>
          <span className="text-indigo-600">Checkout</span>
        </nav>

        {/* Main checkout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side - Order Summary */}
          <div className="lg:col-span-5 lg:order-2">
            <div className="sticky top-28 space-y-6">
              {/* Order Summary Card with Kinetic Geometry */}
              <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 text-white shadow-2xl shadow-gray-900/30 overflow-hidden scroll-slide-right">
                {/* Kinetic geometry accent */}
                <div className="absolute inset-0 pointer-events-none">
                  <svg
                    className="absolute w-full h-full"
                    viewBox="0 0 300 400"
                    preserveAspectRatio="xMaxYMax slice"
                  >
                    <g className="animate-orbit-slow" style={{ transformOrigin: "250px 350px" }}>
                      <circle
                        cx="250"
                        cy="350"
                        r="80"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="0.5"
                        strokeOpacity="0.15"
                      />
                      <circle cx="330" cy="350" r="4" fill="#6366f1" fillOpacity="0.3" />
                    </g>
                    <g className="animate-orbit-reverse" style={{ transformOrigin: "250px 350px" }}>
                      <circle
                        cx="250"
                        cy="350"
                        r="50"
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="0.5"
                        strokeOpacity="0.2"
                        strokeDasharray="5 3"
                      />
                      <circle cx="200" cy="350" r="3" fill="#818cf8" fillOpacity="0.4" />
                    </g>
                  </svg>
                </div>

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
                    <div className="relative w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                      {/* Orbiting dot */}
                      <div
                        className="absolute inset-0 animate-orbit-fast"
                        style={{ transformOrigin: "center" }}
                      >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-white/60">
                        Order Summary
                      </h2>
                      <p className="font-mono text-[10px] text-white/30 mt-0.5">
                        #{order._id?.toString().slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="mb-8">
                    <div className="flex items-start gap-4">
                      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                        {/* Mini orbital animation */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
                          <g
                            className="animate-orbit-fast"
                            style={{ transformOrigin: "32px 32px" }}
                          >
                            <circle
                              cx="32"
                              cy="32"
                              r="20"
                              fill="none"
                              stroke="#6366f1"
                              strokeWidth="0.5"
                              strokeOpacity="0.3"
                            />
                            <circle cx="52" cy="32" r="2" fill="#6366f1" fillOpacity="0.5" />
                          </g>
                        </svg>
                        <span className="text-2xl relative z-10">📦</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">
                          {order.product.title}
                        </h3>
                        <p className="text-white/50 mt-1 text-sm line-clamp-2">
                          {order.product.description}
                        </p>
                        <p className="text-indigo-400 mt-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-indigo-400 rounded-full animate-breathe"></span>
                          Quantity: {quantity}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-white/60">
                      <span>Subtotal ({quantity} items)</span>
                      <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Service Fee</span>
                      <span className="text-green-400">Free</span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />
                    <div className="flex justify-between items-end">
                      <span className="text-white/80 font-bold">Total</span>
                      <div className="text-right">
                        <span className="text-3xl font-bold text-white tracking-tight">
                          Rp {totalAmount.toLocaleString("id-ID")}
                        </span>
                        <span className="block text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">
                          IDR
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badges with kinetic accents */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-indigo-100 flex items-center gap-3 scroll-fade-in stagger-1">
                  <div className="relative w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <div className="absolute inset-0 border border-green-200 rounded-xl animate-breathe"></div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Secure</p>
                    <p className="text-[10px] text-gray-500">SSL Encrypted</p>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-indigo-100 flex items-center gap-3 scroll-fade-in stagger-2">
                  <div className="relative w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <div
                      className="absolute inset-0 border border-indigo-200 rounded-xl animate-breathe"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Instant</p>
                    <p className="text-[10px] text-gray-500">Auto Delivery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Checkout Form */}
          <div className="lg:col-span-7 lg:order-1 scroll-fade-in">
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-2">
                Complete Your Order
              </h1>
              <p className="text-gray-500">
                Enter your email to receive your digital content after payment.
              </p>
            </div>

            <CheckoutForm
              orderId={orderId}
              amount={totalAmount}
              paymentGateway={order.paymentGateway}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
