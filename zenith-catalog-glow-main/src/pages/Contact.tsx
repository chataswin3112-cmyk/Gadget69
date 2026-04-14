import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import { useAdminData } from "@/contexts/AdminDataContext";
import { INSTAGRAM_URL, WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/social-links";
import { toast } from "sonner";

const Contact = () => {
  const { settings } = useAdminData();
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />

      <div className="section-container pt-8 pb-16">
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">Contact Us</h1>
        <p className="text-muted-foreground font-body mb-10">We'd love to hear from you.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring font-body"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring font-body"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 font-body">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring font-body resize-none"
                placeholder="How can we help?"
                required
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors"
            >
              <Send className="h-4 w-4" />
              Send Message
            </button>
          </form>

          {/* Info */}
          <div className="space-y-8">
            <div className="bg-card rounded-xl shadow-premium p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-accent/10">
                  <Phone className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">WhatsApp</h3>
                  <a
                    href={WHATSAPP_URL}
                    className="text-sm text-muted-foreground hover:text-accent font-body"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {WHATSAPP_DISPLAY}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-accent/10">
                  <Mail className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">Social</h3>
                  <div className="flex gap-3 mt-1">
                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-accent font-body">
                      Instagram
                    </a>
                    {settings.facebookUrl && (
                      <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-accent font-body">
                        Facebook
                      </a>
                    )}
                  </div>
                </div>
              </div>
              {settings.catalogueUrl && (
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-accent/10">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Catalogue</h3>
                    <a href={settings.catalogueUrl} className="text-sm text-accent hover:underline font-body">
                      Download our catalogue
                    </a>
                  </div>
                </div>
              )}
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
