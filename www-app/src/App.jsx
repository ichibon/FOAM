import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FoamNav, FoamHero, FoamStatsBar } from './components/Top.jsx';
import { FoamAudienceRouter, FoamHowItWorks, FoamProductFeature } from './components/Mid.jsx';
import { FoamPricing, FoamFounderStory, FoamFoundingOperator, FoamFinalCTA, FoamFooter } from './components/Bottom.jsx';
import { TermsOfService } from './pages/TermsOfService.jsx';
import { PrivacyPolicy } from './pages/PrivacyPolicy.jsx';
import { OperatorAgreement } from './pages/OperatorAgreement.jsx';

function HomePage() {
  return (
    <>
      <FoamNav />
      <FoamHero />
      <FoamStatsBar />
      <FoamAudienceRouter />
      <FoamHowItWorks />
      <FoamProductFeature />
      <FoamPricing />
      <FoamFounderStory />
      <FoamFoundingOperator />
      <FoamFinalCTA />
      <FoamFooter />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/operator-agreement" element={<OperatorAgreement />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
