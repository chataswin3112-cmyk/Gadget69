import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminData } from "@/contexts/AdminDataContext";
import { Review } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MediaUploadField from "@/components/admin/MediaUploadField";
import MediaImage from "@/components/ui/media-image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-error";

const emptyReview: Partial<Review> = {
  name: "",
  rating: 5,
  comment: "",
  avatar: "",
  date: new Date().toISOString().slice(0, 10),
};

const ReviewAvatar = ({ review }: { review: Review }) => {
  const initials = review.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (review.avatar) {
    return (
      <MediaImage
        src={review.avatar}
        alt={review.name}
        className="h-10 w-10 flex-shrink-0 rounded-full border border-border/70 object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold font-heading text-amber-700">
      {initials}
    </div>
  );
};

const StarPicker = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className="focus:outline-none"
      >
        <Star
          className={`h-6 w-6 transition-colors ${
            n <= value
              ? "fill-[hsl(38_65%_58%)] text-[hsl(38_65%_58%)]"
              : "fill-muted text-muted"
          }`}
        />
      </button>
    ))}
    <span className="ml-2 text-sm text-muted-foreground font-body">{value}/5</span>
  </div>
);

const AdminReviews = () => {
  const { reviews, addReview, updateReview, deleteReview } = useAdminData();
  const [editing, setEditing] = useState<Partial<Review> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing({ ...emptyReview });
    setIsNew(true);
  };

  const openEdit = (review: Review) => {
    setEditing({ ...review });
    setIsNew(false);
  };

  const save = async () => {
    if (!editing?.name?.trim()) {
      toast.error("Reviewer name is required");
      return;
    }
    if (!editing?.comment?.trim()) {
      toast.error("Review comment is required");
      return;
    }

    try {
      setSaving(true);
      if (isNew) {
        await addReview(editing);
        toast.success("Review added");
      } else if (editing.id) {
        await updateReview(editing.id, editing);
        toast.success("Review updated");
      }
      setEditing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save review"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteReview(deleteId);
      toast.success("Review deleted");
      setDeleteId(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete review"));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Reviews</h1>
            <p className="text-muted-foreground font-body text-sm mt-1">
              Manage homepage customer reviews
            </p>
          </div>
          <Button
            onClick={openNew}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Review
          </Button>
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <Star className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-body text-sm">
              No reviews yet. Add your first review.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex items-start gap-4 rounded-xl bg-card shadow-sm border border-border/60 p-4"
              >
                <ReviewAvatar review={review} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold font-heading text-sm">{review.name}</p>
                    <span className="text-xs text-muted-foreground font-body">{review.date}</span>
                  </div>
                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < review.rating
                            ? "fill-[hsl(38_65%_58%)] text-[hsl(38_65%_58%)]"
                            : "fill-muted text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground font-body line-clamp-2">
                    {review.comment}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Edit review for ${review.name}`}
                    onClick={() => openEdit(review)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete review for ${review.name}`}
                    className="text-destructive"
                    onClick={() => setDeleteId(review.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit / Add Dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {isNew ? "Add Review" : "Edit Review"}
            </DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              Update the customer name, rating, photo, comment, and review date shown on the homepage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-body">Customer Name</Label>
              <Input
                value={editing?.name || ""}
                onChange={(e) =>
                  setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev)
                }
                placeholder="e.g. Arjun Mehta"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Rating</Label>
              <StarPicker
                value={editing?.rating ?? 5}
                onChange={(n) =>
                  setEditing((prev) => prev ? { ...prev, rating: n } : prev)
                }
              />
            </div>
            <MediaUploadField
              label="Reviewer Photo"
              value={editing?.avatar || ""}
              accept="image/*"
              placeholder="Upload or paste a reviewer image URL"
              onChange={(value) =>
                setEditing((prev) => prev ? { ...prev, avatar: value } : prev)
              }
            />
            <div className="space-y-2">
              <Label className="font-body">Review Comment</Label>
              <Textarea
                value={editing?.comment || ""}
                onChange={(e) =>
                  setEditing((prev) => prev ? { ...prev, comment: e.target.value } : prev)
                }
                placeholder="What did the customer say?"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body">Date</Label>
              <Input
                type="date"
                value={editing?.date || ""}
                onChange={(e) =>
                  setEditing((prev) => prev ? { ...prev, date: e.target.value } : prev)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving ? "Saving..." : "Save Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this review from the homepage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminReviews;
