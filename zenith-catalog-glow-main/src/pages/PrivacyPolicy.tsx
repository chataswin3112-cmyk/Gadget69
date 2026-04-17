import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import { BUSINESS_NAME, SUPPORT_EMAIL } from "@/lib/store-info";

const collectedData = [
  "Name, phone number, email address, delivery address, and pincode submitted during checkout or support requests.",
  "Order details, product selections, and communication history needed to process purchases and assist customers.",
  "Basic technical information such as browser or device data used to improve site performance and security.",
];

const dataUsage = [
  "To process orders, arrange shipping, and share delivery updates.",
  "To respond to customer support queries, return requests, and refund requests.",
  "To prevent misuse, maintain records, and comply with applicable legal or tax requirements.",
];

const PrivacyPolicy = () => (
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
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground font-body sm:text-base">
            This policy explains how we collect, use, and protect customer information when you browse
            the website, place an order, or contact our support team.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-foreground">Information We Collect</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground font-body">
              {collectedData.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-foreground">How We Use It</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground font-body">
              {dataUsage.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <article className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-premium sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-foreground">Sharing and Security</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground font-body">
              <p>
                We share only the information required to complete your order or provide support. This
                may include courier partners, payment service providers, hosting providers, or service
                partners acting on our behalf.
              </p>
              <p>
                We do not sell customer data. Payment information is handled through the payment options
                available during checkout, and sensitive payment credentials are not intentionally stored
                on this website.
              </p>
              <p>
                We take reasonable steps to safeguard customer information, but no online platform can
                guarantee absolute security.
              </p>
            </div>
          </article>

          <article className="rounded-3xl border border-border/60 bg-accent/10 p-6 shadow-sm sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-foreground">Contact</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground font-body">
              <p>
                For privacy-related questions, data correction requests, or support queries, contact us
                at{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium text-foreground transition-colors hover:text-accent"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </div>
          </article>
        </section>
      </div>
    </main>

    <FloatingContactActions />
    <Footer />
  </div>
);

export default PrivacyPolicy;
