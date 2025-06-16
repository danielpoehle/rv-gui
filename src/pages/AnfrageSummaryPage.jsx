// src/pages/AnfrageSummaryPage.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Das Farb-Mapping für die Verkehrsart-Badges
const verkehrsartColorMap = {
  SPFV: 'danger', SPNV: 'success', SGV: 'primary'
};

function AnfrageSummaryPage() {
    const [summaryData, setSummaryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get('/anfragen/summary');
                setSummaryData(response.data.data);
                setError(null);
            } catch (err) {
                setError("Fehler beim Laden der Zusammenfassung.");
                console.error(err);
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
                 <h1 className="mb-0"><i className="bi bi-graph-up-arrow me-3"></i>Zusammenfassung der Anfragen</h1>
                 <Link to="/anfragen" className="btn btn-secondary">
                    <i className="bi bi-arrow-left me-2"></i>Zur Listenansicht
                </Link>
            </div>
            
            <Table striped bordered hover responsive className="shadow-sm">
                <thead className="table-dark">
                    <tr>
                        <th>Verkehrsart</th>
                        <th>EVU</th>
                        <th>Gesamt</th>
                        <th>Valide</th>
                        <th>In Konfliktlösung</th>
                        <th>Bestätigt</th>
                        <th>Abgelehnt</th>
                    </tr>
                </thead>
                <tbody>
                    {summaryData.length === 0 ? (
                         <tr>
                            <td colSpan="7" className="text-center p-4">Keine Daten für eine Zusammenfassung vorhanden.</td>
                        </tr>
                    ) : (
                        summaryData.map((item, index) => (
                            <tr key={`${item.evu}-${item.verkehrsart}-${index}`}>
                                <td>
                                    <Badge bg={verkehrsartColorMap[item.verkehrsart] || 'secondary'}>
                                        {item.verkehrsart}
                                    </Badge>
                                </td>
                                <td className="fw-bold">{item.evu}</td>
                                <td>{item.totalAnfragen}</td>
                                <td>{item.statusCounts.validiert || 0}</td>
                                <td className={item.statusCounts.inKonflikt > 0 ? 'text-warning' : ''}>
                                    {item.statusCounts.inKonflikt || 0}
                                </td>
                                <td className="text-success">{item.statusCounts.bestaetigt || 0}</td>
                                <td className={item.statusCounts.abgelehnt > 0 ? 'text-danger' : ''}>
                                    {item.statusCounts.abgelehnt || 0}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </Table>
        </div>
    );
}

export default AnfrageSummaryPage;