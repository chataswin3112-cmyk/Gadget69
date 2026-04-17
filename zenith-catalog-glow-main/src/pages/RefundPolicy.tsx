import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/social-links";
import {
  BUSINESS_NAME,
  BUSINESS_SUMMARY,
  REFUND_PROCESSING_WINDOW,
  REFUND_REQUEST_WINDOW,
  SUPPORT_EMAIL,
} from "@/lib/store-info";

const refundEligibility = [
  "Damaged or defective product received",
  "Wrong item received",
  "Product significantly different from description",
  "Missing parts or accessories",
];

const refundProcess = [
  `Approved refunds will be processed within ${REFUND_PROCESSING_WINDOW}`,
  "Amount will be credited to the original payment method only",
  "Razorpay is our designated payment gateway processor",
  "Shipping charges are non-refundable",
];

const nonRefundableItems = [
  "Digital products and gift cards",
  "Used, altered, or customer-damaged items",
  "Items missing original packaging or tags",
  "Items bought during special clearance sales",
];

const cancellationPolicy = [
  "Cancellations are allowed only before the item is shipped",
  "Once tracking is generated, cancellation is not possible",
  "For cancelled orders, the full amount will be refunded",
];

const RefundPolicy = () => (
  <div className="min-h-screen bg-background">
    <AnnouncementBar />
    <Navbar />

    <main className="section-container px-6 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-[2rem] border border-border/60 bg-card/80 p-8 shadow-premium backdrop-blur-sm sm:p-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-accent/80 font-heading">
            {BUSINESS_NAME}
          </p>
          <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Cancellation, Return and Refund Policy
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground font-body sm:text-base">
            {BUSINESS_SUMMARY}
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-foreground">Refund Eligibility</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground font-body">
              {refundEligibility.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-foreground">Return Window</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground font-body">
              Return or refund requests must be raised within{" "}
              <strong className="font-semibold text-foreground">{REFUND_REQUEST_WINDOW}</strong>.
            </p>
            <h3 className="font-heading text-lg font-semibold mt-4 text-foreground">How to Initiate</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground font-body">
              To start a return, contact us via Email or WhatsApp with your Order ID and unboxing video/images of the defect.
            </p>
          </article>

          <article className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-foreground">Refund Process</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground font-body">
              {refundProcess.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-foreground">Cancellation & Exchange</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground font-body">
              {cancellationPolicy.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-7 text-muted-foreground font-body border-t border-border/50 pt-4">
              <strong className="font-semibold text-foreground">Exchanges:</strong> We only replace items if they are defective or damaged. If you need to exchange it for the same item, contact our support team.
            </p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <article className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-premium sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-foreground">Non-Refundable Items</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground font-body">
              {nonRefundableItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-border/60 bg-accent/10 p-6 shadow-sm sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-foreground">Contact Support</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground font-body">
              <p>
                Email:{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium text-foreground transition-colors hover:text-accent"
                >
                  {SUPPORT_EMAIL}
                </a>
              </p>
              <p>
                WhatsApp:{" "}
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground transition-colors hover:text-accent"
                >
                  {WHATSAPP_DISPLAY}
                </a>
              </p>
              <p className="pt-2 text-xs text-muted-foreground">
                Working Hours: Mon-Sat, 10 AM - 7 PM IST
              </p>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-border/60 bg-background/80 p-6 text-sm leading-7 text-muted-foreground shadow-sm font-body sm:p-8 text-center sm:text-left">
          <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Payment Gateway</h2>
          By placing an order with {BUSINESS_NAME}, you agree to this policy. We use Razorpay for secure payments. Refund and cancellation requests are subject to verification by our support team and standard processing times of the payment gateway.
        </section>
      </div>
    </main>

    <FloatingContactActions />
    <Footer />
  </div>
);

export default RefundPolicy;
