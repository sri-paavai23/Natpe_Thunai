"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, EyeOff, Upload } from "lucide-react";
import { toast } from "sonner";
import { account, databases, storage, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID, APPWRITE_COLLEGE_ID_BUCKET_ID } from "@/lib/appwrite"; // Fixed: Import storage and APPWRITE_COLLEGE_ID_BUCKET_ID
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ID } from 'appwrite';

const AuthPage = () => {
  const { login, register, isAuthenticated, isLoading } = useAuth(); // Fixed: Destructure isAuthenticated and isLoading
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [department, setDepartment] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password); // Fixed: Pass email and password
      toast.success("Logged in successfully!");
      navigate("/home");
    } catch (error: any) {
      toast.error(error.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await register(email, password, name, mobileNumber, collegeName, department);
      toast.success("You are now logged in!");
      navigate("/home");
    } catch (error: any) {
      toast.error(error.message || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollegeIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCollegeIdFile(file);
      setUploadingId(true);
      try {
        const uploadedFile = await storage.createFile(
          APPWRITE_COLLEGE_ID_BUCKET_ID,
          ID.unique(),
          file
        );
        const fileUrl = storage.getFileView(APPWRITE_COLLEGE_ID_BUCKET_ID, uploadedFile.$id).href;
        setUploadedFileUrl(fileUrl);
        toast.success("College ID uploaded successfully! Awaiting verification.");
      } catch (error: any) {
        console.error("Error uploading college ID:", error);
        toast.error(error.message || "Failed to upload college ID.");
        setCollegeIdFile(null);
        setUploadedFileUrl(null);
      } finally {
        setUploadingId(false);
      }
    }
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-neon" />
        <p className="ml-3 text-lg">Loading user session...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-foreground">Natpe🤝Thunai</CardTitle>
          <CardDescription className="text-muted-foreground">
            Connect, Share, Thrive on Campus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-primary-blue-light text-primary-foreground">
              <TabsTrigger value="login" className="data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Login</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input text-foreground border-border focus:ring-ring focus:border-ring pr-10"
                    required
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-7 h-8 w-8 p-0 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
                <Button type="submit" className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Login"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register" className="mt-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-input text-foreground border-border focus:ring-ring focus:border-ring pr-10"
                    required
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-7 h-8 w-8 p-0 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-mobile">Mobile Number</Label>
                  <Input
                    id="register-mobile"
                    type="tel"
                    placeholder="9876543210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-college">College Name</Label>
                  <Input
                    id="register-college"
                    type="text"
                    placeholder="Your College Name"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-department">Department</Label>
                  <Input
                    id="register-department"
                    type="text"
                    placeholder="Your Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="college-id-upload">Upload College ID (for verification)</Label>
                  <Input
                    id="college-id-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleCollegeIdUpload}
                    className="bg-input text-foreground border-border focus:ring-ring focus:border-ring file:text-secondary-neon file:font-medium"
                    disabled={isSubmitting || uploadingId}
                  />
                  {uploadingId && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                    </div>
                  )}
                  {uploadedFileUrl && (
                    <p className="text-sm text-green-600">File uploaded! Awaiting verification.</p>
                  )}
                </div>
                <Button type="submit" className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isSubmitting || uploadingId || !collegeIdFile}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Register"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;