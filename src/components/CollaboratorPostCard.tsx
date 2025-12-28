import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Tag, MessageSquareText, Calendar } from 'lucide-react';
import { CollaboratorPost, ProjectStatus } from '@/hooks/useCollaboratorPosts';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface CollaboratorPostCardProps {
  post: CollaboratorPost;
}

const CollaboratorPostCard: React.FC<CollaboratorPostCardProps> = ({ post }) => {
  const { user } = useAuth();

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "Open": return "bg-green-500";
      case "Ongoing": return "bg-blue-500";
      case "Completed": return "bg-purple-500";
      case "Closed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const handleContactPoster = () => {
    if (!user) {
      toast.error("You must be logged in to contact the poster.");
      return;
    }
    if (user.$id === post.posterId) {
      toast.message("You are the poster of this project.");
      return;
    }
    // In a real app, this would open a chat or contact form
    toast.success(`Contacting ${post.posterName} at ${post.contactInfo}`);
  };

  return (
    <Card className="w-full max-w-sm flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> {post.title}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(post.status)}`}>
            {post.status}
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{post.category} - {post.collegeName}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        {post.imageUrl && (
          <img src={post.imageUrl} alt={post.title} className="w-full h-32 object-cover rounded-md mb-2" />
        )}
        <p className="text-sm text-gray-700 line-clamp-3 mb-2">{post.description}</p>
        <div className="text-sm text-muted-foreground space-y-1 mt-2">
          <p className="flex items-center gap-1"><Tag className="h-4 w-4" /> Skills: {post.skillsNeeded.join(', ')}</p>
          <p className="flex items-center gap-1"><User className="h-4 w-4" /> Posted by: {post.posterName}</p>
          <p className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Posted: {new Date(post.$createdAt).toLocaleDateString()}</p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 pt-0">
        <Link to={`/collaborator/${post.$id}`} className="flex-1">
          <Button variant="outline" className="w-full">View Details</Button>
        </Link>
        {post.status === "Open" && user?.$id !== post.posterId && (
          <Button onClick={handleContactPoster} className="flex-1">
            <MessageSquareText className="h-4 w-4 mr-1" /> Contact Poster
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default CollaboratorPostCard;