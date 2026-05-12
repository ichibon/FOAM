import { Analytics } from '@vercel/analytics/react';
import { FoamNav, FoamHero, FoamStatsBar } from './components/Top.jsx';
import { FoamAudienceRouter, FoamHowItWorks, FoamProductFeature } from './components/Mid.jsx';
import { FoamPricing, FoamFounderStory, FoamFoundingOperator, FoamFinalCTA, FoamFooter } from './components/Bottom.jsx';

export default function App() {
  return (
    <>
      <FoamNav />
      <FoamHero city="Atlanta" />
      <FoamStatsBar />
      <FoamAudienceRouter />
      <FoamHowItWorks />
      <FoamProductFeature />
      <FoamPricing />
      <FoamFounderStory />
      <FoamFoundingOperator />
      <FoamFinalCTA />
      <FoamFooter />
      <Analytics />
    </>
  );
}
