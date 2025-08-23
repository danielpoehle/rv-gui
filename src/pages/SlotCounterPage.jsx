// src/pages/SlotCounterPage.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Table, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Das Farb-Mapping für die Verkehrsart-Badges
const verkehrsartColorMap = {
  SPFV: 'danger', SPNV: 'success', SGV: 'primary'
};

function SlotCounterPage() {
    const [summaryData, setSummaryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [actionFeedback, setActionFeedback] = useState('');

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get('/slots/counter');
                setSummaryData(response.data.data);
            } catch (err) {
                setError("Fehler beim Laden der Zusammenfassung.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    const handleMigrationStarten = async () => {
        if (!window.confirm("Möchten Sie die Migration für alte Slot-Daten starten? Dies sollte normalerweise nur einmal ausgeführt werden.")) {
            return;
        }
        setActionInProgress(true);
        setActionFeedback('Starte Slot-Daten-Migration...');
        try {
            const response = await apiClient.post('/slots/migrate-to-discriminator');
            const summary = response.data.summary;
            setActionFeedback(`Migration abgeschlossen. ${summary.aktualisierteDokumente} von ${summary.gefundeneDokumente} Slots wurden aktualisiert.`);
        } catch (err) {
            setActionFeedback('Fehler bei der Migration.');
            console.error(err);
        } finally {
            setActionInProgress(false);
        }
    };

    const formatTime = (zeitObjekt) => {
        if (!zeitObjekt) return '-';
        return `${String(zeitObjekt.stunde).padStart(2, '0')}:${String(zeitObjekt.minute).padStart(2, '0')}`;
    };

    if (loading) { return <div className="text-center mt-5"><Spinner animation="border" /></div>; }
    if (error) { return <Alert variant="danger">{error}</Alert>; }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                 <h1 className="mb-0"><i className="bi bi-bar-chart-steps me-3"></i>Slot-Inventar je Abschnitt</h1>                 
                 <div>
                    <Link className="me-2">
                        <Button 
                        onClick={handleMigrationStarten}
                        variant="outline-success" 
                        title="Tages-Slots migrieren" 
                        disabled={actionInProgress}>
                            <i className="bi bi-patch-plus me-2"></i> Tages-Slots migrieren
                        </Button>
                    </Link>
                    <Link to="/slots" className="btn btn-secondary">
                        <i className="bi bi-arrow-left me-2"></i>Zurück zur Listenansicht
                    </Link>
                 </div>                
            </div>
            <div>{actionFeedback && <Alert variant="info">{actionFeedback}</Alert>}</div>
            
            {summaryData.length === 0 ? (
                <Alert variant="info">Keine Slot-Daten für eine Zusammenfassung vorhanden.</Alert>
            ) : (
                summaryData.map(gruppenDaten => (
                    <div key={gruppenDaten.abschnitt} className="mb-5">
                        <h2>Abschnitt: {gruppenDaten.abschnitt}</h2>
                        <Table striped bordered hover responsive size="sm" className="shadow-sm">
                            <thead className="table-dark">
                                <tr>
                                    <th>Slot-Muster (VA | Von-Bis | Zeit)</th>
                                    <th style={{ width: '10%' }}>Anzahl (Mo-Fr)</th>
                                    <th style={{ width: '30%' }}>Verfügbare KWs (Mo-Fr)</th>
                                    <th style={{ width: '10%' }}>Anzahl (Sa+So)</th>
                                    <th style={{ width: '30%' }}>Verfügbare KWs (Sa+So)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gruppenDaten.slotTypen.map((item, index) => {
                                    const istTagSlot = item.slotMuster.slotTyp === 'TAG';
                                    // Erzeuge die Query-Parameter für den Link
                                    // Baue die Basis-Parameter
                                    const baseParams = {
                                        von: item.slotMuster.von,
                                        bis: item.slotMuster.bis,
                                        abschnitt: item.slotMuster.abschnitt,
                                        verkehrsart: item.slotMuster.verkehrsart,
                                        slotTyp: item.slotMuster.slotTyp,
                                    };
                                    const queryParams = istTagSlot
                                        ? new URLSearchParams({
                                            ...baseParams,
                                            abfahrtStunde: item.slotMuster.abfahrt.stunde,
                                            abfahrtMinute: item.slotMuster.abfahrt.minute,
                                            ankunftStunde: item.slotMuster.ankunft.stunde,
                                            ankunftMinute: item.slotMuster.ankunft.minute,
                                        }).toString()
                                        : new URLSearchParams({
                                            ...baseParams,
                                            zeitfenster: item.slotMuster.zeitfenster
                                            // Mindest-/Maximalfahrzeit sind hier nicht Teil des Musters
                                        }).toString();
                                    
                                    return(
                                        <tr key={index}>
                                            <td>                                                
                                                <Badge bg={verkehrsartColorMap[item.slotMuster.verkehrsart] || 'secondary'} className="ms-1">
                                                    {item.slotMuster.verkehrsart}
                                                </Badge>
                                                <br />
                                                <br />
                                                <i className={( !istTagSlot && 'bi bi-moon-stars-fill me-2') || 'bi bi-sun-fill me-2'}></i>
                                                {item.slotMuster.slotTyp} 
                                                <br />
                                                <br />
                                                <strong>{item.slotMuster.linie}</strong>
                                                <br />
                                                <strong>{item.slotMuster.von} <i className="bi bi-arrow-right-short"></i> {item.slotMuster.bis}</strong>
                                                <br />
                                                {
                                                    istTagSlot && (
                                                        <small className="text-muted">
                                                            {formatTime(item.slotMuster.abfahrt)} - {formatTime(item.slotMuster.ankunft)}
                                                        </small>
                                                    )
                                                }  
                                                {
                                                    !istTagSlot && (
                                                        <small className="text-muted">
                                                            Zeitfenster {item.slotMuster.zeitfenster}
                                                        </small>
                                                    )
                                                }                                               
                                                <br />
                                                <br />
                                                <Link to={`/slots/loeschen?${queryParams}`}>
                                                    <Button variant="outline-danger" size="sm" title="Slot-Serie löschen">
                                                        <i className="bi bi-trash"></i>
                                                    </Button>
                                                </Link>
                                            </td>
                                            <td>{item.anzahlMoFr}</td>
                                            <td className="text-break">{item.kwsMoFr.sort((a,b) => a-b).join(', ')}</td>
                                            <td>{item.anzahlSaSo}</td>
                                            <td className="text-break">{item.kwsSaSo.sort((a,b) => a-b).join(', ')}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                ))
            )}
        </div>
    );
}

export default SlotCounterPage;