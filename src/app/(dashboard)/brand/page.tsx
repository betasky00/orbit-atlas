"use client";

import { useEffect, useRef, useState } from "react";
import { Palette, Upload, Check, Loader2 } from "lucide-react";
import { loadBrand, saveBrand, type BrandKit } from "@/lib/brandStore";
import { downscaleDataUrl } from "@/lib/libraryStore";

export default function BrandPage() {
  const [brand, setBrand] = useState<BrandKit | null>(null);
  const [saved, setSaved] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => setBrand(loadBrand()), []);

  if (!brand) return <div className="p-8 text-sm text-[#857f74]">Loading…</div>;

  const set = (patch: Partial<BrandKit>) => {
    setBrand({ ...brand, ...patch });
    setSaved(false);
  };

  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const small = await downscaleDataUrl(reader.result as string, 512);
      set({ logo: small });
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    saveBrand(brand);
    setSaved(true);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Palette className="w-5 h-5 text-[#1c1a17]" />
        <div>
          <h1 className="text-2xl font-semibold text-[#1c1a17]">Brand Kit</h1>
          <p className="text-[#6b655b] text-sm mt-0.5">
            Set this once — the News Studio auto-fills your handle, logo, voice and colors.
          </p>
        </div>
      </div>

      <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center overflow-hidden flex-shrink-0">
            {brand.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo} alt="logo" className="w-full h-full object-contain" />
            ) : (
              <Palette className="w-5 h-5 text-[#a39c8d]" />
            )}
          </div>
          <div>
            <button
              onClick={() => logoRef.current?.click()}
              className="flex items-center gap-2 border border-[#c4bbab] hover:border-[#1c1a17]/40 text-[#1c1a17] px-3 py-1.5 rounded-lg text-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Upload logo
            </button>
            <p className="text-xs text-[#a39c8d] mt-1.5">PNG with transparent background works best</p>
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Business name" value={brand.businessName} onChange={(v) => set({ businessName: v })} placeholder="Luxe Gardens Paris" />
          <Field label="Niche" value={brand.niche} onChange={(v) => set({ niche: v })} placeholder="luxury landscaping" />
          <Field label="Handle" value={brand.handle} onChange={(v) => set({ handle: v })} placeholder="@luxegardens" />
          <div className="flex items-end gap-3">
            <ColorField label="Primary" value={brand.primaryColor} onChange={(v) => set({ primaryColor: v })} />
            <ColorField label="Accent" value={brand.secondaryColor} onChange={(v) => set({ secondaryColor: v })} />
          </div>
        </div>

        <label className="block text-xs text-[#6b655b]">
          Brand voice (how the AI should sound)
          <textarea
            value={brand.voice}
            onChange={(e) => set({ voice: e.target.value })}
            rows={3}
            placeholder="e.g. Refined, confident, understated luxury. Short sentences. No emojis in headlines."
            className="mt-1 w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] resize-none outline-none focus:border-[#1c1a17]/50"
          />
        </label>

        <button
          onClick={save}
          className="flex items-center gap-2 bg-[#1c1a17] hover:bg-[#000000] text-[#f7f3ec] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {saved ? <Check className="w-4 h-4" /> : null}
          {saved ? "Saved" : "Save brand kit"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block text-xs text-[#6b655b]">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] outline-none focus:border-[#1c1a17]/50"
      />
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs text-[#6b655b]">
      {label}
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 block w-10 h-9 rounded border border-[#d4ccbd]" />
    </label>
  );
}
