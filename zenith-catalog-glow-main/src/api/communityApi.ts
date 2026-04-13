import axios from "axios";
import apiClient from "./client";
import { CommunityMedia } from "@/types";
import { buildCloudinaryPosterUrl } from "@/lib/cloudinary";

export interface CommunityVideoUploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: string;
}

export interface UploadedCommunityVideo {
  videoUrl: string;
  thumbnailUrl: string;
  videoPublicId: string;
  videoWidth?: number;
  videoHeight?: number;
  videoDuration?: number;
}

export const getCommunityMedia = async (): Promise<CommunityMedia[]> => {
  const res = await apiClient.get("/community-media");
  return res.data;
};

export const getAdminCommunityMedia = async (): Promise<CommunityMedia[]> => {
  const res = await apiClient.get("/admin/community-media");
  return res.data;
};

export const createCommunityMedia = async (data: Partial<CommunityMedia>): Promise<CommunityMedia> => {
  const res = await apiClient.post("/admin/community-media", data);
  return res.data;
};

export const updateCommunityMedia = async (id: number, data: Partial<CommunityMedia>): Promise<CommunityMedia> => {
  const res = await apiClient.put(`/admin/community-media/${id}`, data);
  return res.data;
};

export const deleteCommunityMedia = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/community-media/${id}`);
};

export const getCommunityVideoUploadSignature = async (
  file: File
): Promise<CommunityVideoUploadSignature> => {
  const res = await apiClient.post("/admin/community-media/upload-signature", {
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
  });
  return res.data;
};

export const uploadCommunityVideo = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadedCommunityVideo> => {
  const signature = await getCommunityVideoUploadSignature(file);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`;
  const res = await axios.post(uploadUrl, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) {
        return;
      }
      onProgress((event.loaded / event.total) * 100);
    },
  });

  return {
    videoUrl: res.data.secure_url,
    thumbnailUrl: buildCloudinaryPosterUrl({
      publicId: res.data.public_id,
      cloudName: signature.cloudName,
    }),
    videoPublicId: res.data.public_id,
    videoWidth: res.data.width,
    videoHeight: res.data.height,
    videoDuration: res.data.duration,
  };
};
