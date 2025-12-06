"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CollegeComboboxProps {
  collegeList: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CollegeCombobox: React.FC<CollegeComboboxProps> = ({
  collegeList,
  value,
  onValueChange,
  placeholder = "Select college...",
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          disabled={disabled}
        >
          {value
            ? collegeList.find((college) => college === value)
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover text-popover-foreground border-border">
        <Command>
          <CommandInput placeholder="Search college..." className="h-9" />
          <CommandList>
            <CommandEmpty>No college found.</CommandEmpty>
            <CommandGroup>
              {collegeList.map((college) => (
                <CommandItem
                  key={college}
                  value={college}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                  className="aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  {college}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === college ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CollegeCombobox;