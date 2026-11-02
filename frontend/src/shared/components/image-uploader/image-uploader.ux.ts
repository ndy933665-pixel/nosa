"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import type { ImageAsset, MediaFolder, MediaSignature } from "@nosa/contracts";
import type { FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import { signImageUpload } from "./image-uploader.action";

const TIMEOUT_MS = 60_000;

type Messages = {
  uploaded: string;
  tooLarge: string;
  notImage: string;
  uploadFailed: string;
};

type Options = {
  folder: MediaFolder;
  value: ImageAsset[];
  onChange: (images: ImageAsset[]) => void;
  maxFiles: number;
  feedback: FeedbackMessages;
  messages: Messages;
};

type CloudinaryResult = { public_id: string; width: number; height: number; format: string };

/** Direct upload: the browser sends the file to Cloudinary using the signature Express gave us. */
async function uploadFile(file: File, signature: MediaSignature): Promise<ImageAsset> {
  const body = new FormData();
  body.set("file", file);
  body.set("api_key", signature.apiKey);
  body.set("timestamp", String(signature.timestamp));
  body.set("signature", signature.signature);
  body.set("folder", signature.folder);
  body.set("allowed_formats", signature.allowedFormats);

  const response = await fetch(signature.uploadUrl, { method: "POST", body, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Cloudinary responded ${response.status}`);
  const result = (await response.json()) as CloudinaryResult;
  return { publicId: result.public_id, width: result.width, height: result.height, format: result.format };
}

export function useImageUploader({ folder, value, onChange, maxFiles, feedback, messages }: Options) {
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  // The last thing that went wrong, shown in red under the box (a toast alone is easy to miss).
  const [problem, setProblem] = useState<string | null>(null);
  const fail = (message: string) => {
    toast.error(message);
    setProblem(message);
  };

  async function addFiles(files: File[]) {
    setProblem(null);
    const room = maxFiles - value.length;
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length < files.length) fail(messages.notImage);

    // Staff limit; the signature carries the exact one, checked again below.
    const accepted = images.slice(0, Math.max(room, 0));
    if (!accepted.length) return;

    setUploading(accepted.length);
    try {
      const signed = await signImageUpload(folder);
      if (!signed.ok) return void fail(feedback.errors[signed.code]);

      const small = accepted.filter((file) => file.size <= signed.data.maxFileSize);
      if (small.length < accepted.length) fail(messages.tooLarge);

      const results = await Promise.allSettled(small.map((file) => uploadFile(file, signed.data)));
      const uploaded = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
      if (uploaded.length) {
        onChange([...value, ...uploaded]);
        toast.success(messages.uploaded);
      }
      if (uploaded.length < small.length) fail(messages.uploadFailed);
    } catch (error) {
      console.error("Image upload failed", error);
      fail(messages.uploadFailed);
    } finally {
      setUploading(0);
    }
  }

  return {
    uploading,
    dragging,
    problem,
    canAdd: value.length < maxFiles,
    onPick: (event: ChangeEvent<HTMLInputElement>) => {
      void addFiles([...(event.target.files ?? [])]);
      event.target.value = "";
    },
    onDragOver: (event: DragEvent) => {
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      setDragging(false);
      void addFiles([...event.dataTransfer.files]);
    },
    remove: (publicId: string) => onChange(value.filter((image) => image.publicId !== publicId)),
    makePrimary: (publicId: string) => {
      const picked = value.find((image) => image.publicId === publicId);
      if (picked) onChange([picked, ...value.filter((image) => image.publicId !== publicId)]);
    },
  };
}
