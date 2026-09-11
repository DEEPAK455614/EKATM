import './globals.css';
import type {Metadata,Viewport} from 'next';
import EkatmaSplash from '@/components/EkatmaSplash';

export const metadata:Metadata={
  title:{default:'EKATMA Yatra State Survey',template:'%s · EKATMA Survey'},
  description:'Digital version of the Ekatma Yatra Comprehensive State Survey with a central survey administration backend.',
  applicationName:'EKATMA Survey',
  manifest:'/manifest.webmanifest',
  icons:{icon:'/icon.svg'}
};
export const viewport:Viewport={themeColor:'#91420f',width:'device-width',initialScale:1,viewportFit:'cover'};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><EkatmaSplash appName="Survey"/><script dangerouslySetInnerHTML={{__html:`if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).catch(function(){})})}`}}/>{children}</body></html>;
}
