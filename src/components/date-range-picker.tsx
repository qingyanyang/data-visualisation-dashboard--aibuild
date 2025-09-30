"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

export function DateRangePicker({
  value,
  onChange,
  maxDays = 7,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange) => void;
  maxDays?: number;
}) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selected: DateRange | undefined) => {
    if (selected?.from && selected?.to) {
      const diff =
        (selected.to.getTime() - selected.from.getTime()) /
        (1000 * 60 * 60 * 24);

      if (diff > maxDays) {
        alert(`You can only select up to ${maxDays} days`);
        return;
      }
      onChange(selected);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[260px] justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, "LLL dd, y")} -{" "}
                {format(value.to, "LLL dd, y")}
              </>
            ) : (
              format(value.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0 flex items-center justify-center bg-white"
      >
        <Calendar
          mode="range"
          selected={value}
          onSelect={handleSelect}
          numberOfMonths={1}
          defaultMonth={value?.from ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}
