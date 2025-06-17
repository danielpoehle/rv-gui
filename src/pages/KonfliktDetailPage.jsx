import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Container, Card, Row, Col, Spinner, Alert, Badge, ListGroup, Table } from 'react-bootstrap';



const DetailRow = ({ label, value }) => (
    <ListGroup.Item className="d-flex justify-content-between align-items-start">
        <div className="ms-2 me-auto">
            <div className="fw-bold">{label}</div>
            {value}
        </div>
    </ListGroup.Item>
);

const verkehrsartColorMap = {
  SPFV: 'danger',   // rot
  SPNV: 'success',  // grün
  SGV: 'primary',   // blau
  ALLE: 'dark'      // dunkelgrau
};
// Helfer für Status-Farben
const getAnfrageStatusBadgeVariant = (status) => {
    if (!status) return 'secondary';
    if (status.startsWith('bestaetigt')) return 'success';
    if (status.startsWith('abgelehnt')) return 'danger';
    if (status.startsWith('wartet')) return 'warning';
    return 'info';
};

const getKonfliktStatusBadgeVariant = (status) => {
    switch (status) {
        case 'offen': return 'warning';
        case 'in_bearbeitung_entgelt':
        case 'in_bearbeitung_hoechstpreis':
            return 'info';
        case 'geloest': return 'success';
        case 'eskaliert': return 'danger';
        default: return 'secondary';
    }
};

function KonfliktDetailPage() {
    const { konfliktId } = useParams();
    const [konfliktData, setKonfliktData] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchKonfliktDetails = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get(`/konflikte/${konfliktId}`);
                setKonfliktData(response.data.data);
                setError(null);
            } catch (err) {
                setError("Konfliktdetails konnten nicht geladen werden.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchKonfliktDetails();
    }, [konfliktId]);

    const getSlotBelegungBadge = (slot) => {
        const anzahl = slot.zugewieseneAnfragen?.length || 0;
        if (anzahl === 0) return <Badge bg="success">Frei</Badge>;
        if (anzahl === 1) return <Badge bg="primary">Einfach belegt</Badge>;
        return <Badge bg="danger">Mehrfach belegt</Badge>;
    };

    if (loading) { return <div className="text-center mt-5"><Spinner animation="border" /></div>; }
    if (error) { return <Alert variant="danger">{error}</Alert>; }
    if (!konfliktData) { return <Alert variant="warning">Keine Konfliktdaten gefunden.</Alert>; }

    const { konflikt, gruppenId } = konfliktData;
    const slotsImKonfliktTopf = konflikt.ausloesenderKapazitaetstopf?.ListeDerSlots || [];


    return (
        <Container>
            <Link to="/konflikte" className="btn btn-secondary mb-4">
                <i className="bi bi-arrow-left me-2"></i>Zur Konflikt-Übersicht
            </Link>

            {/* --- HAUPTDETAILS DES KONFLIKTS --- */}
            <Card className="mb-4 shadow-sm">
                <Card.Header as="h3">Konflikt-Details</Card.Header>
                <Card.Body>
                     <ListGroup variant="flush">
                        <DetailRow label="Konflikt-ID" value={<code>{konflikt._id}</code>} />
                        <DetailRow label="Konflikt-Typ" value={<Badge bg="info">{konflikt.konfliktTyp}</Badge>} />
                        <DetailRow label="Status" value={<Badge bg={getKonfliktStatusBadgeVariant(konflikt.status)} pill>{konflikt.status}</Badge>} />
                        <DetailRow 
                            label={`Auslösender ${konflikt.konfliktTyp === 'KAPAZITAETSTOPF' ? 'Kapazitätstopf' : 'Slot'}`} 
                            value={<code>{konflikt.ausloesenderKapazitaetstopf?.TopfID || konflikt.ausloesenderSlot?.SlotID_Sprechend || 'N/A'}</code>}
                        />
                        <DetailRow label="Anfragen vs. maximale Kapazität" value={`${konflikt.beteiligteAnfragen.length} vs. ${konflikt.ausloesenderKapazitaetstopf.maxKapazitaet}`} />
                        <DetailRow label="Konflikt-Gruppe" value={
                            gruppenId ? (
                                    <Link to={`/konflikte/gruppen/${gruppenId}/bearbeiten`}>
                                        <code>{gruppenId}</code>
                                    </Link>
                                ) : (
                                    '-'
                                )
                        } />
                     </ListGroup>
                </Card.Body>
            </Card>

            <Card className="mb-4 shadow-sm">
                <Card.Header as="h4">
                    <i className="bi bi-body-text me-2"></i>Verlauf & Notizen
                </Card.Header>
                <Card.Body>
                    {konflikt.notizen ? (
                        // Der <pre>-Tag stellt Text inkl. aller Leerzeichen und Zeilenumbrüche dar
                        <pre style={{ 
                            whiteSpace: 'pre-wrap',      // Sorgt für Zeilenumbrüche bei langen Zeilen
                            wordBreak: 'break-word',       // Bricht auch lange Wörter ohne Leerzeichen um
                            fontFamily: 'inherit',         // Verwendet die Standard-Schriftart der Seite statt einer Monospace-Schrift
                            fontSize: '0.9rem',            // Etwas kleinere Schrift für bessere Lesbarkeit
                            margin: 0                      // Entfernt den Standard-Außenabstand des <pre>-Tags
                        }}>
                            {konflikt.notizen}
                        </pre>
                    ) : (
                        <p className="text-muted mb-0">Keine Notizen für diesen Konflikt vorhanden.</p>
                    )}
                </Card.Body>
            </Card>

             {/* --- BETEILIGTE ANFRAGEN --- */}
            <Card className="mb-4 shadow-sm">
                <Card.Header as="h4">Beteiligte Anfragen ({konflikt.beteiligteAnfragen.length})</Card.Header>
                <ListGroup variant="flush">
                    {konflikt.beteiligteAnfragen.map(anfrage => (
                        <ListGroup.Item key={anfrage._id} className="d-flex justify-content-between align-items-center">
                            <Badge bg={verkehrsartColorMap[anfrage.Verkehrsart] || 'secondary'}>{anfrage.Verkehrsart}</Badge>
                            <code>{anfrage.AnfrageID_Sprechend}</code> {anfrage.EVU}, Entgelt {(anfrage.Entgelt || 0).toFixed(2)} €
                            <Badge bg={getAnfrageStatusBadgeVariant(anfrage.Status)} pill>
                                {anfrage.Status}
                            </Badge>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Card>
            
            {/* --- BETEILIGTE SLOTS --- */}
            <Card className="mb-4 shadow-sm">
                 <Card.Header as="h4">Slots im auslösenden Kapazitätstopf ({slotsImKonfliktTopf.length})</Card.Header>
                 <Table striped hover size="sm" className="mb-0">
                    <thead><tr><th>Slot ID</th><th>Linie</th><th>Abschnitt</th><th>Belegung</th></tr></thead>
                    <tbody>
                        {slotsImKonfliktTopf.map(slot => ( // Iteriere jetzt über die neue Variable
                            <tr key={slot._id}>
                                <td><code>{slot.SlotID_Sprechend}</code></td>
                                <td>{slot.Linienbezeichnung || '-'}</td>
                                <td>{slot.Abschnitt}</td>
                                <td>{getSlotBelegungBadge(slot)}</td>
                            </tr>
                        ))}
                    </tbody>
                 </Table>
            </Card>

            {/* Hier könnten weitere Cards für die Resolution-Details folgen, die nur bei Bedarf angezeigt werden */}

        </Container>
    );
}

export default KonfliktDetailPage;