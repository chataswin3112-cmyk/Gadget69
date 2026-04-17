import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import {
  BUSINESS_NAME,
  BUSINESS_SUMMARY,
  ORDER_PROCESSING_WINDOW,
  SUPPORT_EMAIL,
} from "@/lib/store-info";

const terms = [
  {
    title: "Products and Pricing",
    body:
      "Product descriptions, images, pricing, and availability are displayed on the website as accurately as possible. We may update listings, pricing, or stock availability without prior notice.",
  },
  {
    title: "Orders and Payments",
    body:
      "Orders placed through the website are subject to acceptance and availability. Payment, when enabled for an order, must be completed through the checkout options made available on the website.",
  },
  {
    title: "Order Fulfilment",
    body: `Orders are generally processed within ${ORDER_PROCESSING_WINDOW}. Delivery timelines can vary depending on the destination and courier service availability.`,
  },
  {
    title: "Returns and Refunds",
    body:
      "Returns, cancellations, and refunds are handled according to our published refund policy. Customers must review the applicable policy before placing an order.",
  },
  {
    title: "Support",
    body: `For order support or policy-related queries, contact ${SUPPORT_EMAIL}.`,
  },
];

const TermsOfService = () => (
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
            Terms and Conditions
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground font-body sm:text-base">
            {BUSINESS_SUMMARY}
          </p>
        </section>

        <section className="space-y-6">
          {terms.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm sm:p-8"
            >
              <h2 className="font-heading text-xl font-semibold text-foreground">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground font-body">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-border/60 bg-card/70 p-6 text-sm leading-7 text-muted-foreground shadow-premium font-body sm:p-8">
          By accessing this website or placing an order with {BUSINESS_NAME}, you agree to these terms
          and to the policies linked in the footer, including our shipping, privacy, and refund
          policies.
        </section>
      </div>
    </main>

    <FloatingContactActions />
    <Footer />
  </div>
);

export default TermsOfService;
