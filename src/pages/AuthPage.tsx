"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { account, databases, storage, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID, APPWRITE_COLLEGE_ID_BUCKET_ID } from "@/lib/appwrite";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Building2, Image } from "lucide-react";
import { APP_HOST_URL } from "@/lib/config";
import { largeIndianColleges } from "@/lib/largeIndianColleges";
import CollegeCombobox from "@/components/CollegeCombobox";
import { generateAvatarUrl, DICEBEAR_AVATAR_STYLES } from "@/utils/avatarGenerator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ReportMissingCollegeForm from "@/components/forms/ReportMissingCollegeForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Helper function to generate a random username
const generateRandomUsername = (): string => {
  const adjectives = ["swift", "brave", "silent", "golden", "shadow", "mystic", "cosmic", "iron", "ruby", "emerald"];
  const nouns = ["wolf", "eagle", "phoenix", "dragon", "tiger", "badger", "viper", "golem", "knight", "wizard"];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 100);
  return `${randomAdjective}${randomNoun}${randomNumber}`;
};

// Helper function to generate multiple unique username options
const generateUsernameOptions = (count: number = 3): string[] => {
  const options = new Set<string>();
  while (options.size < count) {
    options.add(generateRandomUsername());
  }
  return Array.from(options);
};

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [upiId, setUpiId] = useState("");
  const [collegeIdPhoto, setCollegeIdPhoto] = useState<File | null>(null);
  const [generatedUsernames, setGeneratedUsernames] = useState<string[]>([]);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | "prefer-not-to-say">("prefer-not-to-say");
  const [userType, setUserType] = useState<"student" | "staff">("student");
  const [collegeName, setCollegeName] = useState("");
  const [avatarStyle, setAvatarStyle] = useState("lorelei");
  const [isReportMissingCollegeDialogOpen, setIsReportMissingCollegeDialogOpen] = useState(false);

  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // This useEffect handles redirection for *existing* authenticated users
  // and also for new signups once AuthContext updates.
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  React.useEffect(() => {
    if (!isLogin && generatedUsernames.length === 0) {
      setGeneratedUsernames(generateUsernameOptions());
    }
  }, [isLogin, generatedUsernames.length]);

  const handleCollegeIdPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      const MAX_FILE_SIZE_MB = 1;
      const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 1MB in bytes

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`File size exceeds ${MAX_FILE_SIZE_MB}MB. Please compress your image.`);
        setCollegeIdPhoto(null); // Clear the selected file
        e.target.value = ''; // Clear the input field
        return;
      }
    }
    setCollegeIdPhoto(file);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await account.createEmailPasswordSession(email, password);
        await login(); // Call login from AuthContext to update global state
        toast.success("Logged in successfully!");
        // Navigation is now handled by the useEffect above
      } else {
        if (!termsAccepted) {
          toast.error("You must accept the terms and conditions.");
          setLoading(false);
          return;
        }
        if (!selectedUsername) {
          toast.error("Please select a username.");
          setLoading(false);
          return;
        }
        if (!collegeIdPhoto) {
          toast.error("Please upload your college ID card photo.");
          setLoading(false);
          return;
        }
        if (!collegeName) {
          toast.error("Please select your college.");
          setLoading(false);
          return;
        }
        if (!avatarStyle) {
          toast.error("Please select an avatar style.");
          setLoading(false);
          return;
        }

        const user = await account.create("unique()", email, password, selectedUsername);
        
        let collegeIdPhotoFileId = null;
        if (collegeIdPhoto) {
          try {
            const uploadedFile = await storage.createFile(
              APPWRITE_COLLEGE_ID_BUCKET_ID,
              ID.unique(),
              collegeIdPhoto
            );
            collegeIdPhotoFileId = uploadedFile.$id;
            toast.info("College ID photo uploaded.");
          } catch (uploadError: any) {
            console.error("Error uploading college ID photo:", uploadError);
            toast.error("Failed to upload college ID photo. Please try again.");
            setLoading(false);
            return; 
          }
        }

        try {
          await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_USER_PROFILES_COLLECTION_ID,
            ID.unique(),
            {
              userId: user.$id,
              firstName,
              lastName,
              age: parseInt(age),
              mobileNumber,
              upiId,
              collegeIdPhotoId: collegeIdPhotoFileId,
              role: "user",
              gender,
              userType,
              collegeName,
              level: 1,
              currentXp: 0,
              maxXp: 100,
              ambassadorDeliveriesCount: 0,
              lastQuestCompletedDate: null,
              itemsListedToday: 0,
              avatarStyle: avatarStyle,
            }
          );
          toast.success("User profile saved.");
          toast.info("Your Name, Age, Mobile Number, UPI ID, and College ID Photo are collected for developer safety assurance only and will NOT be shared publicly. Only your chosen username will be visible.");
        } catch (profileError: any) {
          console.error("Error creating user profile document:", profileError);
          toast.error(`Failed to create user profile: ${profileError.message}. Please ensure your Appwrite 'user_profiles' collection has 'create' permissions for 'users' and the schema matches the fields being sent.`);
          setLoading(false);
          return;
        }
        
        await account.createVerification(
          `${APP_HOST_URL}/verify-email`
        );
        toast.info("Verification email sent! Please check your inbox.");

        // Create session and log in the user immediately after successful signup
        await account.createEmailPasswordSession(email, password);
        await login(); // Call login from AuthContext to update global state
        toast.success("You are now logged in!");
        
        // Navigation is now handled by the useEffect above

        // Clear form fields
        setFirstName("");
        setLastName("");
        setAge("");
        setMobileNumber("");
        setUpiId("");
        setCollegeIdPhoto(null);
        setGeneratedUsernames([]);
        setSelectedUsername("");
        setTermsAccepted(false);
        setGender("prefer-not-to-say");
        setUserType("student");
        setCollegeName("");
        setAvatarStyle("lorelei");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during authentication.");
      console.error("Authentication error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-background-dark p-4">
      <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-foreground">
            {isLogin ? "Campus Hustle: Login to Level Up" : "Join the Campus Hustle: Sign Up"}
          </CardTitle>
          <CardDescription className="text-foreground">
            {isLogin ? "Log in to your campus connection hub." : "Create your account to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="age" className="text-foreground">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="18"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    min="16"
                    className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                  />
                </div>
                <div>
                  <Label htmlFor="mobileNumber" className="text-foreground">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    placeholder="9876543210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                    className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                  />
                </div>
                <div>
                  <Label htmlFor="upiId" className="text-foreground">UPI ID</Label>
                  <Input
                    id="upiId"
                    type="text"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                    className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                  />
                </div>
                <div>
                  <Label htmlFor="collegeName" className="text-foreground">Your College</Label>
                  <CollegeCombobox
                    collegeList={largeIndianColleges}
                    value={collegeName}
                    onValueChange={setCollegeName}
                    placeholder="Select your college"
                    disabled={loading}
                  />
                  {/* NEW: "Cannot Find College" button */}
                  <Dialog open={isReportMissingCollegeDialogOpen} onOpenChange={setIsReportMissingCollegeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="p-0 h-auto text-secondary-neon hover:underline mt-2 flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> Cannot find my college
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Report Missing College</DialogTitle>
                      </DialogHeader>
                      <ReportMissingCollegeForm
                        onReportSubmitted={() => setIsReportMissingCollegeDialogOpen(false)}
                        onCancel={() => setIsReportMissingCollegeDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                <div>
                  <Label htmlFor="collegeIdPhoto" className="text-foreground">College ID Card Photo (Max 1MB)</Label>
                  <Input
                    id="collegeIdPhoto"
                    type="file"
                    accept="image/*"
                    onChange={handleCollegeIdPhotoChange}
                    required
                    className="bg-input text-foreground border-border focus:ring-ring focus:border-ring file:text-primary-foreground file:bg-primary-blue-light file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md"
                  />
                  {collegeIdPhoto && <p className="text-xs text-muted-foreground mt-1">File selected: {collegeIdPhoto.name}</p>}
                  <Link to="/help/Click-To-Compress-The-Image" target="_blank" rel="noopener noreferrer" className="text-xs text-secondary-neon hover:underline flex items-center gap-1 mt-1">
                    <Image className="h-3 w-3" /> How to get URL?
                  </Link>
                </div>

                <div>
                  <Label className="mb-2 block text-foreground">Gender</Label>
                  <RadioGroup value={gender} onValueChange={(value: "male" | "female" | "prefer-not-to-say") => setGender(value)} className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="gender-male" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
                      <Label htmlFor="gender-male" className="text-foreground">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="gender-female" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
                      <Label htmlFor="gender-female" className="text-foreground">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="prefer-not-to-say" id="gender-prefer-not-to-say" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
                      <Label htmlFor="gender-prefer-not-to-say" className="text-foreground">Prefer not to say</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="mb-2 block text-foreground">Are you a?</Label>
                  <RadioGroup value={userType} onValueChange={(value: "student" | "staff") => setUserType(value)} className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="student" id="user-type-student" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
                      <Label htmlFor="user-type-student" className="text-foreground">Student</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="staff" id="user-type-staff" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
                      <Label htmlFor="user-type-staff" className="text-foreground">Staff</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="mb-2 block text-foreground">Choose Your Username (Public)</Label>
                  <RadioGroup value={selectedUsername} onValueChange={setSelectedUsername} className="grid grid-cols-1 gap-2">
                    {generatedUsernames.map((username) => (
                      <div key={username} className="flex items-center space-x-2">
                        <RadioGroupItem value={username} id={username} className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
                        <Label htmlFor={username} className="text-foreground">{username}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground mt-2">
                    This is the only identifier visible to other users.
                  </p>
                </div>

                {/* NEW: Avatar Style Selection */}
                <div>
                  <Label htmlFor="avatarStyle" className="text-foreground">Choose Your Avatar Style</Label>
                  <Select value={avatarStyle} onValueChange={setAvatarStyle} required disabled={loading}>
                    <SelectTrigger className="w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
                      <SelectValue placeholder="Select avatar style" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover text-popover-foreground border-border max-h-60 overflow-y-auto">
                      {DICEBEAR_AVATAR_STYLES.map((style) => (
                        <SelectItem key={style} value={style}>{style.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground"
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground">
                    I agree to the <Link to="/profile/policies" className="text-secondary-neon hover:underline">terms and conditions</Link>
                  </Label>
                </div>
                <p className="text-xs text-destructive text-center font-medium">
                  Your Name, Age, Mobile Number, UPI ID, and College ID Photo are collected for developer safety assurance only and will NOT be shared publicly. Only your chosen username will be visible.
                </p>
              </>
            )}
            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input text-foreground border-border focus:ring-ring focus:border-ring pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-1 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
            </div>
            {isLogin && (
              <div className="text-right text-sm">
                <Link to="/forgot-password" className="text-secondary-neon hover:underline">
                  Forgot Password?
                </Link>
              </div>
            )}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200" disabled={loading}>
              {loading ? "Processing..." : (isLogin ? "Log In" : "Sign Up")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="p-0 h-auto text-secondary-neon hover:text-secondary-neon/80" disabled={loading}>
              {isLogin ? "Sign Up" : "Log In"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;