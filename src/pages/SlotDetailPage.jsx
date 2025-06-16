import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // useParams, um die ID aus der URL zu lesen
import apiClient from '../api/apiClient';
import { Container, Card, Row, Col, Spinner, Alert, Badge, ListGroup } from 'react-bootstrap';

// Helferkomponente für die Detailanzeige
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

// HELFERFUNKTION für den Anfrage-Status
    const getAnfrageStatusBadgeVariant = (status) => {
        if (!status) return 'secondary'; // Fallback
        if (status.startsWith('bestaetigt')) return 'success'; // alle "bestätigt_..." -> grün
        if (status.startsWith('abgelehnt')) return 'danger';  // alle "abgelehnt_..." -> rot
        if (status.startsWith('wartet')) return 'warning'; // alle "wartet_..." -> gelb
        if (status.startsWith('in_konflikt')) return 'info';    // alle "in_konflikt..." -> hellblau
        if (status.startsWith('storniert')) return 'secondary'; // alle "storniert_..." -> grau
        
        switch(status) {
            case 'validiert':
                return 'primary';
            case 'ungueltig':
                return 'light';
            default:
                return 'secondary';
        }
    };

function SlotDetailPage() {
    const { slotId } = useParams(); // Holt den :slotId-Teil aus der URL
    const [slot, setSlot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSlot = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get(`/slots/${slotId}`);
                setSlot(response.data.data);
                setError(null);
            } catch (err) {
                console.error("Fehler beim Laden des Slot-Details:", err);
                setError("Slot konnte nicht geladen werden.");
            } finally {
                setLoading(false);
            }
        };

        fetchSlot();
    }, [slotId]); // Effekt neu ausführen, wenn sich die slotId in der URL ändert

    const getBelegungsstatus = () => {
        if (!slot || !slot.zugewieseneAnfragen) return { text: 'Unbekannt', color: 'secondary' };
        const anzahl = slot.zugewieseneAnfragen.length;
        if (anzahl === 0) return { text: 'Frei', color: 'success' };
        if (anzahl === 1) return { text: 'Einfach belegt', color: 'secondary' };
        return { text: 'Mehrfach belegt (Konflikt)', color: 'danger' };
    };

    if (loading) { return <div className="text-center mt-5"><Spinner animation="border" /></div>; }
    if (error) { return <Alert variant="danger">{error}</Alert>; }
    if (!slot) { return <Alert variant="warning">Kein Slot mit dieser ID gefunden.</Alert>; }
    
    const belegung = getBelegungsstatus();

    return (
        <Container>
            <Link to="/slots" className="btn btn-secondary mb-4">
                <i className="bi bi-arrow-left me-2"></i>Zurück zur Übersicht Slots
            </Link>
            <Card className="shadow-sm">
                <Card.Header as="h3">
                    Details für Slot: <code>{slot.SlotID_Sprechend}</code>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <ListGroup variant="flush">
                                <DetailRow label="Linie" value={slot.Linienbezeichnung || '-'} />
                                <DetailRow label="Abschnitt" value={slot.Abschnitt} />
                                <DetailRow label="Von" value={slot.von} />
                                <DetailRow label="Bis" value={slot.bis} />
                                <DetailRow label="Abfahrt" value={`${String(slot.Abfahrt.stunde).padStart(2, '0')}:${String(slot.Abfahrt.minute).padStart(2, '0')}`} />
                                <DetailRow label="Ankunft" value={`${String(slot.Ankunft.stunde).padStart(2, '0')}:${String(slot.Ankunft.minute).padStart(2, '0')}`} />
                            </ListGroup>
                        </Col>
                        <Col md={6}>
                            <ListGroup variant="flush">
                                <DetailRow label="Verkehrsart" value={<Badge bg={verkehrsartColorMap[slot.Verkehrsart] || 'secondary'}>{slot.Verkehrsart}</Badge>} />
                                <DetailRow label="Verkehrstag" value={slot.Verkehrstag} />
                                <DetailRow label="Relative KW" value={slot.Kalenderwoche} />
                                <DetailRow label="Grundentgelt" value={`${slot.Grundentgelt.toFixed(2)} €`} /> 
                                <DetailRow label="Belegungsstatus Slot" value={<Badge bg={belegung.color}>{belegung.text}</Badge>} />                                                              
                            </ListGroup>
                        </Col>
                    </Row>
                    <hr />
                    <h4 className="mt-4">Zugeordneter Kapazitätstopf </h4>
                    <ListGroup>
                        <DetailRow label="Topf-ID" value={<code>{slot.VerweisAufTopf ? slot.VerweisAufTopf.TopfID : '-'}</code> } />
                        <DetailRow label="Kapazität des Topfs" value={slot.VerweisAufTopf.maxKapazitaet} /> 
                    </ListGroup>
                    <hr />
                    <h4 className="mt-4">Zugeordnete Anfragen ({slot.zugewieseneAnfragen.length})</h4>
                    {slot.zugewieseneAnfragen.length > 0 ? (
                        <ListGroup>
                            {slot.zugewieseneAnfragen.map(anfrage => (
                                <ListGroup.Item 
                                    key={anfrage._id} 
                                    className="d-flex justify-content-between align-items-center"
                                >
                                    <code>{anfrage.AnfrageID_Sprechend || anfrage._id}</code>
                                    
                                    <Badge 
                                        bg={getAnfrageStatusBadgeVariant(anfrage.Status)}                                        
                                    >
                                        {anfrage.Status}
                                    </Badge>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    ) : (
                        <p>Diesem Slot sind aktuell keine Anfragen zugeordnet.</p>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}

export default SlotDetailPage;