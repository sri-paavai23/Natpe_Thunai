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
  const adjectives = ["swift", "brave", "silent", "golden", "shadow", "mystic", "cosmic", "iron", "ruby", "emerald", "Hidden", "Veiled", "Phantom", "Ghost", "Arcane", "Cryptic", "Shrouded", "Astral"];
  const nouns = ["wolf", "eagle", "phoenix", "dragon", "tiger", "badger", "viper", "golem", "knight", "wizard", "Lynx", "Panther", "Falcon", "Shark", "Cobra", "Grizzly", "Leopard", "Raptor"];
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
  
  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [upiId, setUpiId] = useState("");
  const [collegeIdPhoto, setCollegeIdPhoto] = useState<File | null>(null);
  
  // Registration Flow States
  const [generatedUsernames, setGeneratedUsernames] = useState<string[]>([]);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | "prefer-not-to-say">("prefer-not-to-say");
  const [userType, setUserType] = useState<"student" | "staff">("student");
  const [collegeName, setCollegeName] = useState("");
  const [avatarStyle, setAvatarStyle] = useState("lorelei");
  
  // --- NEW: Study Year State ---
  const [studyYear, setStudyYear] = useState("1");

  const [isReportMissingCollegeDialogOpen, setIsReportMissingCollegeDialogOpen] = useState(false);

  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle redirection for authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/home", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Generate usernames for registration
  useEffect(() => {
    if (!isLogin && generatedUsernames.length === 0) {
      setGeneratedUsernames(generateUsernameOptions());
    }
  }, [isLogin, generatedUsernames.length]);

  const handleCollegeIdPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      const MAX_FILE_SIZE_MB = 1;
      const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; 

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`File size exceeds ${MAX_FILE_SIZE_MB}MB. Please compress your image.`);
        setCollegeIdPhoto(null);
        e.target.value = '';
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
        // --- LOGIN FLOW ---
        await account.createEmailPasswordSession(email, password);
        await login(); 
        toast.success("Logged in successfully!");
      } else {
        // --- REGISTRATION FLOW ---
        
        // 1. Validations
        if (!termsAccepted) { toast.error("You must accept the terms and conditions."); setLoading(false); return; }
        if (!selectedUsername) { toast.error("Please select a username."); setLoading(false); return; }
        if (!collegeIdPhoto) { toast.error("Please upload your college ID card photo."); setLoading(false); return; }
        if (!collegeName) { toast.error("Please select your college."); setLoading(false); return; }
        if (!avatarStyle) { toast.error("Please select an avatar style."); setLoading(false); return; }

        // 2. Create Auth Account
        const user = await account.create("unique()", email, password, selectedUsername);
        
        // 3. Upload ID Photo
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
            toast.error("Failed to upload college ID photo.");
            setLoading(false);
            return; 
          }
        }

        // 4. --- LOGIC: Calculate Graduation Date ---
        const calculateGradDate = () => {
          const date = new Date();
          // Logic: 1st Year = +4 yrs, 2nd Year = +3 yrs, 3rd Year = +2 yrs, Others = +1 yr
          const yearsToAdd = studyYear === '1' ? 4 : studyYear === '2' ? 3 : studyYear === '3' ? 2 : 1;
          date.setFullYear(date.getFullYear() + yearsToAdd);
          return date.toISOString();
        };

        // 5. Create Database Profile
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
              // --- NEW: Save Graduation Date ---
              graduationDate: calculateGradDate(), 
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
        } catch (profileError: any) {
          console.error("Error creating user profile document:", profileError);
          toast.error(`Failed to create user profile: ${profileError.message}`);
          setLoading(false);
          return;
        }
        
        await account.createVerification(`${APP_HOST_URL}/verify-email`);
        toast.info("Verification email sent!");

        // 6. Auto-Login after Signup
        await account.createEmailPasswordSession(email, password);
        await login(); 
        toast.success("You are now logged in!");
        
        // Reset Form
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
        setStudyYear("1"); // Reset year
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
            {isLogin ? "Welcome Back!" : "Join the Community"}
          </CardTitle>
          <CardDescription className="text-foreground">
            {isLogin ? "Log in to connect and thrive." : "Sign up and unlock campus potential."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                    <Input id="firstName" type="text" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                    <Input id="lastName" type="text" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="bg-input text-foreground border-border focus:ring-ring focus:focus:border-ring" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="age" className="text-foreground">Age</Label>
                  <Input id="age" type="number" placeholder="18" value={age} onChange={(e) => setAge(e.target.value)} required min="16" className="bg-input text-foreground border-border focus:ring-ring focus:focus:border-ring" />
                </div>
                
                <div>
                  <Label htmlFor="mobileNumber" className="text-foreground">Mobile Number</Label>
                  <Input id="mobileNumber" type="tel" placeholder="9876543210" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required className="bg-input text-foreground border-border focus:ring-ring focus:focus:border-ring" />
                </div>
                
                <div>
                  <Label htmlFor="upiId" className="text-foreground">UPI ID</Label>
                  <Input id="upiId" type="text" placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} required className="bg-input text-foreground border-border focus:ring-ring focus:focus:border-ring" />
                </div>
                
                {/* COLLEGE SELECTION */}
                <div>
                  <Label htmlFor="collegeName" className="text-foreground">Your College</Label>
                  <CollegeCombobox collegeList={largeIndianColleges} value={collegeName} onValueChange={setCollegeName} placeholder="Select your college" disabled={loading} />
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
                      <ReportMissingCollegeForm onReportSubmitted={() => setIsReportMissingCollegeDialogOpen(false)} onCancel={() => setIsReportMissingCollegeDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </div>

                {/* --- NEW: YEAR OF STUDY SELECTION --- */}
                <div>
                   <Label htmlFor="year" className="text-foreground mb-1 block">Current Year of Study</Label>
                   <select
                     id="year"
                     value={studyYear}
                     onChange={(e) => setStudyYear(e.target.value)}
                     className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                   >
                     <option value="1">I - First Year (4 years left)</option>
                     <option value="2">II - Second Year (3 years left)</option>
                     <option value="3">III - Third Year (2 years left)</option>
                     <option value="4">IV - Fourth Year (1 year left)</option>
                     <option value="5">V - Fifth Year (1 year left)</option>
                     <option value="other">Other</option>
                   </select>
                   <p className="text-xs text-muted-foreground mt-1">This calibrates your Graduation Meter.</p>
                </div>

                <div>
                  <Label htmlFor="collegeIdPhoto" className="text-foreground">College ID Card Photo (Max 1MB)</Label>
                  <Input id="collegeIdPhoto" type="file" accept="image/*" onChange={handleCollegeIdPhotoChange} required className="bg-input text-foreground border-border focus:ring-ring focus:focus:border-ring file:text-primary-foreground file:bg-primary-blue-light file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md" />
                  {collegeIdPhoto && <p className="text-xs text-muted-foreground mt-1">File selected: {collegeIdPhoto.name}</p>}
                  <a href="https://tinypng.com" target="_blank" rel="noopener noreferrer" className="text-xs text-secondary-neon hover:underline flex items-center gap-1 mt-1">
                    <Image className="h-3 w-3" /> Click here to compress your image
                  </a>
                </div>

                <div>
                  <Label className="mb-2 block text-foreground">Gender</Label>
                  <RadioGroup value={gender} onValueChange={(value: any) => setGender(value)} className="flex flex-wrap gap-4">
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
                  <RadioGroup value={userType} onValueChange={(value: any) => setUserType(value)} className="flex flex-wrap gap-4">
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
                  <p className="text-xs text-muted-foreground mt-2">This is the only identifier visible to other users.</p>
                </div>

                <div>
                  <Label htmlFor="avatarStyle" className="text-foreground">Choose Your Avatar Style</Label>
                  <Select value={avatarStyle} onValueChange={setAvatarStyle} required disabled={loading}>
                    <SelectTrigger className="w-full bg-input text-foreground border-border focus:ring-ring focus:focus:border-ring">
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
                  <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground">I agree to the <Link to="/profile/policies" className="text-secondary-neon hover:underline">terms and conditions</Link></Label>
                </div>
                <p className="text-xs text-destructive text-center font-medium">Your Name, Age, Mobile Number, UPI ID, and College ID Photo are collected for developer safety assurance only and will NOT be shared publicly. Only your chosen username will be visible.</p>
              </>
            )}

            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-input text-foreground border-border focus:ring-ring focus:focus:border-ring" />
            </div>
            <div>
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-input text-foreground border-border focus:ring-ring focus:focus:border-ring pr-10" />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-1 text-muted-foreground hover:bg-transparent" onClick={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {isLogin && (
              <div className="text-right text-sm">
                <Link to="/forgot-password" className="text-secondary-neon hover:underline">Forgot Password?</Link>
              </div>
            )}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200" disabled={loading}>
              {loading ? "Processing..." : (isLogin ? "Log In" : "Sign Up")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? "New here? " : "Already a member? "}
            <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="p-0 h-auto text-secondary-neon hover:text-secondary-neon/80" disabled={loading}>
              {isLogin ? "Create an Account" : "Log In"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;