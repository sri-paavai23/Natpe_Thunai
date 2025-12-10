"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { DICEBEAR_AVATAR_STYLES } from "@/utils/avatarGenerator";
import Combobox from "@/components/ui/combobox"; // Import the new Combobox component

// Define the form schema using Zod
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  age: z.number().min(18, "Age must be at least 18.").max(99, "Age cannot exceed 99."),
  mobileNumber: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid mobile number format."),
  upiId: z.string().regex(/^[a-zA-Z0-9.\-]+@[a-zA-Z0-9.\-]+$/, "Invalid UPI ID format.").optional().or(z.literal("")),
  gender: z.enum(["male", "female", "prefer-not-to-say"], {
    required_error: "Please select a gender.",
  }),
  userType: z.enum(["student", "staff"], {
    required_error: "Please select a user type.",
  }),
  collegeName: z.string().min(1, "College name is required."),
  avatarStyle: z.enum(DICEBEAR_AVATAR_STYLES as [string, ...string[]], {
    required_error: "Please select an avatar style.",
  }),
});

// Sample list of colleges (in a real app, this would come from an API)
const COLLEGE_OPTIONS = [
  { value: "anna-university", label: "Anna University" },
  { value: "srm-institute-of-science-and-technology", label: "SRM Institute of Science and Technology" },
  { value: "vellore-institute-of-technology", label: "Vellore Institute of Technology" },
  { value: "loyola-college-chennai", label: "Loyola College, Chennai" },
  { value: "madras-christian-college", label: "Madras Christian College" },
  { value: "presidency-college-chennai", label: "Presidency College, Chennai" },
  { value: "st-josephs-college-of-arts-and-science", label: "St. Joseph's College of Arts and Science" },
  { value: "psg-college-of-technology", label: "PSG College of Technology" },
  { value: "coimbatore-institute-of-technology", label: "Coimbatore Institute of Technology" },
  { value: "national-institute-of-technology-trichy", label: "National Institute of Technology, Trichy" },
  { value: "indian-institute-of-technology-madras", label: "Indian Institute of Technology, Madras" },
  { value: "amrita-vishwa-vidyapeetham", label: "Amrita Vishwa Vidyapeetham" },
  { value: "karunya-institute-of-technology-and-sciences", label: "Karunya Institute of Technology and Sciences" },
  { value: "hindustan-institute-of-technology-and-science", label: "Hindustan Institute of Technology and Science" },
  { value: "sathyabama-institute-of-science-and-technology", label: "Sathyabama Institute of Science and Technology" },
  { value: "saveetha-institute-of-medical-and-technical-sciences", label: "Saveetha Institute of Medical and Technical Sciences" },
  { value: "vel-tech-rangarajan-dr-sagunthala-r-and-d-institute-of-science-and-technology", label: "Vel Tech Rangarajan Dr. Sagunthala R&D Institute of Science and Technology" },
  { value: "bharath-institute-of-higher-education-and-research", label: "Bharath Institute of Higher Education and Research" },
  { value: "meenakshi-academy-of-higher-education-and-research", label: "Meenakshi Academy of Higher Education and Research" },
  { value: "dr-mgr-educational-and-research-institute", label: "Dr. M.G.R. Educational and Research Institute" },
  { value: "sri-ramachandra-institute-of-higher-education-and-research", label: "Sri Ramachandra Institute of Higher Education and Research" },
  { value: "vignan-university", label: "Vignan University" },
  { value: "kl-university", label: "KL University" },
  { value: "gitam-university", label: "GITAM University" },
  { value: "osmania-university", label: "Osmania University" },
  { value: "jawaharlal-nehru-technological-university-hyderabad", label: "Jawaharlal Nehru Technological University, Hyderabad" },
  { value: "andhra-university", label: "Andhra University" },
  { value: "sri-venkateswara-university", label: "Sri Venkateswara University" },
  { value: "manipal-academy-of-higher-education", label: "Manipal Academy of Higher Education" },
  { value: "reva-university", label: "REVA University" },
  { value: "christ-university", label: "Christ University" },
  { value: "pes-university", label: "PES University" },
  { value: "rv-college-of-engineering", label: "RV College of Engineering" },
  { value: "bangalore-institute-of-technology", label: "Bangalore Institute of Technology" },
  { value: "dayananda-sagar-college-of-engineering", label: "Dayananda Sagar College of Engineering" },
  { value: "ms-ramaiah-institute-of-technology", label: "M.S. Ramaiah Institute of Technology" },
  { value: "new-horizon-college-of-engineering", label: "New Horizon College of Engineering" },
  { value: "jain-university", label: "Jain University" },
  { value: "nitte-meenakshi-institute-of-technology", label: "Nitte Meenakshi Institute of Technology" },
  { value: "siddaganga-institute-of-technology", label: "Siddaganga Institute of Technology" },
  { value: "acharya-institute-of-technology", label: "Acharya Institute of Technology" },
  { value: "global-academy-of-technology", label: "Global Academy of Technology" },
  { value: "nagarjuna-college-of-engineering-and-technology", label: "Nagarjuna College of Engineering and Technology" },
  { value: "rv-institute-of-technology-and-management", label: "RV Institute of Technology and Management" },
  { value: "sri-siddhartha-institute-of-technology", label: "Sri Siddhartha Institute of Technology" },
  { value: "visvesvaraya-technological-university", label: "Visvesvaraya Technological University" },
  { value: "karnataka-state-open-university", label: "Karnataka State Open University" },
  { value: "university-of-mysore", label: "University of Mysore" },
  { value: "mangalore-university", label: "Mangalore University" },
  { value: "kannur-university", label: "Kannur University" },
  { value: "calicut-university", label: "Calicut University" },
  { value: "mahatma-gandhi-university-kerala", label: "Mahatma Gandhi University, Kerala" },
  { value: "cochin-university-of-science-and-technology", label: "Cochin University of Science and Technology" },
  { value: "kerala-university", label: "Kerala University" },
  { value: "anna-university-chennai", label: "Anna University, Chennai" },
  { value: "madurai-kamaraj-university", label: "Madurai Kamaraj University" },
  { value: "bharathiar-university", label: "Bharathiar University" },
  { value: "bharathidasan-university", label: "Bharathidasan University" },
  { value: "periyar-university", label: "Periyar University" },
  { value: "manonmaniam-sundaranar-university", label: "Manonmaniam Sundaranar University" },
  { value: "alagar-university", label: "Alagappa University" },
  { value: "mother-teresa-womens-university", label: "Mother Teresa Women's University" },
  { value: "tamil-nadu-agricultural-university", label: "Tamil Nadu Agricultural University" },
  { value: "tamil-nadu-dr-mgr-medical-university", label: "Tamil Nadu Dr. M.G.R. Medical University" },
  { value: "tamil-nadu-veterinary-and-animal-sciences-university", label: "Tamil Nadu Veterinary and Animal Sciences University" },
  { value: "tamil-nadu-teachers-education-university", label: "Tamil Nadu Teachers Education University" },
  { value: "tamil-nadu-open-university", label: "Tamil Nadu Open University" },
  { value: "tamil-nadu-national-law-university", label: "Tamil Nadu National Law University" },
  { value: "indian-institute-of-information-technology-design-and-manufacturing-kancheepuram", label: "Indian Institute of Information Technology Design and Manufacturing, Kancheepuram" },
  { value: "pondicherry-university", label: "Pondicherry University" },
  { value: "sri-sivasubramaniya-nadar-college-of-engineering", label: "Sri Sivasubramaniya Nadar College of Engineering" },
  { value: "rajalakshmi-engineering-college", label: "Rajalakshmi Engineering College" },
  { value: "saveetha-engineering-college", label: "Saveetha Engineering College" },
  { value: "st-josephs-college-of-engineering", label: "St. Joseph's College of Engineering" },
  { value: "velammal-engineering-college", label: "Velammal Engineering College" },
  { value: "jerusalem-college-of-engineering", label: "Jerusalem College of Engineering" },
  { value: "sri-venkateswara-college-of-engineering", label: "Sri Venkateswara College of Engineering" },
  { value: "hindustan-college-of-arts-and-science", label: "Hindustan College of Arts and Science" },
  { value: "dg-vaishnav-college", label: "D.G. Vaishnav College" },
  { value: "ethiraj-college-for-women", label: "Ethiraj College for Women" },
  { value: "womens-christian-college", label: "Women's Christian College" },
  { value: "dr-ambedkar-government-arts-college", label: "Dr. Ambedkar Government Arts College" },
  { value: "government-arts-college-coimbatore", label: "Government Arts College, Coimbatore" },
  { value: "government-arts-college-salem", label: "Government Arts College, Salem" },
  { value: "government-arts-college-krishnagiri", label: "Government Arts College, Krishnagiri" },
  { value: "government-arts-college-udumalpet", label: "Government Arts College, Udumalpet" },
  { value: "government-arts-college-tirupur", label: "Government Arts College, Tirupur" },
  { value: "government-arts-college-erode", label: "Government Arts College, Erode" },
  { value: "government-arts-college-namakkal", label: "Government Arts College, Namakkal" },
  { value: "government-arts-college-karur", label: "Government Arts College, Karur" },
  { value: "government-arts-college-thanjavur", label: "Government Arts College, Thanjavur" },
  { value: "government-arts-college-tiruchirappalli", label: "Government Arts College, Tiruchirappalli" },
  { value: "government-arts-college-vellore", label: "Government Arts College, Vellore" },
  { value: "government-arts-college-villupuram", label: "Government Arts College, Villupuram" },
  { value: "government-arts-college-cuddalore", label: "Government Arts College, Cuddalore" },
  { value: "government-arts-college-chidambaram", label: "Government Arts College, Chidambaram" },
  { value: "government-arts-college-mayiladuthurai", label: "Government Arts College, Mayiladuthurai" },
  { value: "government-arts-college-nagapattinam", label: "Government Arts College, Nagapattinam" },
  { value: "government-arts-college-thiruvarur", label: "Government Arts College, Thiruvarur" },
  { value: "government-arts-college-pudukkottai", label: "Government Arts College, Pudukkottai" },
  { value: "government-arts-college-sivaganga", label: "Government Arts College, Sivaganga" },
  { value: "government-arts-college-ramanathapuram", label: "Government Arts College, Ramanathapuram" },
  { value: "government-arts-college-thoothukudi", label: "Government Arts College, Thoothukudi" },
  { value: "government-arts-college-tirunelveli", label: "Government Arts College, Tirunelveli" },
  { value: "government-arts-college-kanyakumari", label: "Government Arts College, Kanyakumari" },
  { value: "government-arts-college-nagercoil", label: "Government Arts College, Nagercoil" },
  { value: "government-arts-college-tenkasi", label: "Government Arts College, Tenkasi" },
  { value: "government-arts-college-virudhunagar", label: "Government Arts College, Virudhunagar" },
  { value: "government-arts-college-madurai", label: "Government Arts College, Madurai" },
  { value: "government-arts-college-dindigul", label: "Government Arts College, Dindigul" },
  { value: "government-arts-college-theni", label: "Government Arts College, Theni" },
  { value: "government-arts-college-perambalur", label: "Government Arts College, Perambalur" },
  { value: "government-arts-college-ariyalur", label: "Government Arts College, Ariyalur" },
  { value: "government-arts-college-tiruvannamalai", label: "Government Arts College, Tiruvannamalai" },
  { value: "government-arts-college-chengalpattu", label: "Government Arts College, Chengalpattu" },
  { value: "government-arts-college-kallakurichi", label: "Government Arts College, Kallakurichi" },
  { value: "government-arts-college-ranipet", label: "Government Arts College, Ranipet" },
  { value: "government-arts-college-tirupattur", label: "Government Arts College, Tirupattur" },
  { value: "government-arts-college-krishnagiri", label: "Government Arts College, Krishnagiri" },
  { value: "government-arts-college-dharmapuri", label: "Government Arts College, Dharmapuri" },
  { value: "government-arts-college-nilgiris", label: "Government Arts College, Nilgiris" },
  { value: "government-arts-college-ooty", label: "Government Arts College, Ooty" },
  { value: "government-arts-college-gudalur", label: "Government Arts College, Gudalur" },
  { value: "government-arts-college-mettupalayam", label: "Government Arts College, Mettupalayam" },
  { value: "government-arts-college-pollachi", label: "Government Arts College, Pollachi" },
  { value: "government-arts-college-valparai", label: "Government Arts College, Valparai" },
  { value: "government-arts-college-tiruchengode", label: "Government Arts College, Tiruchengode" },
  { value: "government-arts-college-rasipuram", label: "Government Arts College, Rasipuram" },
  { value: "government-arts-college-paramathi-velur", label: "Government Arts College, Paramathi Velur" },
  { value: "government-arts-college-attur", label: "Government Arts College, Attur" },
  { value: "government-arts-college-omdur", label: "Government Arts College, Omdur" },
  { value: "government-arts-college-sankari", label: "Government Arts College, Sankari" },
  { value: "government-arts-college-edappadi", label: "Government Arts College, Edappadi" },
  { value: "government-arts-college-mallasamudram", label: "Government Arts College, Mallasamudram" },
  { value: "government-arts-college-tirumangalam", label: "Government Arts College, Tirumangalam" },
  { value: "government-arts-college-melur", label: "Government Arts College, Melur" },
  { value: "government-arts-college-vadipatti", label: "Government Arts College, Vadipatti" },
  { value: "government-arts-college-usilampatti", label: "Government Arts College, Usilampatti" },
  { value: "government-arts-college-kodaikanal", label: "Government Arts College, Kodaikanal" },
  { value: "government-arts-college-palani", label: "Government Arts College, Palani" },
  { value: "government-arts-college-oddanchatram", label: "Government Arts College, Oddanchatram" },
  { value: "government-arts-college-vedasandur", label: "Government Arts College, Vedasandur" },
  { value: "government-arts-college-aruppukottai", label: "Government Arts College, Aruppukottai" },
  { value: "government-arts-college-srivilliputhur", label: "Government Arts College, Srivilliputhur" },
  { value: "government-arts-college-rajapalayam", label: "Government Arts College, Rajapalayam" },
  { value: "government-arts-college-sattur", label: "Government Arts College, Sattur" },
  { value: "government-arts-college-virudhunagar", label: "Government Arts College, Virudhunagar" },
  { value: "government-arts-college-sivakasi", label: "Government Arts College, Sivakasi" },
  { value: "government-arts-college-tenkasi", label: "Government Arts College, Tenkasi" },
  { value: "government-arts-college-kadayanallur", label: "Government Arts College, Kadayanallur" },
  { value: "government-arts-college-sankarankovil", label: "Government Arts College, Sankarankovil" },
  { value: "government-arts-college-puliyangudi", label: "Government Arts College, Puliyangudi" },
  { value: "government-arts-college-vasudevanallur", label: "Government Arts College, Vasudevanallur" },
  { value: "government-arts-college-ambasamudram", label: "Government Arts College, Ambasamudram" },
  { value: "government-arts-college-cheranmahadevi", label: "Government Arts College, Cheranmahadevi" },
  { value: "government-arts-college-kalakkad", label: "Government Arts College, Kalakkad" },
  { value: "government-arts-college-nanguneri", label: "Government Arts College, Nanguneri" },
  { value: "government-arts-college-radhapuram", label: "Government Arts College, Radhapuram" },
  { value: "government-arts-college-tiruchendur", label: "Government Arts College, Tiruchendur" },
  { value: "government-arts-college-sathankulam", label: "Government Arts College, Sathankulam" },
  { value: "government-arts-college-udangudi", label: "Government Arts College, Udangudi" },
  { value: "government-arts-college-vilathikulam", label: "Government Arts College, Vilathikulam" },
  { value: "government-arts-college-kovilpatti", label: "Government Arts College, Kovilpatti" },
  { value: "government-arts-college-ottapidaram", label: "Government Arts College, Ottapidaram" },
  { value: "government-arts-college-kayathar", label: "Government Arts College, Kayathar" },
  { value: "government-arts-college-sriperumbudur", label: "Government Arts College, Sriperumbudur" },
  { value: "government-arts-college-tambaram", label: "Government Arts College, Tambaram" },
  { value: "government-arts-college-ponneri", label: "Government Arts College, Ponneri" },
  { value: "government-arts-college-gummidipoondi", label: "Government Arts College, Gummidipoondi" },
  { value: "government-arts-college-uthukottai", label: "Government Arts College, Uthukottai" },
  { value: "government-arts-college-tiruttani", label: "Government Arts College, Tiruttani" },
  { value: "government-arts-college-arani", label: "Government Arts College, Arani" },
  { value: "government-arts-college-vandavasi", label: "Government Arts College, Vandavasi" },
  { value: "government-arts-college-cheyyar", label: "Government Arts College, Cheyyar" },
  { value: "government-arts-college-polur", label: "Government Arts College, Polur" },
  { value: "government-arts-college-gingee", label: "Government Arts College, Gingee" },
  { value: "government-arts-college-tindivanam", label: "Government Arts College, Tindivanam" },
  { value: "government-arts-college-ulundurpet", label: "Government Arts College, Ulundurpet" },
  { value: "government-arts-college-vriddhachalam", label: "Government Arts College, Vriddhachalam" },
  { value: "government-arts-college-panruti", label: "Government Arts College, Panruti" },
  { value: "government-arts-college-neyveli", label: "Government Arts College, Neyveli" },
  { value: "government-arts-college-sethiathope", label: "Government Arts College, Sethiathope" },
  { value: "government-arts-college-kattumannarkoil", label: "Government Arts College, Kattumannarkoil" },
  { value: "government-arts-college-chinnasalem", label: "Government Arts College, Chinnasalem" },
  { value: "government-arts-college-kalvarayan-hills", label: "Government Arts College, Kalvarayan Hills" },
  { value: "government-arts-college-sankarapuram", label: "Government Arts College, Sankarapuram" },
  { value: "government-arts-college-tirukoilur", label: "Government Arts College, Tirukoilur" },
  { value: "government-arts-college-gingee", label: "Government Arts College, Gingee" },
  { value: "government-arts-college-tindivanam", label: "Government Arts College, Tindivanam" },
  { value: "government-arts-college-ulundurpet", label: "Government Arts College, Ulundurpet" },
  { value: "government-arts-college-vriddhachalam", label: "Government Arts College, Vriddhachalam" },
  { value: "government-arts-college-panruti", label: "Government Arts College, Panruti" },
  { value: "government-arts-college-neyveli", label: "Government Arts College, Neyveli" },
  { value: "government-arts-college-sethiathope", label: "Government Arts College, Sethiathope" },
  { value: "government-arts-college-kattumannarkoil", label: "Government Arts College, Kattumannarkoil" },
  { value: "government-arts-college-chinnasalem", label: "Government Arts College, Chinnasalem" },
  { value: "government-arts-college-kalvarayan-hills", label: "Government Arts College, Kalvarayan Hills" },
  { value: "government-arts-college-sankarapuram", label: "Government Arts College, Sankarapuram" },
  { value: "government-arts-college-tirukoilur", label: "Government Arts College, Tirukoilur" },
  { value: "government-arts-college-gingee", label: "Government Arts College, Gingee" },
  { value: "government-arts-college-tindivanam", label: "Government Arts College, Tindivanam" },
  { value: "government-arts-college-ulundurpet", label: "Government Arts College, Ulundurpet" },
  { value: "government-arts-college-vriddhachalam", label: "Government Arts College, Vriddhachalam" },
  { value: "government-arts-college-panruti", label: "Government Arts College, Panruti" },
  { value: "government-arts-college-neyveli", label: "Government Arts College, Neyveli" },
  { value: "government-arts-college-sethiathope", label: "Government Arts College, Sethiathope" },
  { value: "government-arts-college-kattumannarkoil", label: "Government Arts College, Kattumannarkoil" },
  { value: "government-arts-college-chinnasalem", label: "Government Arts College, Chinnasalem" },
  { value: "government-arts-college-kalvarayan-hills", label: "Government Arts College, Kalvarayan Hills" },
  { value: "government-arts-college-sankarapuram", label: "Government Arts College, Sankarapuram" },
  { value: "government-arts-college-tirukoilur", label: "Government Arts College, Tirukoilur" },
  { value: "government-arts-college-gingee", label: "Government Arts College, Gingee" },
  { value: "government-arts-college-tindivanam", label: "Government Arts College, Tindivanam" },
  { value: "government-arts-college-ulundurpet", label: "Government Arts College, Ulundurpet" },
  { value: "government-arts-college-vriddhachalam", label: "Government Arts College, Vriddhachalam" },
  { value: "government-arts-college-panruti", label: "Government Arts College, Panruti" },
  { value: "government-arts-college-neyveli", label: "Government Arts College, Neyveli" },
  { value: "government-arts-college-sethiathope", label: "Government Arts College, Sethiathope" },
  { value: "government-arts-college-kattumannarkoil", label: "Government Arts College, Kattumannarkoil" },
  { value: "government-arts-college-chinnasalem", label: "Government Arts College, Chinnasalem" },
  { value: "government-arts-college-kalvarayan-hills", label: "Government Arts College, Kalvarayan Hills" },
  { value: "government-arts-college-sankarapuram", label: "Government Arts College, Sankarapuram" },
  { value: "government-arts-college-tirukoilur", label: "Government Arts College, Tirukoilur" },
  { value: "government-arts-college-gingee", label: "Government Arts College, Gingee" },
  { value: "government-arts-college-tindivanam", label: "Government Arts College, Tindivanam" },
  { value: "government-arts-college-ulundurpet", label: "Government Arts College, Ulundurpet" },
  { value: "government-arts-college-vriddhachalam", label: "Government Arts College, Vriddhachalam" },
  { value: "government-arts-college-panruti", label: "Government Arts College, Panruti" },
  { value: "government-arts-college-neyveli", label: "Government Arts College, Neyveli" },
  { value: "government-arts-college-sethiathope", label: "Government Arts College, Sethiathope" },
  { value: "government-arts-college-kattumannarkoil", label: "Government Arts College, Kattumannarkoil" },
  { value: "government-arts-college-chinnasalem", label: "Government Arts College, Chinnasalem" },
  { value: "government-arts-college-kalvarayan-hills", label: "Government Arts College, Kalvarayan Hills" },
  { value: "government-arts-college-sankarapuram", label: "Government Arts College, Sankarapuram" },
  { value: "government-arts-college-tirukoilur", label: "Government Arts College, Tirukoilur" },
  { value: "government-arts-college-gingee", label: "Government Arts College, Gingee" },
  { value: "government-arts-college-tindivanam", label: "Government Arts College, Tindivanam" },
  { value: "government-arts-college-ulundurpet", label: "Government Arts College, Ulundurpet" },
  { value: "government-arts-college-vriddhachalam", label: "Government Arts College, Vriddhachalam" },
  { value: "government-arts-college-panruti", label: "Government Arts College, Panruti" },
  { value: "government-arts-college-neyveli", label: "Government Arts College, Neyveli" },
  { value: "government-arts-college-sethiathope", label: "Government Arts College, Sethiathope" },
  { value: "government-arts-college-kattumannarkoil", label: "Government Arts College, Kattumannarkoil" },
  { value: "government-arts-college-chinnasalem", label: "Government Arts College, Chinnasalem" },
  { value: "government-arts-college-kalvarayan-hills", label: "Government Arts College, Kalvarayan Hills" },
  { value: "government-arts-college-sankarapuram", label: "Government Arts College, Sankarapuram" },
  { value: "government-arts-college-tirukoilur", label: "Government Arts College, Tirukoilur" },
  { value: "government-arts-college-gingee", label: "Government Arts College, Gingee" },
  { value: "government-arts-college-tindivanam", label: "Government Arts College, Tindivanam" },
  { value: "government-arts-college-ulundurpet", label: "Government Arts College, Ulundurpet" },
  { value: "government-arts-college-vriddhachalam", label: "Government Arts College, Vriddhachalam" },
  { value: "government-arts-college-panruti", label: "Government Arts College, Panruti" },
  { value: "government-arts-college-neyveli", label: "Government Arts College, Neyveli" },
  { value: "government-arts-college-sethiathope", label: "Government Arts College, Sethiathope" },
    { value: "other", label: "Other / Not Listed" },
];

interface EditProfileFormProps {
  initialData: z.infer<typeof formSchema>;
  onSave: (data: z.infer<typeof formSchema>) => Promise<void>;
  onCancel: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ initialData, onSave, onCancel }) => {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  const handleSave = async (data: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      await onSave(data);
      toast.success("Profile updated successfully!");
      onCancel();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">First Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Last Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Age</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Mobile Number</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="upiId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">UPI ID</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Gender</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-wrap gap-4" disabled={isSaving}>
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="userType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">User Type</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-wrap gap-4" disabled={isSaving}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="user-type-student" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
                    <Label htmlFor="user-type-student" className="text-foreground">Student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="staff" id="user-type-staff" className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground" />
                    <Label htmlFor="user-type-staff" className="text-foreground">Staff</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="collegeName"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-foreground">College Name</FormLabel>
              <FormControl>
                <Combobox
                  options={COLLEGE_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select or type your college..."
                  emptyMessage="No college found."
                  searchPlaceholder="Search colleges..."
                  disabled={isSaving}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avatarStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Avatar Style</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving}>
                <FormControl>
                  <SelectTrigger className="bg-input text-foreground border-border focus:ring-ring focus:border-ring">
                    <SelectValue placeholder="Select avatar style" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-popover text-popover-foreground border-border max-h-60 overflow-y-auto">
                  {DICEBEAR_AVATAR_STYLES.map((style) => (
                    <SelectItem key={style} value={style}>{style.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default EditProfileForm;