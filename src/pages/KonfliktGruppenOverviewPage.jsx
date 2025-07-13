// src/pages/KonfliktGruppenOverviewPage.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Table, Spinner, Alert, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Helfer für Status-Farben
const getGruppeStatusBadgeVariant = (status) => {
    switch (status) {
        case 'offen': return 'warning';
        case 'vollstaendig_geloest': return 'success';
        default: return 'info'; // Alle "in_bearbeitung..."
    }
};

const verkehrsartColorMap = {
  SPFV: 'danger',   // rot
  SPNV: 'success',  // grün
  SGV: 'primary',   // blau
  ALLE: 'dark'      // dunkelgrau
};

function KonfliktGruppenOverviewPage() {
    const [gruppen, setGruppen] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/konflikte/gruppen');
            setGruppen(response.data.data);
            setError(null);
        } catch (err) {
            setError("Fehler beim Laden der Konfliktgruppen.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Funktion zum Zurücksetzen einer Gruppe
    const handleResetGruppe = async (gruppenId) => {
        if (!window.confirm(`Möchtest du die Konfliktgruppe ${gruppenId} wirklich zurücksetzen? Alle zugehörigen Konfliktdokumente werden gelöscht und die Anfragen zurückgesetzt.`)) {
            return;
        }
        setFeedback(`Setze Gruppe ${gruppenId} zurück...`);
        try {
            const response = await apiClient.post(`/konflikte/gruppen/${gruppenId}/reset`);
            setFeedback(response.data.message);
            fetchData(); // Lade die Liste neu, um die gelöschte Gruppe zu entfernen
        } catch (err) {
            setFeedback('Fehler beim Zurücksetzen der Gruppe.');
            console.error(err);
        }
    };
    
    // Helfer, um die gemeinsame Verkehrsart der Gruppe zu bestimmen
    const getGruppeVerkehrsart = (gruppe) => {
        if (!gruppe.beteiligteAnfragen || gruppe.beteiligteAnfragen.length === 0) return 'N/A';
        const uniqueVerkehrsarten = new Set(gruppe.beteiligteAnfragen.map(a => a.Verkehrsart));
        if (uniqueVerkehrsarten.size === 1) {
            return Array.from(uniqueVerkehrsarten)[0];
        }
        return 'ALLE'; // Oder 'ALLE', je nach Präferenz
    };


    if (loading) { return <div className="text-center mt-5"><Spinner animation="border" /></div>; }
    if (error) { return <Alert variant="danger">{error}</Alert>; }

    return (
        <div>
            <div>
                <Link to="/" className="btn btn-secondary mb-4 me-1">
                    <i className="bi bi-arrow-left me-2"></i>Zurück zur Startseite
                </Link>
                <Link to="/konflikte/bearbeiten" className="btn btn-secondary mb-4 me-1">
                    <i className="bi bi-arrow-left me-2"></i>Zurück zur Konflikt-Koordination
                </Link>
            </div>
            <h1 className="mb-4"><i className="bi bi-kanban me-3"></i>Übersicht der Konfliktgruppen</h1>
            {feedback && <Alert variant="info" onClose={() => setFeedback('')} dismissible>{feedback}</Alert>}
            
            <Table striped bordered hover responsive size="sm" className="shadow-sm">
                <thead className="table-dark">
                    <tr>
                        <th>Typ</th>
                        <th>ID</th>
                        <th>Verkehrsart</th>                        
                        <th>Anzahl Anfragen im Konflikt</th>                        
                        <th>Anzahl Konflikte (Töpfe oder Slots)</th>
                        <th>Status der Gruppe</th>                        
                        <th>Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    {gruppen.length === 0 ? (
                         <tr><td colSpan="6" className="text-center p-4">Keine aktiven Konfliktgruppen gefunden.</td></tr>
                    ) : (
                        gruppen.map(gruppe => {
                        // Ermittle die Details des ersten Konflikts in der Gruppe als Repräsentant
                        const repraesentativerKonflikt = gruppe.konflikteInGruppe?.[0];
                        const konfliktTyp = repraesentativerKonflikt?.konfliktTyp;                        
                        

                        return (
                            <tr key={gruppe._id}>
                                <td>
                                    <Badge bg={konfliktTyp === 'KAPAZITAETSTOPF' ? 'secondary' : 'primary'}>
                                        {konfliktTyp}
                                    </Badge>
                                </td>
                                <td>
                                    <code>{gruppe._id || 'NA'}</code>
                                </td>
                                <td><Badge bg={verkehrsartColorMap[getGruppeVerkehrsart(gruppe)] || 'secondary'}>{getGruppeVerkehrsart(gruppe)}</Badge></td>
                                <td>{gruppe.beteiligteAnfragen.length}</td>
                                <td>{gruppe.konflikteInGruppe.length}</td>
                                <td>
                                    <Badge bg={getGruppeStatusBadgeVariant(gruppe.status)} pill>
                                        {gruppe.status}
                                    </Badge>
                                </td>
                                <td>
                                    <Link to={`/konflikte/gruppen/${gruppe._id}/bearbeiten`}>
                                        <Button variant="primary" size="sm" title="Gruppe bearbeiten">
                                            <i className="bi bi-tools"></i>
                                        </Button>
                                    </Link>
                                    <Button 
                                        variant="outline-danger" 
                                        size="sm" 
                                        title="Konfliktgruppe zurücksetzen"
                                        onClick={() => handleResetGruppe(gruppe._id)}
                                        className="ms-2"
                                    >
                                        <i className="bi bi-arrow-counterclockwise"></i>
                                    </Button>
                                </td>
                            </tr>
                        );
                    })
                    )                    
                    }                    
                </tbody>
            </Table>
        </div>
    );
}

export default KonfliktGruppenOverviewPage;