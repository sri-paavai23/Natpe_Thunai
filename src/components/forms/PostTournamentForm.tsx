import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils"; // Import cn
import { useTournamentData } from "@/hooks/useTournamentData";
import { toast } from "sonner";

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  game: z.string().min(2, { message: "Game name is required." }),
  platform: z.string().min(2, { message: "Platform is required." }),
  date: z.date({ required_error: "A date is required." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format (HH:MM)." }),
  prizePool: z.string().min(1, { message: "Prize pool is required." }),
  fee: z.coerce.number().min(0, { message: "Fee cannot be negative." }),
  minPlayers: z.coerce.number().min(1, { message: "Minimum players must be at least 1." }),
  maxPlayers: z.coerce.number().min(1, { message: "Maximum players must be at least 1." }),
  maxParticipants: z.coerce.number().min(1, { message: "Maximum participants must be at least 1." }),
  description: z.string().optional(),
}).refine(data => data.maxPlayers >= data.minPlayers, {
  message: "Max players cannot be less than min players.",
  path: ["maxPlayers"],
});

interface PostTournamentFormProps {
  onSuccess: () => void;
}

const PostTournamentForm: React.FC<PostTournamentFormProps> = ({ onSuccess }) => {
  const { postTournament } = useTournamentData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      game: "",
      platform: "",
      time: "18:00",
      prizePool: "",
      fee: 0,
      minPlayers: 1,
      maxPlayers: 1,
      maxParticipants: 16,
      description: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await postTournament({
        title: data.title,
        game: data.game,
        platform: data.platform,
        date: data.date.toISOString(),
        time: data.time,
        prizePool: data.prizePool,
        fee: data.fee,
        minPlayers: data.minPlayers,
        maxPlayers: data.maxPlayers,
        maxParticipants: data.maxParticipants,
        description: data.description || undefined,
      });
      onSuccess();
      form.reset();
    } catch (error) {
      console.error("Error posting tournament:", error);
      toast.error("Failed to post tournament.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tournament Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Valorant College Clash" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="game"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Game</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Valorant" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="platform"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Platform</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PC">PC</SelectItem>
                  <SelectItem value="PlayStation">PlayStation</SelectItem>
                  <SelectItem value="Xbox">Xbox</SelectItem>
                  <SelectItem value="Mobile">Mobile</SelectItem>
                  <SelectItem value="Nintendo Switch">Nintendo Switch</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time (HH:MM)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="prizePool"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prize Pool</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., ₹10,000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Fee (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="minPlayers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Players/Team</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxPlayers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Players/Team</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxParticipants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Teams/Participants</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us more about the tournament..." rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Posting..." : "Post Tournament"}
        </Button>
      </form>
    </Form>
  );
};

export default PostTournamentForm;