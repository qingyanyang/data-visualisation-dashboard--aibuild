"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";

interface Option<T extends string = string> {
  value: T;
  label: string;
}

export function MatrixSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  multiple,
}: {
  label: string;
  options: Option<T>[];
  value: T[];
  onChange: (val: T[]) => void;
  multiple: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (val: T) => {
    if (multiple) {
      if (value.includes(val)) {
        onChange(value.filter((v) => v !== val));
      } else {
        onChange([...value, val]);
      }
    } else {
      onChange([val]);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="justify-between">
          {value.length > 0
            ? options
                .filter((o) => value.includes(o.value))
                .map((o) => o.label)
                .join(", ")
            : `Select ${label}`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="bg-white p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  onSelect={() => handleSelect(opt.value)}
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
