// src/pages/KapazitaetstopfDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Container, Card, Row, Col, Spinner, Alert, Badge, ListGroup, Table } from 'react-bootstrap';

// Helferfunktion für die Detailanzeige
const DetailRow = ({ label, value }) => (
    <ListGroup.Item className="d-flex justify-content-between align-items-start">
        <div className="ms-2 me-auto">
            <div className="fw-bold">{label}</div>
            <div className="text-muted">{value}</div>
        </div>
    </ListGroup.Item>
);

// Helferfunktion für die Anfrage-Status-Farben (könnte in eine Util-Datei ausgelagert werden)
const getAnfrageStatusBadgeVariant = (status) => {
    if (!status) return 'secondary';
    if (status.startsWith('bestaetigt')) return 'success';
    if (status.startsWith('abgelehnt')) return 'danger';
    if (status.startsWith('wartet')) return 'warning';
    if (status.startsWith('in_konflikt')) return 'info';
    return 'secondary';
};


const verkehrsartColorMap = {
  SPFV: 'danger',   // rot
  SPNV: 'success',  // grün
  SGV: 'primary',   // blau
  ALLE: 'dark'      // dunkelgrau
};

function KapazitaetstopfDetailPage() {
    const { topfId } = useParams();
    const [topf, setTopf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTopf = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get(`/kapazitaetstoepfe/${topfId}`);
                setTopf(response.data.data);
                setError(null);
            } catch (err) {
                console.error("Fehler beim Laden des Topf-Details:", err);
                setError("Kapazitätstopf konnte nicht geladen werden.");
            } finally {
                setLoading(false);
            }
        };
        fetchTopf();
    }, [topfId]);

    const getSlotBelegung = (slot) => {
        if (!slot || !slot.zugewieseneAnfragen) return { text: 'Unbekannt', color: 'secondary' };
        const anzahl = slot.zugewieseneAnfragen.length;
        if (anzahl === 0) return { text: 'Frei', color: 'success' };
        if (anzahl === 1) return { text: 'Einfach belegt', color: 'primary' };
        return { text: 'Mehrfach belegt', color: 'danger' };
    };

    if (loading) { return <div className="text-center mt-5"><Spinner animation="border" /></div>; }
    if (error) { return <Alert variant="danger">{error}</Alert>; }
    if (!topf) { return <Alert variant="warning">Kein Kapazitätstopf mit dieser ID gefunden.</Alert>; }

    return (
        <Container>
            <Link to="/kapazitaetstoepfe" className="btn btn-secondary mb-4">
                <i className="bi bi-arrow-left me-2"></i>Zurück zur Übersicht Kapazitätstöpfe
            </Link>
            <Card className="shadow-sm">
                <Card.Header as="h3">
                    Details für Kapazitätstopf: <code>{topf.TopfID}</code>
                </Card.Header>
                <Card.Body>
                    <Row className="mb-4">
                        <Col md={6}>
                            <ListGroup variant="flush">
                                <DetailRow label="Abschnitt" value={topf.Abschnitt} />
                                <DetailRow label="Verkehrsart" value={<Badge bg={verkehrsartColorMap[topf.Verkehrsart] || 'secondary'}>{topf.Verkehrsart}</Badge>} />
                                <DetailRow label="Verkehrstag" value={topf.Verkehrstag} />
                                <DetailRow label="Relative KW" value={topf.Kalenderwoche} />
                            </ListGroup>
                        </Col>
                        <Col md={6}>
                             <ListGroup variant="flush">
                                <DetailRow label="Zeitfenster" value={topf.Zeitfenster} />
                                <DetailRow label="Maximale Kapazität" value={topf.maxKapazitaet} />
                                <DetailRow label="Vorgänger-Topf" value={<code>{topf.TopfIDVorgänger ? topf.TopfIDVorgänger.TopfID : '-'}</code>} />
                                <DetailRow label="Nachfolger-Topf" value={<code>{topf.TopfIDNachfolger ? topf.TopfIDNachfolger.TopfID : '-'}</code>} />
                            </ListGroup>
                        </Col>
                    </Row>
                    
                    <hr />
                    <h4 className="mt-4">Zugeordnete Slots ({topf.ListeDerSlots.length})</h4>
                    <Table striped hover size="sm" className="mt-3">
                        <thead><tr><th>Slot ID</th><th>Linie</th><th>Abschnitt</th><th>Belegung Slot</th></tr></thead>
                        <tbody>
                            {topf.ListeDerSlots.map(slot => {
                                const belegung = getSlotBelegung(slot);
                                return (
                                    <tr key={slot._id}>
                                        <td><code>{slot.SlotID_Sprechend}</code></td>
                                        <td>{slot.Linienbezeichnung || '-'}</td>
                                        <td>{slot.Abschnitt}</td>
                                        <td><Badge bg={belegung.color}>{belegung.text}</Badge></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>

                    <hr />
                    <h4 className="mt-4">Zugeordnete Anfragen ({topf.ListeDerAnfragen.length})</h4>
                    <ListGroup className="mt-3">
                        {topf.ListeDerAnfragen.map(anfrage => (
                            <ListGroup.Item key={anfrage._id} className="d-flex justify-content-between align-items-center">
                                <code>{anfrage.AnfrageID_Sprechend}</code>
                                <Badge bg={getAnfrageStatusBadgeVariant(anfrage.Status)} pill>
                                    {anfrage.Status}
                                </Badge>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default KapazitaetstopfDetailPage;