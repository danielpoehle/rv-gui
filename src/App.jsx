// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import DashboardPage from './pages/DashboardPage';
import SlotOverviewPage from './pages/SlotOverviewPage';
import NewSlotPage from './pages/NewSlotPage';
import AnfrageOverviewPage from './pages/AnfrageOverviewPage';
import NewAnfragePage from './pages/NewAnfragePage'; 
import KapazitaetstopfOverviewPage from './pages/KapazitaetstopfOverviewPage'; 
import KonfliktOverviewPage from './pages/KonfliktOverviewPage'; 
import KonfliktCoordinationPage from './pages/KonfliktCoordinationPage';
import KapazitaetstopfSummary from './pages/KapazitaetstopfSummary';
import SlotSummaryPage from './pages/SlotSummaryPage';
import SlotDetailPage from './pages/SlotDetailPage';
import KapazitaetstopfDetailPage from './pages/KapazitaetstopfDetailPage';
import AnfrageDetailPage from './pages/AnfrageDetailPage';
import AnfrageSummaryPage from './pages/AnfrageSummaryPage';
import KonfliktDetailPage from './pages/KonfliktDetailPage';
import KonfliktGruppenOverviewPage from './pages/KonfliktGruppenOverviewPage';
import KonfliktGruppenCoordinationPage from './pages/KonfliktGruppenCoordinationPage';
// Importiere hier die anderen Platzhalter-Seiten, wenn du sie erstellt hast

function App() {
  return (
    <Container className="mt-4">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/slots" element={<SlotOverviewPage />} />
        <Route path="/slots/neu" element={<NewSlotPage />} />
        <Route path="/anfragen" element={<AnfrageOverviewPage />} />
        <Route path="/anfragen/neu" element={<NewAnfragePage />} />
        <Route path="/kapazitaetstoepfe" element={<KapazitaetstopfOverviewPage />} />
        <Route path="/konflikte" element={<KonfliktOverviewPage />} />
        <Route path="/konflikte/bearbeiten" element={<KonfliktCoordinationPage />} />
        <Route path="/kapazitaetstoepfe/summary" element={<KapazitaetstopfSummary />} />
        <Route path="/slots/summary" element={<SlotSummaryPage />} />
        <Route path="/slots/:slotId" element={<SlotDetailPage />} />
        <Route path="/kapazitaetstoepfe/:topfId" element={<KapazitaetstopfDetailPage />} />
        <Route path="/anfragen/:anfrageId" element={<AnfrageDetailPage />} />
        <Route path="/anfragen/summary" element={<AnfrageSummaryPage />} /> 
        <Route path="/konflikte/:konfliktId" element={<KonfliktDetailPage />} />
        <Route path="/gruppen" element={<KonfliktGruppenOverviewPage />} />
        <Route path="/konflikte/gruppen/:gruppenId/bearbeiten" element={<KonfliktGruppenCoordinationPage />} />
        {/* Hier kommen die Routen für die anderen Seiten hin */}
        {/* <Route path="/slots/neu" element={<NewSlotPage />} /> */}
        {/* <Route path="/anfragen" element={<AnfrageOverviewPage />} /> */}
        {/* ... etc. ... */}
      </Routes>
    </Container>
  );
}

export default App;