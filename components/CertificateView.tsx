"use client";

interface CertificateViewProps {
  userName: string;
  date: string;
}

export default function CertificateView({ userName, date }: CertificateViewProps) {
  return (
    <div className="cert-wrap">
      <div className="text-[9px] tracking-[6px] text-gold uppercase mb-8">
        The Landlord · Academy
      </div>
      <div className="font-serif text-[13px] tracking-[4px] text-grey uppercase mb-4">
        Certifie que
      </div>
      <div className="font-serif italic text-[48px] text-cream mb-2">
        {userName}
      </div>
      <div className="text-[12px] text-grey-light leading-[1.9] mb-8">
        a complété avec succès le programme de certification
        <br />
        du Manuel de Franchise The Landlord — Édition 2026
        <br />
        avec un score global ≥ 80% sur les 4 sessions.
      </div>
      <div className="flex justify-center gap-6 mb-9">
        <div className="w-2 h-2 rounded-full bg-gold" />
        <div className="w-2 h-2 rounded-full bg-gold" />
        <div className="w-2 h-2 rounded-full bg-gold" />
        <div className="w-2 h-2 rounded-full bg-gold" />
      </div>
      <div className="text-[10px] tracking-[2px] text-grey border-t border-gold/15 pt-6 mb-9">
        {date}
      </div>
      <div className="font-serif italic text-[20px] text-gold-light">
        Sarah &amp; Farouk Ben Achour
      </div>
      <div className="text-[9px] tracking-[2px] text-grey mt-1">
        Fondateurs · The Landlord
      </div>
    </div>
  );
}
