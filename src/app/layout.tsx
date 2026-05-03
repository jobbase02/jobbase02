import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobBase",
  description: "AI-powered job search for freshers & fresh graduates",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        {/* Telegram Web Apps SDK — must load synchronously before body renders */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://telegram.org/js/telegram-web-app.js" />

        {/*
          Read Telegram's theme params BEFORE first paint so there is
          no flash of the wrong theme colour.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try{
    var tg=window.Telegram&&window.Telegram.WebApp;
    if(!tg)return;
    tg.ready();
    tg.expand();
    var p=tg.themeParams||{};
    var r=document.documentElement;
    function set(k,v){if(v)r.style.setProperty(k,v);}
    set('--tg-bg',           p.bg_color);
    set('--tg-secondary-bg', p.secondary_bg_color);
    set('--tg-text',         p.text_color);
    set('--tg-hint',         p.hint_color);
    set('--tg-link',         p.link_color);
    set('--tg-button',       p.button_color);
    set('--tg-button-text',  p.button_text_color);
    r.setAttribute('data-theme', tg.colorScheme||'light');
  }catch(e){}
})();
`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
