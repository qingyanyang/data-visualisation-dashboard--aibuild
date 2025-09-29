"use client";

import { useState } from "react";
import { useUploadHistory } from "@/hooks/useUploadHistory";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { FileSpreadsheet } from "lucide-react";
import Spinner from "./spinner";
import clsx from "clsx";
import SectionLayout from "./section-layout";

export function UploadsHistory() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useUploadHistory(page);

  if (isLoading) {
    return <Spinner />;
  }

  if (isError) {
    return (
      <p className="mt-12 text-sm text-destructive">Failed to load history</p>
    );
  }

  return (
    <SectionLayout
      title={"Upload History"}
      desc={`View a record of all uploaded Excel files, including who uploaded
          them, when, how many rows were processed, and their final status.`}
    >
      <div className="overflow-x-auto border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-2 text-left">File</th>
              <th className="px-4 py-2 text-left">Uploaded At</th>
              <th className="px-4 py-2 text-left">Rows</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">User</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((item, index) => (
              <tr
                key={item.id}
                className={clsx(
                  index !== data?.data.length - 1 && "border-b",
                  "hover:bg-gray-50"
                )}
              >
                <td className="px-4 py-2">{item.fileName}</td>
                <td className="px-4 py-2">
                  {new Date(item.uploadedAt).toLocaleString()}
                </td>
                <td className="px-4 py-2">{item.rowCount}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.status === "success"
                        ? "bg-success/20 text-success"
                        : item.status === "partial"
                        ? "bg-accent-orange/20 text-accent-orange"
                        : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-2">{item.user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {data?.page} of {data?.totalPages}
        </span>
        <button
          disabled={page >= (data?.totalPages ?? 1)}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </SectionLayout>
  );
}
