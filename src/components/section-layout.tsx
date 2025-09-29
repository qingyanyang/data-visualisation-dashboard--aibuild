import React, { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface SectionLayoutProps {
  title: string;
  desc: string;
  children: ReactNode;
}
const SectionLayout: React.FC<SectionLayoutProps> = ({
  title,
  desc,
  children,
}) => {
  return (
    <Card className="w-full max-w-4xl mx-auto border-none shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
};

export default SectionLayout;
