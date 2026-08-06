import { getOrderWithProduct, syncOrderPaymentStatus } from "@/lib/orders";
import { getOrderAccessToken } from "@/lib/delivery";
import { notFound, redirect } from "next/navigation";
import OrderPending from "@/components/OrderPending";
import OrderPaid from "@/components/OrderPaid";

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

  // 2. Handle Pending / Expired States
  if (order.status !== "PAID") {
    const isQris = order.paymentMetadata?.provider === "qris";
    const hasPendingPayment = order.paymentMetadata?.transaction_ref;
    const quantity = order.quantity || 1;

    // For Qris, the customer must see the final server-managed amount recorded
    // at creation — never the pending order's amountPaid (which remains zero).
    const displayAmount =
      isQris && order.paymentMetadata?.amount !== undefined
        ? order.paymentMetadata.amount
        : isQris
          ? order.product.priceIdr * quantity
          : order.amountPaid;

    if (order.status === "EXPIRED") {
      return (
        <OrderPending
          orderId={orderId}
          productTitle={order.product.title}
          amount={displayAmount}
          createdAt={order.createdAt}
          isQris={isQris}
          isExpired
        />
      );
    }

    if (!hasPendingPayment) {
      redirect(`/checkout/${orderId}`);
    }

    // Pending / Payment Processing state
    return (
      <OrderPending
        orderId={orderId}
        productTitle={order.product.title}
        amount={displayAmount}
        createdAt={order.createdAt}
        isQris={isQris}
        expiresAt={isQris ? order.paymentMetadata?.expires_at : undefined}
      />
    );
  }

  // 3. Retrieve Access Token (Server-Side)
  const token = await getOrderAccessToken(orderId);

  return (
    <OrderPaid
      orderId={orderId}
      productTitle={order.product.title}
      amountPaid={order.amountPaid}
      createdAt={order.createdAt}
      paymentGateway={order.paymentGateway}
      token={token}
    />
  );
}
