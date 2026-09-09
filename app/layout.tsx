import './globals.css';
import type {Metadata,Viewport} from 'next';

export const metadata:Metadata={
  title:{default:'EKATMA Yatra State Survey',template:'%s · EKATMA Survey'},
  description:'Digital version of the Ekatma Yatra Comprehensive State Survey with a central survey administration backend.',
  applicationName:'EKATMA Survey',
  icons:{icon:'/icon.svg'}
};
export const viewport:Viewport={themeColor:'#91420f',width:'device-width',initialScale:1,viewportFit:'cover'};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><script dangerouslySetInnerHTML={{__html:`if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()})}).catch(function(){})}if('caches' in window){caches.keys().then(function(keys){keys.filter(function(k){return k.indexOf('ekatm-yatra')===0}).forEach(function(k){caches.delete(k)})}).catch(function(){})}`}}/>{children}</body></html>;
}
