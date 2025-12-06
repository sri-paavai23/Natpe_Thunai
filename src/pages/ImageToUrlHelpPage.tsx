"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Image, Link as LinkIcon, UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ImageToUrlHelpPage = () => {
  const navigate = useNavigate();

  const handleExternalLink = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-secondary-neon">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <h1 className="text-4xl font-bold text-center text-foreground">Image to URL Guide</h1>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Image className="h-5 w-5 text-secondary-neon" /> How to Get an Image URL
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Many forms on Natpe🤝Thunai require an image URL. Here's how you can easily convert your images into shareable links:
            </p>

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-primary" /> 1. Using Google Drive
              </h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-4">
                <li>Upload your image to Google Drive.</li>
                <li>Right-click the image and select "Share".</li>
                <li>Change "General access" to "Anyone with the link".</li>
                <li>Copy the link.</li>
                <li>**Important:** The copied link will look like `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`. You need to modify it to `https://drive.google.com/uc?export=view&id=FILE_ID` for direct embedding. Replace `FILE_ID` with the actual ID from your link.</li>
              </ul>
              <Button variant="link" onClick={() => handleExternalLink("https://drive.google.com/")} className="p-0 h-auto text-secondary-neon hover:underline">
                Go to Google Drive <LinkIcon className="ml-1 h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-primary" /> 2. Using Imgur
              </h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-4">
                <li>Go to Imgur.com and click "New Post".</li>
                <li>Upload your image.</li>
                <li>Once uploaded, right-click the image and select "Copy Image Address" (or "Copy Image Link"). This will give you a direct URL.</li>
              </ul>
              <Button variant="link" onClick={() => handleExternalLink("https://imgur.com/")} className="p-0 h-auto text-secondary-neon hover:underline">
                Go to Imgur <LinkIcon className="ml-1 h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-primary" /> 3. Other Image Hosting Services
              </h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-4">
                <li>Many other services like Cloudinary, Flickr, or even your own website can host images.</li>
                <li>Always look for an option to "Copy Image Address" or "Direct Link" after uploading.</li>
              </ul>
            </div>

            <p className="text-sm text-destructive-foreground mt-4">
              **Important:** Ensure the link you provide directly points to the image file (usually ends with .jpg, .png, .gif, etc.) and is publicly accessible.
            </p>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ImageToUrlHelpPage;