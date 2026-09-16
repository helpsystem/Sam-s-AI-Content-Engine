"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../lib/AuthContext";
import { storage, db } from "../../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { UploadCloud, Image as ImageIcon, FileVideo, Trash2, Loader2, Play } from "lucide-react";

interface MediaItem {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
  createdAt: any;
  path: string;
}

export function MediaLibrary({ language }: { language: "en" | "es" }) {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    en: {
      title: "Media Library",
      description: "Upload and manage images and videos for your campaigns.",
      upload: "Upload Media",
      uploading: "Uploading...",
      dragDrop: "Drag and drop or click to upload",
      supported: "Supports JPG, PNG, MP4 (Max 50MB)",
      empty: "No media files yet",
      emptyDesc: "Upload your first image or video to get started.",
      delete: "Delete",
      deleteConfirm: "Are you sure you want to delete this file?"
    },
    es: {
      title: "Biblioteca Multimedia",
      description: "Sube y gestiona imágenes y videos para tus campañas.",
      upload: "Subir Archivo",
      uploading: "Subiendo...",
      dragDrop: "Arrastra y suelta o haz clic para subir",
      supported: "Soporta JPG, PNG, MP4 (Máx 50MB)",
      empty: "Aún no hay archivos",
      emptyDesc: "Sube tu primera imagen o video para empezar.",
      delete: "Eliminar",
      deleteConfirm: "¿Estás seguro de que deseas eliminar este archivo?"
    }
  };

  useEffect(() => {
    if (!user) return;

    // Fetch media metadata from Firestore
    const q = query(
      collection(db, "media"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mediaItems: MediaItem[] = [];
      snapshot.forEach((doc) => {
        mediaItems.push({ id: doc.id, ...doc.data() } as MediaItem);
      });
      setMedia(mediaItems);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching media:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Basic validation
    if (file.size > 50 * 1024 * 1024) {
      alert("File is too large (max 50MB)");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const storagePath = `users/${user.uid}/media/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          setUploading(false);
          alert("Error uploading file. Please try again.");
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Save metadata to Firestore
          await addDoc(collection(db, "media"), {
            userId: user.uid,
            name: file.name,
            type: file.type,
            size: file.size,
            url: downloadURL,
            path: storagePath,
            createdAt: serverTimestamp()
          });
          
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      );
    } catch (error) {
      console.error("Error:", error);
      setUploading(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!window.confirm(t[language].deleteConfirm)) return;

    try {
      // Delete from Storage
      const fileRef = ref(storage, item.path);
      await deleteObject(fileRef);
      
      // Delete from Firestore
      await deleteDoc(doc(db, "media", item.id));
    } catch (error) {
      console.error("Error deleting media:", error);
      alert("Error deleting file.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">{t[language].title}</h2>
          <p className="text-neutral-500 mt-1">{t[language].description}</p>
        </div>
        <div className="shrink-0">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept="image/jpeg,image/png,video/mp4" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
            {uploading ? t[language].uploading : t[language].upload}
          </button>
        </div>
      </div>

      {uploading && (
        <div className="w-full bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-neutral-700">{t[language].uploading}</span>
              <span className="text-neutral-500">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : media.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-neutral-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-2">{t[language].empty}</h3>
          <p className="text-neutral-500 mb-6 max-w-sm">{t[language].emptyDesc}</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 font-medium hover:underline"
          >
            {t[language].dragDrop}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {media.map((item) => (
            <div key={item.id} className="group relative bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-square bg-neutral-100 relative">
                {item.type.startsWith('video/') ? (
                  <div className="w-full h-full relative">
                    <video 
                      src={item.url} 
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Play className="w-5 h-5 text-neutral-900 ml-1" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={item.url} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button 
                    onClick={() => handleDelete(item)}
                    className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                    title={t[language].delete}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-3">
                <p className="text-sm font-medium text-neutral-900 truncate" title={item.name}>
                  {item.name}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                  {item.type.startsWith('video/') ? <FileVideo className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                  <span>{(item.size / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
