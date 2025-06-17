// src/pages/KonfliktGruppenCoordinationPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Container, Card, Button, Spinner, Alert, ListGroup, Row, Col, Table, Form, Accordion, Modal, Badge } from 'react-bootstrap';

// Wir lagern die Analyse-Ergebnis-Anzeige in eigene kleine Komponenten aus
const VerschiebeAnalyseView = ({ data }) => ( <pre>{JSON.stringify(data, null, 2)}</pre> );
const AlternativenAnalyseView = ({ data }) => ( <pre>{JSON.stringify(data, null, 2)}</pre> );

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

function KonfliktGruppenCoordinationPage() {
    const { gruppenId } = useParams();
    //const navigate = useNavigate();

    const [gruppe, setGruppe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [actionFeedback, setActionFeedback] = useState('');

    // State für die Analyse-Ergebnisse
    //const [verschiebeAnalyse, setVerschiebeAnalyse] = useState(null);
    //const [alternativenAnalyse, setAlternativenAnalyse] = useState(null);
    const [showAnalyseModal, setShowAnalyseModal] = useState(false);
    const [modalContent, setModalContent] = useState(null);

    // State für die Checkboxen der Verzicht-Phase
    const [verzichte, setVerzichte] = useState(new Set());

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/konflikte/gruppen/${gruppenId}`);
            setGruppe(response.data.data);
            setError(null);
        } catch (err) { 
            setError(`Konfliktgruppe konnte nicht geladen werden. ${err.message}`); 
            console.error(err);
        } finally { 
            setLoading(false); 
        }
    }, [gruppenId]);

    useEffect(() => {
        fetchData(); 
    }, [fetchData]);

    

    // Handler
    const handleVerzichtChange = (anfrageId) => {
        const newSet = new Set(verzichte);
        if (newSet.has(anfrageId)) {
            newSet.delete(anfrageId);
        } else {
            newSet.add(anfrageId);
        }
        setVerzichte(newSet);
    };

    const handleAnalyse = async (analyseTyp) => {
        setActionInProgress(true);
        setModalContent(null);
        try {
            const endpoint = analyseTyp === 'verschiebe' ? `/konflikte/gruppen/${gruppenId}/verschiebe-analyse` : `/konflikte/gruppen/${gruppenId}/alternativen`;
            const response = await apiClient.get(endpoint);
            setModalContent({ title: `Ergebnis: ${analyseTyp}-Analyse`, data: response.data.data });
            setShowAnalyseModal(true);
        } catch (err) {
            setActionFeedback(`Fehler bei der ${analyseTyp}-Analyse. ${err}`);
        } finally {
            setActionInProgress(false);
        }
    };
    
    const handleVerzichtSubmit = async () => {
        setActionInProgress(true);
        setActionFeedback('Verarbeite Verzichte...');
        try {
            // ANPASSUNG: Der Payload ist jetzt viel einfacher.
            const payload = {
                // konfliktDokumentIds wird nicht mehr benötigt
                ListeAnfragenMitVerzicht: Array.from(verzichte)
                // ListeAnfragenVerschubKoordination könnte hier auch noch rein, falls du es implementierst
            };

            // Der API-Aufruf bleibt gleich, aber mit einfacherem Payload
            const response = await apiClient.put(`/konflikte/gruppen/${gruppenId}/verzicht-verschub`, payload);

            setActionFeedback(response.data.message);
            await fetchData(); // Lade die Daten neu, um den aktualisierten Status zu sehen
        } catch(err) {
            const errorMsg = err.response?.data?.message || 'Fehler beim Verarbeiten der Verzichte.';
            setActionFeedback(errorMsg);
            console.error(err);
        } finally {
            setActionInProgress(false);
        }
    };

    // Abgeleitete Daten für die Zusammenfassung
    const summary = useMemo(() => {
        if (!gruppe) return {};
        const kws = new Set(gruppe.konflikteInGruppe.map(k => k.ausloesenderKapazitaetstopf?.Kalenderwoche));
        const vts = new Set(gruppe.konflikteInGruppe.map(k => k.ausloesenderKapazitaetstopf?.Verkehrstag));
        const abschnitte = new Set(gruppe.konflikteInGruppe.map(k => k.ausloesenderKapazitaetstopf?.Abschnitt));
        const vas = new Set(gruppe.beteiligteAnfragen.map(a => a.Verkehrsart));
        const zf = new Set(gruppe.konflikteInGruppe.map(k => k.ausloesenderKapazitaetstopf?.Zeitfenster));
        return {
            konfliktTyp: gruppe.konflikteInGruppe[0]?.konfliktTyp || 'KAPAZITAETSTOPF',
            anzahlToepfe: gruppe.konflikteInGruppe.length,
            kalenderwochen: Array.from(kws).join(', '),
            verkehrstage: Array.from(vts).join(', '),
            abschnitte: Array.from(abschnitte).join(', '),
            zeitfenster: Array.from(zf).join(', '),
            verkehrsart: vas.size === 1 ? Array.from(vas)[0] : 'ALLE'
        };
    }, [gruppe]);


    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!gruppe) return <Alert variant="warning">Keine Gruppendaten gefunden.</Alert>;

    return (
        <Container>
            {/* --- ZUSAMMENFASSUNG DER GRUPPE --- */}
            {actionFeedback && <Alert variant="info">{actionFeedback}</Alert>}
            <Card className="mb-4">
                <Card.Header as="h2">Konfliktgruppe bearbeiten: <code>{gruppe._id}</code></Card.Header>
                <Card.Body>
                    <Row>
                        <Col>
                            <p><strong>Abschnitte:</strong> {summary.abschnitte}</p>
                            <p><strong>Verkehrsart:</strong> <Badge bg={verkehrsartColorMap[summary.verkehrsart] || 'secondary'}>{summary.verkehrsart}</Badge></p>
                            <p><strong>Verkehrstage:</strong> {summary.verkehrstage}</p>
                            <p><strong>Zeitfenster:</strong> {summary.zeitfenster} </p>
                            <p><strong>Beteiligte Anfragen:</strong> {gruppe.beteiligteAnfragen.length}</p>
                            <p><strong>Anzahl Konflikt-Töpfe:</strong> {summary.anzahlToepfe}</p>                            
                        </Col>
                        <Col>
                            <p><strong>Kalenderwochen:</strong> {summary.kalenderwochen}</p> 
                        </Col>
                    </Row>
                    <Table striped bordered size="sm">
                        <thead><tr><th>Anfrage ID</th><th>EVU</th><th>E-Mail</th><th>Entgelt (€)</th><th>Aktueller Status</th></tr></thead>
                        <tbody>
                            {gruppe.beteiligteAnfragen.map(a => (
                                <tr key={a._id}>
                                    <td><code>{a.AnfrageID_Sprechend}</code></td>
                                    <td>{a.EVU}</td>
                                    <td>{a.Email}</td>
                                    <td>{a.Entgelt?.toFixed(2) || 'N/A'}</td>
                                    <td><Badge pill bg="info">{a.Status}</Badge></td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
                <Card.Footer><strong>Aktueller Status der Gruppe:</strong> <Badge bg={getGruppeStatusBadgeVariant(gruppe.status)}><span className="fw-bold">{gruppe.status.toUpperCase()}</span></Badge></Card.Footer>
            </Card>

            {/* --- AKKORDION FÜR DIE LÖSUNGSPHASEN --- */}
            <Accordion defaultActiveKey={['offen', 'in_bearbeitung_verzicht'].includes(gruppe.status) ? '0' : '1'}>
                {/* --- PHASE 1: VERZICHT & KOORDINATION --- */}
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Phase 1: Verzicht & Koordination</Accordion.Header>
                    <Accordion.Body>
                        <p>Wähle die Anfragen aus, die auf die Zuweisung in dieser Konfliktgruppe verzichten.</p>
                        <ListGroup className="mb-3">
                            {gruppe.beteiligteAnfragen.map(a => (
                                <ListGroup.Item key={a._id}>
                                    <Form.Check 
                                        type="checkbox"
                                        id={`verzicht-${a._id}`}
                                        label={<code>{a.AnfrageID_Sprechend}</code>}
                                        onChange={() => handleVerzichtChange(a._id)}
                                        checked={verzichte.has(a._id)}
                                    />
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                        <div className="d-grid gap-2 d-md-flex justify-content-md-between">
                            <div>
                                <Button variant="outline-info" onClick={() => handleAnalyse('verschiebe')} disabled={actionInProgress} className="me-2">
                                    <i className="bi bi-calendar-week"></i> Nachbar-Töpfe prüfen
                                </Button>
                                <Button variant="outline-info" onClick={() => handleAnalyse('alternativen')} disabled={actionInProgress}>
                                    <i className="bi bi-arrows-angle-expand"></i> Alternative Slots finden
                                </Button>
                            </div>
                            <Button onClick={handleVerzichtSubmit} disabled={actionInProgress || ['in_bearbeitung_entgelt', 'in_bearbeitung_hoechstpreis', 'teilweise_geloest', 'vollstaendig_geloest'].includes(gruppe.status)}>
                                {actionInProgress ? <Spinner size="sm" /> : 'Verzichte verarbeiten & Kapazität prüfen'}
                            </Button>
                        </div>
                    </Accordion.Body>
                </Accordion.Item>
                
                {/* --- PHASE 2: ENTGELTVERGLEICH --- */}
                 <Accordion.Item eventKey="1">
                    <Accordion.Header>Phase 2: Entgeltvergleich</Accordion.Header>
                    <Accordion.Body>
                        <p>Dieser Bereich wird aktiv, wenn nach der Verzicht-Phase weiterhin ein Konflikt besteht.</p>
                        <Button disabled={gruppe.status !== 'in_bearbeitung_entgelt' || actionInProgress}>
                            Entgeltvergleich jetzt durchführen
                        </Button>
                    </Accordion.Body>
                </Accordion.Item>

                {/* --- PHASE 3: HÖCHSTPREISVERFAHREN --- */}
                 <Accordion.Item eventKey="2">
                    <Accordion.Header>Phase 3: Höchstpreisverfahren</Accordion.Header>
                    <Accordion.Body>
                        <p>Dieser Bereich wird aktiv, wenn ein Gleichstand beim Entgeltvergleich aufgetreten ist.</p>
                        <Button disabled={gruppe.status !== 'in_bearbeitung_hoechstpreis' || actionInProgress}>
                            Höchstpreis-Gebote einreichen
                        </Button>
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
            
            {/* Modal zur Anzeige der Analyse-Ergebnisse */}
            <Modal show={showAnalyseModal} onHide={() => setShowAnalyseModal(false)} size="lg">
                <Modal.Header closeButton><Modal.Title>{modalContent?.title}</Modal.Title></Modal.Header>
                <Modal.Body>
                    {/* Wir zeigen die rohen JSON-Daten. Eine schönere Darstellung wäre ein weiterer Schritt. */}
                    <pre>{JSON.stringify(modalContent?.data, null, 2)}</pre>
                </Modal.Body>
            </Modal>
        </Container>
    );
}

export default KonfliktGruppenCoordinationPage;