import { getOrderWithProduct, syncOrderPaymentStatus } from "@/lib/orders";
import { getOrderAccessToken } from "@/lib/delivery";
import { notFound, redirect } from "next/navigation";
import ContentViewer from "@/components/ContentViewer";

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

    // Show "Payment Processing" state
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="animate-pulse mb-6 flex justify-center">
          <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-600"
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Processing</h1>
        <p className="text-gray-500 mb-8">
          We are verifying your payment. This may take a few moments. Please click refresh below.
        </p>
        <div className="space-y-4">
          <a
            href={`/order/${orderId}`}
            className="block w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition"
          >
            Check Payment Status
          </a>
          <a
            href={`/checkout/${orderId}?retry=true`}
            className="block w-full text-indigo-600 font-medium py-3 px-4 rounded-lg hover:bg-indigo-50 transition"
          >
            Try Payment Again
          </a>
        </div>
      </div>
    );
  }

  // 3. Retrieve Access Token (Server-Side)
  // This token is passed to the client component to "claim" the content.
  const token = await getOrderAccessToken(orderId);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Purchase Successful!</h1>
        <p className="text-gray-500 mt-2">Order ID: {orderId}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Order Info Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Order Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-gray-500 text-xs uppercase">Product</span>
                <span className="font-medium">{order.product.title}</span>
              </div>
              <div>
                <span className="block text-gray-500 text-xs uppercase">Total Paid</span>
                <span className="font-medium text-green-600">
                  Rp {order.amountPaid.toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="block text-gray-500 text-xs uppercase">Date</span>
                <span className="font-medium">
                  {new Date(order.createdAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div>
                <span className="block text-gray-500 text-xs uppercase">Payment</span>
                <span className="font-medium bg-gray-100 px-2 py-1 rounded text-xs">
                  {order.paymentGateway}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Delivery Area */}
        <div className="md:col-span-2">
          {!token ? (
            <div className="p-8 bg-red-50 text-red-700 rounded-xl border border-red-200">
              <h3 className="font-bold text-lg mb-2">Delivery Error</h3>
              <p>
                Payment was successful, but the access token could not be found. Please contact
                support.
              </p>
            </div>
          ) : (
            <ContentViewer token={token} />
          )}
        </div>
      </div>
    </div>
  );
}
