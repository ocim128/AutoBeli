"use client";

import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BuyButtonProps {
  slug: string;
  maxQuantity?: number;
}

function BuyButton({ slug, maxQuantity = 1 }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { t } = useLanguage();

  const handleBuy = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, quantity }),
      });

      if (!res.ok) throw new Error(t("common.createOrderFailed"));

      const data = await res.json();
      router.push(`/checkout/${data.orderId}`);
    } catch {
      toast.error(t("common.createOrderFailed"));
      setLoading(false);
    }
  }, [slug, quantity, router, t]);

  const canIncrement = quantity < maxQuantity;
  const canDecrement = quantity > 1;

  return (
    <div className="w-full space-y-5">
      {maxQuantity > 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {t("product.quantity")}
            </span>
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {t("common.minimum")} 1 / {t("common.maximum")} {maxQuantity}
            </span>
          </div>

          <div className="overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--panel-2)]">
            <div className="grid grid-cols-[3rem_1fr_3rem] items-stretch">
              <button
                type="button"
                onClick={() => canDecrement && setQuantity((current) => current - 1)}
                disabled={!canDecrement || loading}
                className="flex h-12 items-center justify-center border-r border-[var(--line)] font-mono text-base text-[var(--foreground)] transition-colors hover:bg-[var(--panel-3)] disabled:cursor-not-allowed disabled:text-[var(--text-muted)]/40 disabled:hover:bg-transparent"
                aria-label="Decrease quantity"
              >
                &minus;
              </button>

              <div className="flex h-12 flex-col items-center justify-center">
                <span className="font-serif text-[1.7rem] leading-none tracking-[-0.04em] text-[var(--foreground)]">
                  {quantity}
                </span>
                <span className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {t("common.stock")} {maxQuantity}
                </span>
              </div>

              <button
                type="button"
                onClick={() => canIncrement && setQuantity((current) => current + 1)}
                disabled={!canIncrement || loading}
                className="flex h-12 items-center justify-center border-l border-[var(--line)] font-mono text-base text-[var(--foreground)] transition-colors hover:bg-[var(--panel-3)] disabled:cursor-not-allowed disabled:text-[var(--text-muted)]/40 disabled:hover:bg-transparent"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={handleBuy}
        disabled={loading}
        aria-busy={loading}
        variant="outline"
        className="h-12 w-full rounded-[10px] border border-[var(--accent)]/65 bg-transparent px-4 font-mono text-[0.78rem] uppercase tracking-[0.18em] text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] disabled:border-[var(--line)] disabled:bg-transparent disabled:text-[var(--text-muted)]"
      >
        <span className="flex items-center justify-center gap-2">
          {loading ? (
            <>
              <Spinner size={18} variant="classic" />
              <span>{t("common.securingAccess")}</span>
            </>
          ) : (
            <>
              <span>{t("common.getAccessNow")}</span>
              <span aria-hidden="true">&rarr;</span>
            </>
          )}
        </span>
      </Button>

      <div className="grid gap-3 border-t border-[var(--line)] pt-4 text-left sm:grid-cols-3">
        <div className="space-y-1">
          <span className="block font-mono text-[0.58rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {t("common.securePayment")}
          </span>
          <span className="block text-xs text-[var(--foreground)]">Pakasir</span>
        </div>
        <div className="space-y-1">
          <span className="block font-mono text-[0.58rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {t("checkout.paymentMethod")}
          </span>
          <span className="block font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--foreground)]">
            QRIS / VA / Wallet
          </span>
        </div>
        <div className="space-y-1">
          <span className="block font-mono text-[0.58rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {t("common.instantDelivery")}
          </span>
          <span className="block font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--foreground)]">
            {t("common.ready")}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(BuyButton);
