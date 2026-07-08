import { useCallback, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { clearLocalAccountData, useUser } from "@/lib/store";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Shared "Buy a scan" flow. Any CTA in the app that says "Buy a scan" should
 * use this hook so a single tap opens Stripe checkout immediately (with a
 * sign-in prompt fallback for signed-out / unverified users).
 */
export function useBuyScan(returnPath: string = "/pricing?paid=1") {
  const u = useUser();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);

  const openBuyScan = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const authUser = data.session?.user;
    if (!u || !authUser) {
      clearLocalAccountData();
      setSignInPromptOpen(true);
      return;
    }
    if (!authUser.email_confirmed_at && !authUser.confirmed_at) {
      setSignInPromptOpen(true);
      return;
    }
    setCheckoutOpen(true);
  }, [u]);

  const buyScanElement = (
    <>
      {checkoutOpen && u && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCheckoutOpen(false)} />
          <div className="relative w-full max-w-[560px] max-h-[92dvh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="font-bold">Buy a Movement Scan</div>
              <button onClick={() => setCheckoutOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-black/5"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4">
              <StripeEmbeddedCheckout mode="scan" email={u.email} returnUrl={`${window.location.origin}${returnPath}`} />
            </div>
          </div>
        </div>
      )}

      <Dialog open={signInPromptOpen} onOpenChange={setSignInPromptOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>
              You must sign in with a verified email to purchase a scan. It only takes a moment — we'll bring you right back here to complete your purchase.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setSignInPromptOpen(false)}>Cancel</Button>
            <Button onClick={() => { window.location.href = "/?auth=signin&next=%2Fpricing"; }}>Sign in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return { openBuyScan, buyScanElement };
}