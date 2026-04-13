import { type CSSProperties } from "react";
import { Link } from "react-router-dom";
import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import FloatingContactActions from "@/components/storefront/FloatingContactActions";
import SectionHeader from "@/components/storefront/SectionHeader";
import MediaFrame from "@/components/storefront/MediaFrame";
import { useAdminData } from "@/contexts/AdminDataContext";

const Categories = () => {
  const { sections } = useAdminData();
  const activeSections = sections.filter((s) => s.is_active !== false);

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />

      <div className="section-container pt-8 pb-16">
        <SectionHeader title="All Categories" subtitle={`${activeSections.length} categories`} />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {activeSections.map((section, i) => (
            <div
              key={section.id}
              className="enter-fade-up"
              style={
                {
                  "--enter-delay": `${Math.min(i * 40, 220)}ms`,
                } as CSSProperties
              }
            >
              <Link to={`/categories/${section.id}`} className="group block">
                <div className="relative rounded-xl overflow-hidden shadow-premium group-hover:shadow-premium-hover transition-shadow duration-300">
                  <MediaFrame
                    src={section.imageUrl || "/placeholder.svg"}
                    alt={section.name}
                    aspectRatio="aspect-[4/3]"
                    objectFit="cover"
                    padding="p-0"
                    className="rounded-xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-heading text-xl font-bold text-white">{section.name}</h3>
                    {section.description && (
                      <p className="text-white/70 text-sm mt-1 font-body">{section.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <FloatingContactActions />
      <Footer />
    </div>
  );
};

export default Categories;
