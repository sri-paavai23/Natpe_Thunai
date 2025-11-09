"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ShieldCheck, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const policyContent = {
  termsOfService: {
    title: "Terms of Service",
    description: "These terms govern your use of Natpe🤝Thunai. By accessing or using our services, you agree to be bound by these terms. This includes rules for user conduct, content submission, intellectual property, and dispute resolution. We reserve the right to modify these terms at any time.",
    fullText: `
      <h3 class="text-lg font-semibold mb-2 text-foreground">1. Acceptance of Terms</h3>
      <p class="text-sm text-muted-foreground mb-4">By accessing and using Natpe🤝Thunai, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">2. User Conduct</h3>
      <p class="text-sm text-muted-foreground mb-4">Users are expected to interact respectfully and lawfully. Prohibited activities include harassment, fraud, spamming, and any actions that violate local laws or campus policies.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">3. Content Submission</h3>
      <p class="text-sm text-muted-foreground mb-4">You are responsible for all content you post. Content must be accurate, legal, and not infringe on any third-party rights. We reserve the right to remove any content deemed inappropriate.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">4. Intellectual Property</h3>
      <p class="text-sm text-muted-foreground mb-4">All content and trademarks on Natpe🤝Thunai are the property of their respective owners. You may not use any content without explicit permission.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">5. Limitation of Liability</h3>
      <p class="text-sm text-muted-foreground mb-4">Natpe🤝Thunai is provided "as is" without any warranties. We are not liable for any damages arising from your use of the platform.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">6. Governing Law</h3>
      <p class="text-sm text-muted-foreground mb-4">These terms shall be governed by the laws of India, without regard to its conflict of law provisions.</p>
    `,
  },
  privacyPolicy: {
    title: "Privacy Policy",
    description: "This policy explains how we collect, use, and protect your personal data. We are committed to safeguarding your privacy and ensuring transparency in our data practices. This includes details on data collection, usage, sharing, and your rights.",
    fullText: `
      <h3 class="text-lg font-semibold mb-2 text-foreground">1. Information We Collect</h3>
      <p class="text-sm text-muted-foreground mb-4">We collect personal information such as your name, email, age, mobile number, UPI ID, and college ID photo during registration. We also collect usage data and device information.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">2. How We Use Your Information</h3>
      <p class="text-sm text-muted-foreground mb-4">Your information is used to provide and improve our services, personalize your experience, process transactions, and for security purposes. Your age, mobile number, UPI ID, and college ID photo are for developer safety assurance only and will not be shared publicly. Only your chosen username will be visible to other users.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">3. Data Sharing and Disclosure</h3>
      <p class="text-sm text-muted-foreground mb-4">We do not sell your personal data. We may share information with trusted third-party service providers for operational purposes, under strict confidentiality agreements. We may also disclose data if required by law.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">4. Data Security</h3>
      <p class="text-sm text-muted-foreground mb-4">We implement robust security measures to protect your data from unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is entirely secure.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">5. Your Rights</h3>
      <p class="text-sm text-muted-foreground mb-4">You have the right to access, correct, or delete your personal data. Please contact us to exercise these rights.</p>
    `,
  },
  refundPolicy: {
    title: "Refund Policy",
    description: "Our refund policy outlines the conditions under which refunds are issued for products and services. This covers eligibility criteria, return periods, and procedures for damaged goods. Please review carefully before making transactions.",
    fullText: `
      <h3 class="text-lg font-semibold mb-2 text-foreground">1. Eligibility for Refunds</h3>
      <p class="text-sm text-muted-foreground mb-4">Refunds are generally issued for items that are significantly not as described, or for services not rendered as agreed. Digital goods and certain services may have specific non-refundable conditions.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">2. Return Period</h3>
      <p class="text-sm text-muted-foreground mb-4">For physical products, a return period of 7 days from the date of delivery applies. Refund requests must be initiated within this period.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">3. Damaged Products</h3>
      <p class="text-sm text-muted-foreground mb-4">A full refund is required if a product is damaged by the user within the return period. Proof of damage at the time of receipt may be required for full refunds on damaged-during-delivery items.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">4. Process for Refunds</h3>
      <p class="text-sm text-muted-foreground mb-4">To request a refund, please contact our support team with your transaction details and reason for the request. All refunds are subject to review and approval.</p>
      <h3 class="text-lg font-semibold mb-2 text-foreground">5. Service Cancellations</h3>
      <p class="text-sm text-muted-foreground mb-4">Cancellation policies for services vary by provider. Please check the specific service listing for details. A 30% commission may still apply to services partially rendered or cancelled late.</p>
    `,
  },
};

const PoliciesPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({ title: "", description: "", fullText: "" });

  const handleViewPolicy = (policyKey: keyof typeof policyContent) => {
    const content = policyContent[policyKey];
    setDialogContent(content);
    setIsDialogOpen(true);
    toast.info(`Opening "${content.title}"...`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Policies</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-secondary-neon" /> Our Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Understand how Natpe🤝Thunai operates and protects your rights.
            </p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleViewPolicy("termsOfService")}
            >
              <ScrollText className="mr-2 h-4 w-4" /> Terms of Service
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleViewPolicy("privacyPolicy")}
            >
              <ShieldCheck className="mr-2 h-4 w-4" /> Privacy Policy
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleViewPolicy("refundPolicy")}
            >
              <FileText className="mr-2 h-4 w-4" /> Refund Policy
            </Button>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{dialogContent.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {dialogContent.description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-foreground" dangerouslySetInnerHTML={{ __html: dialogContent.fullText }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PoliciesPage;