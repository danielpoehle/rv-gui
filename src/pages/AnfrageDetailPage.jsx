import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Container, Card, Row, Col, Spinner, Alert, Badge, ListGroup, Table, Button } from 'react-bootstrap';
import { format } from 'date-fns';
import { parseISO } from 'date-fns/fp';

// Helfer für Detail-Zeilen
const DetailRow = ({ label, value }) => (
    <ListGroup.Item className="d-flex justify-content-between align-items-start">
        <div className="ms-2 me-auto">
            <div className="fw-bold">{label}</div>
            <div className="text-muted">{value}</div>
        </div>
    </ListGroup.Item>
);

// Helfer für Status-Farben (kann in eine Util-Datei)
const getAnfrageEinzelStatusBadgeVariant = (status) => {
    if (!status) return 'secondary';
    if (status.startsWith('bestaetigt')) return 'success';
    if (status.startsWith('abgelehnt')) return 'danger';
    if (status.startsWith('wartet')) return 'warning';
    return 'info';
};

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

function AnfrageDetailPage() {
    const { anfrageId } = useParams();
    const [anfrage, setAnfrage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Hook für die Weiterleitung

    useEffect(() => {
        const fetchAnfrage = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get(`/anfragen/${anfrageId}`);
                setAnfrage(response.data.data);
                setError(null);
            } catch (err) {
                console.error("Fehler beim Laden des Anfrage-Details:", err);
                setError("Anfrage konnte nicht geladen werden.");
            } finally {
                setLoading(false);
            }
        };
        fetchAnfrage();
    }, [anfrageId]);

    const handleReset = async () => {
        if (!window.confirm("Möchten Sie die Slot-Zuweisung für diese Anfrage wirklich zurücksetzen? Alle Zuweisungen gehen dabei verloren und das Entgelt wird auf 0 gesetzt. Dies ist nur möglich, wenn die Anfrage in keinem Konflikt beteiligt ist.")) {
            return;
        }

        try {
            await apiClient.post(`/anfragen/${anfrageId}/reset-zuordnung`);
            // Nach Erfolg zur Übersichtsseite navigieren
            navigate('/anfragen');
        } catch (err) {
            // Zeige einen Fehler an (z.B. mit einem Alert-State)
            console.error("Fehler beim Reset:", err);
            alert(err.response?.data?.message || "Ein Fehler ist aufgetreten.");
        }
    };


    if (loading) { return <div className="text-center mt-5"><Spinner animation="border" /></div>; }
    if (error) { return <Alert variant="danger">{error}</Alert>; }
    if (!anfrage) { return <Alert variant="warning">Keine Anfrage mit dieser ID gefunden.</Alert>; }
    
    return (
        <Container>
            <div className="d-flex justify-content-between align-items-center mb-1">
                <Link to="/anfragen" className="btn btn-secondary mb-4">
                    <i className="bi bi-arrow-left me-2"></i>Zurück zur Übersicht Anfragen
                </Link>                              
            </div>  
            <div className="mb-2">
                {anfrage  && (
                <Button variant="outline-danger" onClick={handleReset}>
                    <i className="bi bi-arrow-counterclockwise me-2"></i>Anfrage auf Status validiert zurücksetzen
                </Button>
                )}
            </div>            
            <Card className="shadow-sm">
                <Card.Header as="h3">
                    Details für Anfrage: <code>{anfrage.AnfrageID_Sprechend}</code>
                </Card.Header>
                <Card.Body>
                    <Row className="mb-4">
                        <Col md={6}>
                            <ListGroup variant="flush">
                                <DetailRow label="EVU" value={anfrage.EVU} />
                                <DetailRow label="Zugnummer" value={anfrage.Zugnummer} />
                                <DetailRow label="Verkehrsart" value={<Badge bg={verkehrsartColorMap[anfrage.Verkehrsart] || 'secondary'}>{anfrage.Verkehrsart}</Badge>} />
                                <DetailRow label="Verkehrstag" value={anfrage.Verkehrstag} />
                            </ListGroup>
                        </Col>
                        <Col md={6}>
                             <ListGroup variant="flush">
                                <DetailRow label="Zeitraum" value={`${format(parseISO(anfrage.Zeitraum.start), 'dd.MM.yyyy')} - ${format(parseISO(anfrage.Zeitraum.ende), 'dd.MM.yyyy')}`} />
                                <DetailRow label="Entgelt" value={`${(anfrage.Entgelt || 0).toFixed(2)} €`} />
                                <DetailRow label="Gesamtstatus" value={<Badge bg={getAnfrageStatusBadgeVariant(anfrage.Status)} pill>{anfrage.Status}</Badge>} />
                                <DetailRow label="Kontakt" value={anfrage.Email} />
                            </ListGroup>
                        </Col>
                    </Row>
                    
                    <hr />
                    <h4 className="mt-4">Gewünschte Wegabschnitte</h4>
                    <Table striped hover size="sm" className="mt-3">
                        <thead><tr><th>#</th><th>ID</th><th>Von</th><th>Bis</th><th>Abfahrt</th><th>Ankunft</th></tr></thead>
                        <tbody>
                            {anfrage.ListeGewuenschterSlotAbschnitte.map((abschnitt, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{anfrage.Verkehrsart}-{abschnitt.von}-{abschnitt.bis}-{`${String(abschnitt.Abfahrtszeit.stunde).padStart(2, '0')}${String(abschnitt.Abfahrtszeit.minute).padStart(2, '0')}`}</td>
                                    <td>{abschnitt.von}</td>
                                    <td>{abschnitt.bis}</td>
                                    <td>{`${String(abschnitt.Abfahrtszeit.stunde).padStart(2, '0')}:${String(abschnitt.Abfahrtszeit.minute).padStart(2, '0')}`}</td>
                                    <td>{`${String(abschnitt.Ankunftszeit.stunde).padStart(2, '0')}:${String(abschnitt.Ankunftszeit.minute).padStart(2, '0')}`}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    
                    <hr />
                    <h4 className="mt-4">Zugeordnete Slots ({anfrage.ZugewieseneSlots.length})</h4>
                    <Table striped hover size="sm" className="mt-3">
                        <thead className="table-dark">
                            <tr>
                                <th>Slot ID</th>
                                <th>Status Zuweisung</th>
                                <th>Kapazitätstopf</th>
                                <th>Auslastung Topf</th>
                            </tr>
                        </thead>
                        <tbody>
                            {anfrage.ZugewieseneSlots.map((zuweisung, index) => {
                                const topf = zuweisung.slot?.VerweisAufTopf;
                                const isOverbooked = topf ? topf.ListeDerAnfragen.length > topf.maxKapazitaet : false;
                                return (
                                    <tr key={zuweisung.slot?._id || index}>
                                        <td><code>{zuweisung.slot?.SlotID_Sprechend || 'Slot-Daten nicht geladen'}</code></td>
                                        <td>
                                            <Badge bg={getAnfrageEinzelStatusBadgeVariant(zuweisung.statusEinzelzuweisung)}>
                                                {zuweisung.statusEinzelzuweisung}
                                            </Badge>
                                        </td>
                                        <td><code>{topf?.TopfID || '-'}</code></td>
                                        <td className={isOverbooked ? 'text-danger fw-bold' : ''}>
                                            {topf ? `${topf.ListeDerAnfragen.length} / ${topf.maxKapazitaet}` : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>

                </Card.Body>
            </Card>
        </Container>
    );
}

export default AnfrageDetailPage;