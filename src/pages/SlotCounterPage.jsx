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
                 <Link to="/slots" className="btn btn-secondary">
                    <i className="bi bi-arrow-left me-2"></i>Zurück zur Listenansicht
                </Link>
            </div>
            
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
                                    // Erzeuge die Query-Parameter für den Link
                                    const queryParams = new URLSearchParams({
                                        von: item.slotMuster.von,
                                        bis: item.slotMuster.bis,
                                        Abschnitt: item.slotMuster.abschnitt,
                                        abfahrtStunde: item.slotMuster.abfahrt.stunde,
                                        abfahrtMinute: item.slotMuster.abfahrt.minute,
                                        ankunftStunde: item.slotMuster.ankunft.stunde,
                                        ankunftMinute: item.slotMuster.ankunft.minute,
                                        Verkehrsart: item.slotMuster.verkehrsart,
                                    }).toString();
                                    return(
                                        <tr key={index}>
                                            <td>
                                                <strong>{item.slotMuster.linie}</strong>
                                                <br />
                                                <Badge bg={verkehrsartColorMap[item.slotMuster.verkehrsart] || 'secondary'} className="ms-2">
                                                    {item.slotMuster.verkehrsart}
                                                </Badge>
                                                <br />
                                                <br />
                                                <strong>{item.slotMuster.von} <i className="bi bi-arrow-right-short"></i> {item.slotMuster.bis}</strong>
                                                <br />
                                                <small className="text-muted">
                                                    {formatTime(item.slotMuster.abfahrt)} - {formatTime(item.slotMuster.ankunft)}
                                                </small>
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