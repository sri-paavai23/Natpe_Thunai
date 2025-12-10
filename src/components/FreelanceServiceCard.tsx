"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, User, Phone, MessageSquareText, DollarSign, MapPin } from "lucide-react";
import { ServicePost } from "@/hooks/useServiceListings"; // Assuming ServicePost type is available
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import { Link } from "react-router-dom";

interface FreelanceServiceCardProps {
  service: ServicePost;
}

const FreelanceServiceCard: React.FC<FreelanceServiceCardProps> = ({ service }) => {
  const avatarUrl = generateAvatarUrl(service.posterName || "Anonymous", service.posterAvatarStyle || "pixel-art", 128); // Pass size explicitly

  return (
    <Card className="bg-card text-card-foreground border-border shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 border-2 border-secondary-neon">
            <AvatarImage src={avatarUrl} alt={service.posterName} />
            <AvatarFallback>
              <User className="h-5 w-5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg font-semibold">{service.title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Posted by {service.posterName}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{service.collegeName}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">{service.description}</p>
        <div className="flex items-center gap-2 text-primary-foreground">
          <Briefcase className="h-4 w-4 text-secondary-neon" />
          <span className="font-medium">Category: {service.category.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
        </div>
        <div className="flex items-center gap-2 text-primary-foreground">
          <DollarSign className="h-4 w-4 text-secondary-neon" />
          <span className="font-medium">Price/Rate: {service.price}</span>
        </div>
        {service.ambassadorDelivery && (
          <div className="flex items-center gap-2 text-primary-foreground">
            <MessageSquareText className="h-4 w-4 text-secondary-neon" />
            <span className="font-medium">Ambassador Facilitation: {service.ambassadorMessage || "Available"}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button asChild className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          <a href={`tel:${service.contact}`} target="_blank" rel="noopener noreferrer">
            <Phone className="mr-2 h-4 w-4" /> Contact {service.posterName}
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FreelanceServiceCard;