"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, label, className }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onChange(data.url);
      setUrlInput(data.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleUrlChange = (newUrl: string) => {
    setUrlInput(newUrl);
    onChange(newUrl);
  };


  return (
    <div className={className}>
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      <div className="space-y-4">
        {/* Image Preview */}
        {value && (
          <div className="flex justify-center">
            <div className="relative w-48 h-48 bg-muted flex items-center justify-center">
              <img
                src={value.startsWith('/') ? value : `/${value.replace('assets/', 'assets/home/')}`}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  console.log('Failed to load image with path:', e.currentTarget.src);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* Upload Area */}
        <Card
          className={`border-2 border-dashed transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          } ${isUploading ? 'opacity-50' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="p-3">
            <div className="flex flex-col items-center justify-center space-y-2">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              )}
              
              <div className="text-center">
                <p className="text-xs font-medium">
                  {isUploading ? 'Uploading...' : 'Drop image or click to upload'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-7 text-xs"
              >
                <Upload className="h-3 w-3 mr-1" />
                Choose File
              </Button>
            </div>
          </div>
        </Card>

        {/* URL Input Alternative */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Or enter image URL:</Label>
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            disabled={isUploading}
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}