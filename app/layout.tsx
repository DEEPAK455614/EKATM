import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata:Metadata={
  title:{default:'EKATM — Yatra Survey & Intelligence',template:'%s · EKATM'},
  description:'Offline-first field survey, CRM, route coordination, reporting and grounded operational intelligence for EkAtma Yatra.',
  manifest:'/manifest.webmanifest',
  applicationName:'EKATM',
  appleWebApp:{capable:true,statusBarStyle:'black-translucent',title:'EKATM'},
  icons:{icon:'/icon.svg'}
};
export const viewport:Viewport={themeColor:'#8f4315',width:'device-width',initialScale:1,viewportFit:'cover'};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><script dangerouslySetInnerHTML={{__html:`if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}`}} />{children}</body></html>;
}
