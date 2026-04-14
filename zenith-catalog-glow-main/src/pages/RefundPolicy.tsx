import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/social-links";

const refundEligibility = [
  "Damaged or defective product",
  "Wrong item received",
  "Order cancelled before shipping",
];

const refundProcess = [
  "Approved refunds will be processed within 5-7 working days",
  "Amount will be credited to the original payment method",
];

const nonRefundableItems = [
  "Digital products",
  "Used or customer-damaged items",
];

const RefundPolicy = () => (
  <div className="min-h-screen bg-background">
    <AnnouncementBar />
    <Navbar />

    <main className="section-container px-6 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-[2rem] border border-border/60 bg-card/80 p-8 shadow-premium backdrop-blur-sm sm:p-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-accent/80 font-heading">
            Gadget69
          </p>
          <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Refund Policy
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground font-body sm:text-base">
            At Gadget69, we ensure quality products and customer satisfaction.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-foreground">Refund Eligibility</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground font-body">
              {refundEligibility.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-foreground">Refund Request</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground font-body">
              Request must be made within <strong className="font-semibold text-foreground">7 days</strong> of delivery.
            </p>
          </article>

          <article className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-foreground">Refund Process</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground font-body">
              {refundProcess.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-foreground">Cancellation</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground font-body">
              Cancellations are allowed only before shipping.
            </p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <article className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-premium sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-foreground">Non-Refundable</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground font-body">
              {nonRefundableItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-border/60 bg-accent/10 p-6 shadow-sm sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-foreground">Contact</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground font-body">
              <p>
                Email:{" "}
                <a
                  href="mailto:support@gadget69.com"
                  className="font-medium text-foreground transition-colors hover:text-accent"
                >
                  support@gadget69.com
                </a>
              </p>
              <p>
                Phone / WhatsApp:{" "}
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground transition-colors hover:text-accent"
                >
                  {WHATSAPP_DISPLAY}
                </a>
              </p>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-border/60 bg-background/80 p-6 text-sm leading-7 text-muted-foreground shadow-sm font-body sm:p-8">
          By purchasing from Gadget69, you agree to this policy.
        </section>
      </div>
    </main>

    <FloatingContactActions />
    <Footer />
  </div>
);

export default RefundPolicy;
