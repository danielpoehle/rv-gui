// src/pages/SlotSummaryPage.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Das Farb-Mapping für die Verkehrsart-Badges
const verkehrsartColorMap = {
  SPFV: 'danger', SPNV: 'success', SGV: 'primary', ALLE: 'dark'
};

function SlotSummaryPage() {
    const [summaryData, setSummaryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get('/slots/summary');
                setSummaryData(response.data.data);
                setError(null);
            } catch (err) {
                console.error("Fehler beim Laden der Slot-Zusammenfassung:", err);
                setError("Fehler beim Laden der Slot-Zusammenfassung.");
                setSummaryData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) { return <div className="text-center mt-5"><Spinner animation="border" /></div>; }
    if (error) { return <Alert variant="danger">{error}</Alert>; }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                 <h1 className="mb-4"><i className="bi bi-graph-up me-3"></i>Zusammenfassung der Slots nach Linien</h1>
                 <Link to="/slots" className="btn btn-secondary">
                    <i className="bi bi-arrow-left me-2"></i>Zur Listenansicht
                </Link>
            </div>              
            
            {summaryData.length === 0 && !loading ? (
                <Alert variant="info">Keine Daten für eine Zusammenfassung vorhanden (bitte Slots mit Linienbezeichnung anlegen).</Alert>
            ) : (
                <Table striped bordered hover responsive className="shadow-sm">
                    <thead className="table-dark">
                        <tr>
                            <th>Linie</th>
                            <th>Abschnitt</th>
                            <th>Verkehrsart</th>
                            <th>Verkehrstag</th>
                            <th>Anzahl Slots</th>
                            <th>KW-Bereich</th>
                            <th>Wunsch von Anfragen (Frei / Einfach / Mehrfach)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaryData.map((item, index) => (
                            <tr key={index}>
                                <td className="fw-bold">{item.linie}</td>
                                <td>{item.abschnitt}</td>
                                <td>
                                    <Badge bg={verkehrsartColorMap[item.verkehrsart] || 'secondary'}>
                                        {item.verkehrsart}
                                    </Badge>
                                </td>
                                <td>{item.verkehrstag}</td>
                                <td>{item.anzahlSlots}</td>
                                <td>{item.minKW === item.maxKW ? item.minKW : `${item.minKW} - ${item.maxKW}`}</td>
                                <td>
                                    <Badge bg="secondary" className="me-1" title="Komplett frei">Frei: {item.belegung.frei}</Badge>
                                    <Badge bg="success" className="me-1" title="Einfach belegt">Einfach: {item.belegung.einfach}</Badge>
                                    <Badge bg="danger" title="Mehrfach belegt (Konflikt!)">
                                        Mehrfach: {item.belegung.mehrfach}
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
}

export default SlotSummaryPage;