import type { Metadata } from "next";
import { Gallery } from "@/components/test/gallery";

export const metadata: Metadata = {
  title: "Widget lab",
  description: "Two DaisyUI layouts for each kind of search result.",
};

export default function TestPage() {
  return <Gallery />;
}
