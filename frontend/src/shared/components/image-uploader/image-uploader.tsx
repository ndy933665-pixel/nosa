"use client";

import { ImagePlus, Star, Trash2 } from "lucide-react";
import type { ImageAsset, MediaFolder } from "@nosa/contracts";
import { MediaImage } from "@/shared/components/media-image";
import type { FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import { useImageUploader } from "./image-uploader.ux";

export type ImageUploaderLabels = {
  /** "Drag images here or click to browse" */
  drop: string;
  hint: string;
  primary: string;
  makePrimary: string;
  remove: string;
  uploaded: string;
  tooLarge: string;
  notImage: string;
  uploadFailed: string;
};

type ImageUploaderProps = {
  folder: MediaFolder;
  value: ImageAsset[];
  onChange: (images: ImageAsset[]) => void;
  maxFiles?: number;
  labels: ImageUploaderLabels;
  feedback: FeedbackMessages;
  /** Error text shown under the box. */
  error?: string;
};

/** Pick or drop images, upload them straight to Cloudinary, reorder and remove. The first image is the main one. */
export function ImageUploader({ folder, value, onChange, maxFiles = 12, labels, feedback, error }: ImageUploaderProps) {
  const uploader = useImageUploader({ folder, value, onChange, maxFiles, feedback, messages: labels });
  const problem = error ?? uploader.problem;

  return (
    <div className="flex flex-col gap-3">
      {/* The label opens the hidden file input natively, so no ref or click handler is needed. */}
      <label
        onDragOver={uploader.onDragOver}
        onDragLeave={uploader.onDragLeave}
        onDrop={uploader.onDrop}
        className={cn(
          "stitch flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-card px-4 py-6 text-center transition-colors",
          "cursor-pointer hover:bg-primary-50 focus-within:ring-3 focus-within:ring-ring/50",
          (!uploader.canAdd || uploader.uploading > 0) && "pointer-events-none opacity-60",
          uploader.dragging && "bg-primary-50",
          problem && "border-destructive bg-destructive/5",
        )}
      >
        {uploader.uploading > 0 ? <Spinner className="size-6 text-primary" /> : <ImagePlus className="size-6 text-primary" aria-hidden />}
        <span className="text-sm font-medium text-primary-800">{labels.drop}</span>
        <span className="text-xs text-muted-foreground">{labels.hint}</span>
        <input type="file" accept="image/*" multiple className="sr-only" disabled={!uploader.canAdd || uploader.uploading > 0} onChange={uploader.onPick} />
      </label>
      {problem && (
        <p role="alert" className="text-sm text-destructive">
          {problem}
        </p>
      )}

      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {value.map((image, index) => (
            <li key={image.publicId} className="group relative aspect-square overflow-hidden rounded-xl border bg-muted">
              <MediaImage image={image} alt="" fill sizes="160px" />
              {index === 0 && (
                <span className="absolute start-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[0.65rem] text-primary-foreground">{labels.primary}</span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/50 to-transparent p-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                {index > 0 && (
                  <Button type="button" size="icon-xs" variant="secondary" title={labels.makePrimary} aria-label={labels.makePrimary} onClick={() => uploader.makePrimary(image.publicId)}>
                    <Star />
                  </Button>
                )}
                <Button type="button" size="icon-xs" variant="secondary" className="text-destructive" title={labels.remove} aria-label={labels.remove} onClick={() => uploader.remove(image.publicId)}>
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
