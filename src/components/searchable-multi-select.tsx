"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { useProducts } from "@/hooks/useProducts";
import Spinner from "@/components/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Option {
  value: number;
  label: string;
}

export function SearchableMultiSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number[];
  onChange: (val: number[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data: products, isLoading } = useProducts();

  const options: Option[] =
    products
      ?.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((p) => ({
        value: p.id,
        label: p.name,
      })) ?? [];

  const toggleOption = (val: number) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  // selected text
  const selectedLabels =
    options
      .filter((o) => value.includes(o.value))
      .map((o) => o.label)
      .join(", ") || "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-[260px] justify-between"
              >
                <span className="truncate">
                  {selectedLabels || `Search ${label}...`}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          {selectedLabels && (
            <TooltipContent className="max-w-xs break-words text-white">
              {selectedLabels}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <PopoverContent className="w-[260px] p-0 bg-white">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${label}...`}
            onValueChange={setSearchTerm}
          />
          <CommandList className="bg-white">
            {isLoading ? (
              <div className="p-2 flex justify-center">
                <Spinner />
              </div>
            ) : options.length === 0 ? (
              <CommandEmpty>No {label} found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    onSelect={() => toggleOption(opt.value)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value.includes(opt.value) ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
