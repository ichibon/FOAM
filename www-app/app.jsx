// ── FOAM App Entry Point ───────────────────────────────────
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentColor": "#339DC7",
  "headlineFont": "Playfair Display",
  "showFoundingBanner": true
}/*EDITMODE-END*/;

function App() {
  const [page, setPage] = useState('home');
  const [transitioning, setTransitioning] = useState(false);

  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const navigate = (targetPage) => {
    if (targetPage === page) return;
    setTransitioning(true);
    setTimeout(() => {
      setPage(targetPage);
      setTransitioning(false);
      window.scrollTo({ top: 0 });
    }, 180);
  };

  const renderPage = () => {
    const props = { navigate };
    switch (page) {
      case 'home':       return <HomePage {...props} />;
      case 'customers':  return <CustomersPage {...props} />;
      case 'detailers':  return <DetailersPage {...props} />;
      case 'shops':      return <ShopsPage {...props} />;
      case 'pricing':    return <PricingPage {...props} />;
      case 'about':      return <AboutPage {...props} />;
      case 'resources':  return <ResourcesPage {...props} />;
      case 'atlanta':    return <AtlantaPage {...props} />;
      default:           return <HomePage {...props} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header currentPage={page} navigate={navigate} />
      <main style={{
        flex: 1,
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? 'translateY(10px)' : 'translateY(0)',
        transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
      }}>
        {renderPage()}
      </main>
      <Footer navigate={navigate} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Brand" />
        <TweakColor
          label="Accent color"
          value={tweaks.accentColor}
          onChange={v => setTweak('accentColor', v)}
        />
        <TweakSection label="Typography" />
        <TweakSelect
          label="Headline font"
          value={tweaks.headlineFont}
          options={['Playfair Display', 'Georgia', 'Cormorant Garamond']}
          onChange={v => setTweak('headlineFont', v)}
        />
        <TweakSection label="Features" />
        <TweakToggle
          label="Show founding banner"
          value={tweaks.showFoundingBanner}
          onChange={v => setTweak('showFoundingBanner', v)}
        />
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
