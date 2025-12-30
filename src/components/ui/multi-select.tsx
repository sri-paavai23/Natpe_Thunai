"use client";

import * as React from "react";
import { X, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface MultiSelectProps {
  options: { label: string; value: string }[];
  selected: string[];
  onSelect: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onSelect,
  placeholder,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onSelect(newSelected);
  };

  const handleRemove = (value: string) => {
    onSelect(selected.filter((item) => item !== value));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length > 0 ? (
              selected.map((value) => {
                const option = options.find((o) => o.value === value);
                return (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {option?.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(value);
                      }}
                    />
                  </Badge>
                );
              })
            ) : (
              <span className="text-muted-foreground">{placeholder || "Select..."}</span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => handleSelect(option.value)}
                className="cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  readOnly
                  className="mr-2"
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}