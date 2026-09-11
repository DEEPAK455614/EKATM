import QuickSurveyPortal from '@/components/QuickSurveyPortal';
import SimpleSurveyPortal from '@/components/SimpleSurveyPortal';

export default async function FieldPage({params}:{params:Promise<{slug?:string[]}>}){
  const {slug}=await params;
  if(slug?.[0]==='full') return <SimpleSurveyPortal/>;
  return <QuickSurveyPortal/>;
}
