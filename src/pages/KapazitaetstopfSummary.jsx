// src/pages/KapazitaetstopfSummaryPage.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const verkehrsartColorMap = {
  SPFV: 'danger',   // rot
  SPNV: 'success',  // grün
  SGV: 'primary',   // blau
  ALLE: 'dark'      // dunkelgrau
};

function KapazitaetstopfSummaryPage() {
    const [summaryData, setSummaryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            try {
                // Rufe den neuen Summary-Endpunkt auf
                const response = await apiClient.get('/kapazitaetstoepfe/summary');
                setSummaryData(response.data.data);
                setError(null);
            } catch (err) {
                console.error("Fehler beim Laden der Zusammenfassung:", err);
                setError("Fehler beim Laden der Zusammenfassung.");
                setSummaryData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []); // Läuft nur einmal beim Laden der Seite

    if (loading) {
        return <div className="text-center mt-5"><Spinner animation="border" style={{ width: '3rem', height: '3rem' }} /></div>;
    }
    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                 <h1 className="mb-4"><i className="bi bi-bar-chart-line-fill me-3"></i>Zusammenfassung der Kapazitätstöpfe</h1>
                 <Link to="/kapazitaetstoepfe" className="btn btn-secondary ms-4 mb-4">
                    <i className="bi bi-arrow-left me-2"></i>Zur Listenansicht
                </Link>
            </div>            
            
            {summaryData.length === 0 && !loading ? (
                <Alert variant="info">Keine Daten für eine Zusammenfassung vorhanden.</Alert>
            ) : (
                <Table striped bordered hover responsive className="shadow-sm">
                    <thead className="table-dark">
                        <tr>
                            <th>Abschnitt</th>                            
                            <th>Verkehrsart</th>
                            <th>Bereich rel. KW</th>
                            <th>Anzahl Töpfe</th>
                            <th>Töpfe ohne Konflikt</th>
                            <th>Töpfe mit Konflikt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaryData.map(item => (
                            <tr key={item.abschnitt}>
                                <td className="fw-bold">{item.abschnitt}</td>                                
                                <td>
                                    <Badge bg={verkehrsartColorMap[item.verkehrsart] || 'secondary'}>
                                        {item.verkehrsart}
                                    </Badge>
                                </td>
                                <td>{item.minKW} - {item.maxKW}</td>
                                <td>{item.anzahlToepfe}</td>
                                <td className="text-success">{item.ohneKonflikt}</td>
                                <td className={item.mitKonflikt > 0 ? 'text-danger fw-bold' : ''}>
                                    {item.mitKonflikt}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
}

export default KapazitaetstopfSummaryPage;