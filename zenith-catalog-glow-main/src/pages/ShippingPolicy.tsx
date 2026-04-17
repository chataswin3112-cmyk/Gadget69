import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/social-links";
import {
  BUSINESS_NAME,
  ORDER_PROCESSING_WINDOW,
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
} from "@/lib/store-info";

const shippingHighlights = [
  `Orders are usually processed within ${ORDER_PROCESSING_WINDOW}.`,
  "We deliver across India through reliable courier partners.",
  "Tracking details are shared after the order is dispatched.",
];

const deliveryNotes = [
  "Delivery timelines depend on the destination, courier route, and service availability.",
  "Remote or non-metro locations may take longer than standard transit timelines.",
  "If a shipment is delayed, returned, or marked undeliverable, our support team will assist with the next steps.",
];

const ShippingPolicy = () => (
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
            Shipping and Delivery Policy
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground font-body sm:text-base">
            We ship premium electronics across India and aim to keep order processing, dispatch, and
            delivery updates clear at every step.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-foreground">Order Processing</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground font-body">
              {shippingHighlights.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-foreground">Shipping Charges</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground font-body">
              Shipping charges, if applicable, are shown during checkout before you confirm the order.
              Any promotional free-shipping offer displayed on the website applies only to eligible
              orders.
            </p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <article className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-premium sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-foreground">Delivery Notes</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground font-body">
              {deliveryNotes.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-border/60 bg-accent/10 p-6 shadow-sm sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-foreground">Support</h2>
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
              <p>Support Hours: {SUPPORT_HOURS}</p>
            </div>
          </article>
        </section>
      </div>
    </main>

    <FloatingContactActions />
    <Footer />
  </div>
);

export default ShippingPolicy;
