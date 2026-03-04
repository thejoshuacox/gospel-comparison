"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_TRANSLATION, SUPPORTED_TRANSLATIONS } from "@/lib/constants";

type Props = {
  value: string;
};

export function TranslationSelect({ value }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = useMemo(() => value || DEFAULT_TRANSLATION, [value]);

  function onChange(nextValue: string): void {
    const params = new URLSearchParams(searchParams.toString());
    params.set("translation", nextValue);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <label className="translation-control">
      <span>Translation</span>
      <select value={current} onChange={(event) => onChange(event.target.value)}>
        {SUPPORTED_TRANSLATIONS.map((item) => (
          <option key={item} value={item}>
            {item.toUpperCase()}
          </option>
        ))}
      </select>
    </label>
  );
}

