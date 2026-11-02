import { MapPin, Clock, Phone, Mail, Facebook, Instagram, Twitter } from '../lib/icons';

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.9 2.9 0 0 1 .88.13V9.4a6.34 6.34 0 0 0-.88-.05A6.33 6.33 0 0 0 5.1 20.14a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.14-.14z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-wood-dark text-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-11 h-11 rounded-full bg-cream flex items-center justify-center p-1">
                <img
                  src="/uploads/image-removebg-preview.png"
                  alt="Manna logo"
                  className="w-full h-full object-contain"
                />
              </span>
              <span className="font-display text-lg font-semibold">
                Manna <span className="italic font-normal text-blush-deep">Accessories</span>
              </span>
            </div>
            <p className="text-cream/70 text-sm leading-relaxed">
              Premium Baking Essentials, Timeless Craft. Durable tools crafted with style to
              elevate your baking experience.
            </p>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-blush mb-4">
              Visit Us
            </h4>
            <div className="flex items-start gap-2.5 text-sm">
              <MapPin size={16} className="mt-0.5 text-mint shrink-0" />
              <div>
                <p className="font-bold">31b Lateef Salami, Ajao Estate</p>
                <p className="text-cream/70 mt-1.5 leading-relaxed">
                  Find us at the heart of Lagos, ready to serve your baking needs with quality
                  and care.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-sm mt-4">
              <Clock size={16} className="text-mint shrink-0" />
              <p className="font-semibold">Mon–Sat 9am–6pm</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-blush mb-4">
              Direct Contact
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="tel:+2348098765432"
                  className="flex items-center gap-2.5 hover:text-blush transition-colors"
                >
                  <Phone size={16} className="text-mint shrink-0" />
                  +2348098765432
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@mannaaccessories.com"
                  className="flex items-center gap-2.5 hover:text-blush transition-colors"
                >
                  <Mail size={16} className="text-mint shrink-0" />
                  info@mannaaccessories.com
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-blush mb-4">
              Follow Us
            </h4>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-blush hover:text-blush-ink transition-colors"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-blush hover:text-blush-ink transition-colors"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-blush hover:text-blush-ink transition-colors"
              >
                <TikTokIcon size={18} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-blush hover:text-blush-ink transition-colors"
              >
                <Twitter size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-cream/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cream/60">
          <p>© 2024 Manna Accessories. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#top" className="hover:text-blush transition-colors">
              Terms &amp; conditions
            </a>
            <a href="/admin" className="hover:text-blush transition-colors">
              Staff Login
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
