// src/pages/KonfliktCoordinationPage.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { Container, Row, Col, Card, Button, Spinner, Alert, ListGroup, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function KonfliktCoordinationPage() {
    const [anfrageSummary, setAnfrageSummary] = useState(null);
    const [konfliktGruppen, setKonfliktGruppen] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [actionFeedback, setActionFeedback] = useState('');
    const [slotConflicts, setSlotConflicts] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Lade beide Datenquellen parallel
            const [summaryRes, gruppenRes] = await Promise.all([
                apiClient.get('/anfragen/summary'),
                apiClient.get('/konflikte/gruppen')
            ]);
            setAnfrageSummary(summaryRes.data.data);
            console.log(summaryRes);
            setKonfliktGruppen(gruppenRes.data.data);
            setError(null);
        } catch (err) {
            console.error("Fehler beim Laden der Koordinationsdaten:", err);
            setError("Daten konnten nicht geladen werden.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleZuordnungStarten = async () => {
        setActionInProgress(true);
        setSlotConflicts(false);
        setActionFeedback('Starte Zuweisung für alle validierten Anfragen...');
        try {
            const response = await apiClient.post('/anfragen/zuordnen/alle-validierten');
            setActionFeedback(`Prozess abgeschlossen: ${response.data.summary.success} erfolgreich, ${response.data.summary.failed} fehlgeschlagen.`);
            fetchData(); // Lade die Daten neu, um die Änderungen zu sehen
        } catch (err) {
            console.error("Fehler bei Zuweisung für alle validierten Anfragen:", err);
            setActionFeedback('Ein Fehler ist bei der Massen-Zuweisung aufgetreten.');
        } finally {
            setActionInProgress(false);
        }
    };

    const handleKonfliktIdentifizierungStarten = async () => {
        setActionInProgress(true);
        setActionFeedback('Starte Konflikterkennung und Gruppensynchronisation...');
        try {
            const response = await apiClient.post('/konflikte/identifiziere-topf-konflikte');
            setActionFeedback(`Prozess abgeschlossen: ${response.data.neuErstellteKonflikte.length} neue Konflikte, ${response.data.aktualisierteUndGeoeffneteKonflikte.length} aktualisierte Konflikte.`);
            fetchData(); // Lade die Daten neu
        } catch (err) {
            console.error("Fehler bei Konflikterkennung und Gruppensynchronisation:", err);
            setActionFeedback('Ein Fehler ist bei der Konflikterkennung aufgetreten.');
        } finally {
            setActionInProgress(false);
        }
    };
    
    // Zähle die Anfragen in den initialen Status
    const anfragenInPipeline = anfrageSummary ? anfrageSummary.reduce((acc, curr) => {
        acc.eingegangen += curr.statusCounts.eingegangen || 0;
        acc.validiert += curr.statusCounts.validiert || 0;   
        acc.ungueltig += curr.statusCounts.ungueltig || 0;     
        acc.inPruefungTopf += curr.statusCounts.inPruefungTopf || 0;     
        acc.inKonflikt += curr.statusCounts.inKonflikt || 0;
        acc.inPruefungSlot += curr.statusCounts.inPruefungSlot || 0;
        acc.bestaetigt += curr.statusCounts.bestaetigt || 0;
        acc.abgelehnt += curr.statusCounts.abgelehnt || 0;
        acc.intzw += curr.statusCounts.teilzuweisung || 0;
        acc.storniert += curr.statusCounts.storniert || 0;
        acc.keinePlausi += curr.statusCounts.keinePlausi || 0;
        
        // Füge hier weitere Status hinzu, die du zählen möchtest
        return acc;
    }, { 
        eingegangen: 0,
        validiert: 0,  
        ungueltig: 0,  
        inPruefungTopf: 0,     
        inKonflikt: 0,
        inPruefungSlot: 0,
        bestaetigt: 0,
        abgelehnt: 0,
        intzw: 0,
        storniert: 0,
        keinePlausi: 0
    }) : { 
        eingegangen: 0, 
        validiert: 0,  
        ungueltig: 0,  
        inPruefungTopf: 0,     
        inKonflikt: 0,
        inPruefungSlot: 0,
        bestaetigt: 0,
        abgelehnt: 0,
        intzw: 0,
        storniert: 0,
        keinePlausi: 0
     };


    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <Container>
            <div>
                <Link to="/" className="btn btn-secondary mb-4">
                    <i className="bi bi-arrow-left me-2"></i>Zurück zur Startseite
                </Link>
            </div>
            <h1 className="mb-4"><i className="bi bi-tools me-3"></i>Konflikt-Koordination</h1>
            {actionFeedback && <Alert variant="info">{actionFeedback}</Alert>}

            <Row>
                {/* ------ Bereich 1: Anfragen-Pipeline ------ */}
                <Col md={12} lg={6} className="mb-4">
                    <Card className="h-100 shadow-sm">
                        <Card.Body>
                            <Card.Title as="h3">Phase 1: Anfragen plausibilisieren + zuordnen</Card.Title>
                            <Card.Text>
                                Übersicht über Anfragen, die noch dem initialen Zuordnungsprozess unterzogen werden müssen.
                            </Card.Text>
                            <ListGroup variant="flush" className="mb-3">
                                <ListGroup.Item variant={anfragenInPipeline.eingegangen > 0 ? 'warning' : ''}>
                                    Anfragen mit Status 'eingegangen': <>{anfragenInPipeline.eingegangen}</>
                                    </ListGroup.Item>
                                {/* bedingte 'variant'-Eigenschaft wenn unplausible Bestellung vorhanden */}
                                <ListGroup.Item variant={anfragenInPipeline.ungueltig > 0 ? 'warning' : ''}>
                                    Anfragen mit Status 'ungültig': <strong>{anfragenInPipeline.ungueltig}</strong>
                                </ListGroup.Item>
                                <ListGroup.Item variant={anfragenInPipeline.validiert > 0 ? 'warning' : ''}>
                                    Anfragen mit Status 'plausibilisiert': <strong>{anfragenInPipeline.validiert}</strong>
                                    </ListGroup.Item>
                                    <ListGroup.Item>Anfragen mit Status 'storniert': <>{anfragenInPipeline.storniert}</></ListGroup.Item>
                                    <ListGroup.Item>Anfragen mit Status 'keine Plausibilisierung': <>{anfragenInPipeline.keinePlausi}</></ListGroup.Item>
                                    <ListGroup.Item>Anfragen mit Status 'in Prüfung Topf': <>{anfragenInPipeline.inPruefungTopf}</></ListGroup.Item>                                                                    
                                {/* Hier könnten weitere Status-Zählungen hin */}
                            </ListGroup>
                            <Button 
                                //as={Link} 
                                to="/anfragen/" // Der Zielpfad
                                variant="secondary"
                                className="w-100"
                                disabled={anfragenInPipeline.ungueltig === 0}                            >
                                <i class="bi bi-question-octagon-fill me-3"></i>
                                Anfragen plausibilisieren
                            </Button>
                            <Button 
                                onClick={handleZuordnungStarten} 
                                disabled={actionInProgress || anfragenInPipeline.validiert === 0}
                                variant="primary"
                                className="w-100"
                            >
                                <i class="bi bi-shuffle me-3"></i>
                                {actionInProgress ? 'Wird ausgeführt...' : 'Alle validierten Anfragen zuordnen'}
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                {/* ------ Bereich 2: Konfliktgruppen ------ */}
                <Col md={12} lg={6} className="mb-4">
                    <Card className="h-100 shadow-sm">
                        <Card.Body>
                            <Card.Title as="h3">Phase 2: Konfliktgruppen Töpfe bearbeiten</Card.Title>
                            <Card.Text>
                                Übersicht über Konfliktgruppen der Töpfe, die eine Koordination und Entscheidung erfordern.
                            </Card.Text>
                            <ListGroup variant="flush" className="mb-3">                                
                                    <ListGroup.Item variant={anfragenInPipeline.inPruefungTopf > 0 ? 'warning' : ''}>
                                        Anfragen mit Status 'in Prüfung Topf': <strong>{anfragenInPipeline.inPruefungTopf}</strong>
                                    </ListGroup.Item>
                                    <ListGroup.Item variant={anfragenInPipeline.inKonflikt > 0 ? 'danger' : ''}>
                                        Anfragen mit Status 'in Konflikt': <strong>{anfragenInPipeline.inKonflikt}</strong>
                                    </ListGroup.Item>
                                    <ListGroup.Item variant={anfragenInPipeline.inPruefungSlot > 0 ? 'success' : ''}>
                                        Anfragen mit Status 'in Prüfung Slot': <>{anfragenInPipeline.inPruefungSlot}</>
                                    </ListGroup.Item>
                                
                                {/* Hier könnten weitere Status-Zählungen hin */}
                            </ListGroup>
                             <Button 
                                onClick={handleKonfliktIdentifizierungStarten} 
                                disabled={actionInProgress}
                                variant="secondary"
                                className="w-100 mb-3"
                            >
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Konflikte & Gruppen jetzt aktualisieren
                            </Button>
                            <ListGroup variant="flush" className="mb-3">
                                <ListGroup.Item variant={konfliktGruppen.length > 0 ? 'warning' : ''}>
                                        Anzahl Konfliktgruppen: <strong>{konfliktGruppen.length}</strong>
                                    </ListGroup.Item>
                            </ListGroup>
                            <Link to="/gruppen" className="btn btn-primary mb-4 w-100">
                                <i className="bi bi-kanban me-2"></i>Konfliktgruppen ansehen
                            </Link>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Row>
                {/* ------ Bereich 3: Slot-Konflikte ------ */}
                <Col md={12} lg={6} className="mb-4">
                    <Card className="h-100 shadow-sm">
                        <Card.Body>
                            <Card.Title as="h3">Phase 3: Konfliktgruppen Slots bearbeiten</Card.Title>
                            <Card.Text>
                                Übersicht über Konfliktgruppen der Slots, die eine Koordination und Entscheidung erfordern.
                            </Card.Text>
                            <Button 
                                onClick={handleKonfliktIdentifizierungStarten} 
                                disabled={actionInProgress}
                                variant="secondary"
                                className="w-100 mb-3"
                            >
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Konflikte & Gruppen jetzt aktualisieren
                            </Button>
                            <ListGroup>
                                { slotConflicts ? konfliktGruppen.map(gruppe => (
                                    <ListGroup.Item key={gruppe._id} as={Link} to={`/konflikte/gruppen/${gruppe._id}/bearbeiten`} action>
                                        <div className="d-flex w-100 justify-content-between">
                                            <h5 className="mb-1">Gruppe mit {gruppe.beteiligteAnfragen.length} Anfragen</h5>
                                            <Badge bg="warning" pill>{gruppe.konflikteInGruppe.length} Konflikte</Badge>
                                        </div>
                                        <p className="mb-1">Status der Gruppe: <strong>{gruppe.status}</strong></p>
                                    </ListGroup.Item>
                                )) : <p>Aktuell keine offenen Konfliktgruppen für Slots.</p>}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                {/* ------ Bereich 4: Nachrückeen ------ */}
                <Col md={12} lg={6} className="mb-4">
                    <Card className="h-100 shadow-sm">
                        <Card.Body>
                            <Card.Title as="h3">Phase 4: Nachrücken in freie Kapazitätstöpfe</Card.Title>
                            <Card.Text>
                                Übersicht über Kapazitätstöpfe, in die Anfragen nach der Konfliktlösung nachrücken können.
                            </Card.Text>                             
                            <ListGroup>
                                <p>Aktuell keine offenen Konfliktgruppen.</p>
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default KonfliktCoordinationPage;