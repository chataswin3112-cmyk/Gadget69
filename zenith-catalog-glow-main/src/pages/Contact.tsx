import { useState } from "react";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import { useAdminData } from "@/contexts/AdminDataContext";
import {
  DEFAULT_INSTAGRAM_URL,
  DEFAULT_SHOP_PHONE,
  formatPhoneDisplay,
  toPhoneHref,
  toWhatsAppUrl,
} from "@/lib/social-links";
import { BUSINESS_NAME, BUSINESS_SUMMARY, ORDER_PROCESSING_WINDOW, SUPPORT_EMAIL, SUPPORT_HOURS } from "@/lib/store-info";
import { toast } from "sonner";

const Contact = () => {
  const { settings } = useAdminData();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const phoneDisplay = formatPhoneDisplay(settings.shopPhone || DEFAULT_SHOP_PHONE);
  const phoneHref = toPhoneHref(settings.shopPhone || DEFAULT_SHOP_PHONE);
  const whatsappUrl = toWhatsAppUrl(settings.whatsappNumber);
  const instagramUrl = settings.instagramUrl || DEFAULT_INSTAGRAM_URL;
  const supportEmail = settings.supportEmail || SUPPORT_EMAIL;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    toast.success("Message sent! We will get back to you soon.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />

      <div className="section-container pb-16 pt-8">
        <h1 className="mb-2 text-3xl font-bold font-heading md:text-4xl">Contact Us</h1>
        <p className="mb-10 max-w-3xl text-muted-foreground font-body">{BUSINESS_SUMMARY}</p>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground font-body">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground font-body">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground font-body">Message</label>
              <textarea
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                rows={5}
                className="w-full resize-none rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="How can we help?"
                required
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              <Send className="h-4 w-4" />
              Send Message
            </button>
          </form>

          <div className="space-y-8">
            <div className="space-y-4 rounded-xl bg-card p-6 shadow-premium">
              <h2 className="text-xl font-semibold text-foreground font-heading">Business Details</h2>
              <div className="space-y-3 text-sm leading-7 text-muted-foreground font-body">
                <p>{BUSINESS_NAME} serves customers across India.</p>
                <p>Orders are typically processed within {ORDER_PROCESSING_WINDOW}.</p>
                <p>For order help, delivery updates, returns, or refunds, contact our support team.</p>
              </div>
            </div>

            <div className="space-y-6 rounded-xl bg-card p-6 shadow-premium">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-accent/10 p-2.5">
                  <Phone className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground font-heading">Phone</h3>
                  {phoneHref ? (
                    <a href={phoneHref} className="text-sm text-muted-foreground hover:text-accent font-body">
                      {phoneDisplay}
                    </a>
                  ) : null}
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-sm text-muted-foreground hover:text-accent font-body"
                    >
                      WhatsApp Support
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-accent/10 p-2.5">
                  <Mail className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground font-heading">Support Email</h3>
                  <a href={`mailto:${supportEmail}`} className="text-sm text-muted-foreground hover:text-accent font-body">
                    {supportEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-accent/10 p-2.5">
                  <Mail className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground font-heading">Support Hours</h3>
                  <p className="mt-1 text-sm text-muted-foreground font-body">{SUPPORT_HOURS}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-accent/10 p-2.5">
                  <MapPin className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground font-heading">Social</h3>
                  <div className="mt-1 flex gap-3">
                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-accent font-body">
                      Instagram
                    </a>
                    {whatsappUrl ? (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-accent font-body">
                        WhatsApp
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FloatingContactActions />
      <Footer />
    </div>
  );
};

export default Contact;
