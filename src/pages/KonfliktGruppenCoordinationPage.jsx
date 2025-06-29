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
    
    // State für die eingegebenen Höchstpreis-Gebote
    // Wir speichern sie in einem Objekt mit der anfrageId als Schlüssel
    const [gebote, setGebote] = useState({});

    // State für die Analyse-Ergebnisse
    //const [verschiebeAnalyse, setVerschiebeAnalyse] = useState(null);
    //const [alternativenAnalyse, setAlternativenAnalyse] = useState(null);
    const [showAnalyseModal, setShowAnalyseModal] = useState(false);
    const [modalContent, setModalContent] = useState(null);

    // State für die Checkboxen der Verzicht-Phase
    const [verzichte, setVerzichte] = useState(new Set());

    // State für die vom Nutzer eingegebenen EVU-Reihungen
    const [evuReihungen, setEvuReihungen] = useState({});

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

    // useMemo, um zu bestimmen, welche EVUs eine Reihung benötigen
    const evusDieReihungBenötigen = useMemo(() => {
        if (!gruppe || !gruppe.konflikteInGruppe?.[0]?.ausloesenderKapazitaetstopf) return [];
        
        // Annahme: Alle Töpfe in einer Gruppe haben dieselbe Anzahl an Slots und somit dasselbe Limit
        // das wird über die korrekte Gruppen-ID sichergestellt, die gleiche Töpfe zusammen bündelt
        const anzahlSlotsImTopf = gruppe.konflikteInGruppe[0].ausloesenderKapazitaetstopf.ListeDerSlots.length;
        const evuMarktanteilLimit = Math.floor(0.56 * anzahlSlotsImTopf);

        const anfragenProEVU = new Map();
        gruppe.beteiligteAnfragen.forEach(a => {
            if (!anfragenProEVU.has(a.EVU)) anfragenProEVU.set(a.EVU, []);
            anfragenProEVU.get(a.EVU).push(a);
        });

        const benoetigenReihung = [];
        anfragenProEVU.forEach((anfragen, evu) => {
            if (anfragen.length > evuMarktanteilLimit) {
                benoetigenReihung.push({ evu, anfragen, limit: evuMarktanteilLimit });
            }
        });
        return benoetigenReihung;
    }, [gruppe]);

    // Initialisiere den Reihungs-State, wenn die Kandidaten feststehen
    useEffect(() => {
        const initialReihungen = {};
        for (const gruppe of evusDieReihungBenötigen) {
            initialReihungen[gruppe.evu] = gruppe.anfragen.map(a => a._id);
        }
        setEvuReihungen(initialReihungen);
    }, [evusDieReihungBenötigen]);

    // NEU: Handler, um Anfragen in der Reihung nach oben/unten zu verschieben
    const handleMoveAnfrage = (evu, index, direction) => {
        const anfrageIds = [...evuReihungen[evu]];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= anfrageIds.length) return; // Nicht über die Grenzen hinaus verschieben

        // Elemente tauschen
        [anfrageIds[index], anfrageIds[newIndex]] = [anfrageIds[newIndex], anfrageIds[index]];
        
        setEvuReihungen(prev => ({ ...prev, [evu]: anfrageIds }));
    };

    

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
    
    // Handler-Funktion für die Verarbeitung des Verzichts
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

    // Handler-Funktion für den Entgeltvergleich
    const handleEntgeltvergleichSubmit = async () => {
        setActionInProgress(true);
        setActionFeedback('Führe Entgeltvergleich durch...');
        try {
            // Erstelle den Payload mit den vom Nutzer geordneten Reihungen
            const payload = {
                evuReihungen: Object.entries(evuReihungen).map(([evu, anfrageIds]) => ({
                    evu,
                    anfrageIds
                }))
            };
            const response = await apiClient.put(`/konflikte/gruppen/${gruppenId}/entgeltvergleich`, payload); // Leerer Body genügt
            setActionFeedback(response.data.message);
            fetchData(); // Lade die Daten neu, um den aktualisierten Status und die Reihung zu sehen
        } catch(err) {
            const errorMsg = err.response?.data?.message || 'Fehler beim Durchführen des Entgeltvergleichs.';
            setActionFeedback(errorMsg);
            console.error(err);
        } finally {
            setActionInProgress(false);
        }
    };

    // Handler für Änderungen in den Gebot-Eingabefeldern
    const handleGebotChange = (anfrageId, gebotValue) => {
        setGebote(prevGebote => ({
            ...prevGebote,
            [anfrageId]: gebotValue
        }));
    };

    // Handler zum Abschicken der Höchstpreis-Ergebnisse
    const handleHoechstpreisSubmit = async () => {
        setActionInProgress(true);
        setActionFeedback('Verarbeite Höchstpreis-Gebote...');
        try {
            // Erstelle den Payload aus dem `gebote`-State
            const payload = {
                ListeGeboteHoechstpreis: Object.entries(gebote).map(([anfrageId, gebot]) => ({
                    anfrage: anfrageId,
                    gebot: parseFloat(gebot) || 0 // Konvertiere zu Zahl, Fallback auf 0
                }))
            };

            const response = await apiClient.put(`/konflikte/gruppen/${gruppenId}/hoechstpreis-ergebnis`, payload);
            setActionFeedback(response.data.message);
            fetchData(); // Lade die Daten neu, um den finalen Status zu sehen
        } catch(err) {
            const errorMsg = err.response?.data?.message || 'Fehler beim Verarbeiten der Höchstpreis-Gebote.';
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

    // useMemo-Hook zum Filtern der Höchstpreis-Kandidaten
    const hoechstpreisKandidaten = useMemo(() => {
        if (!gruppe) return [];

        // 1. Sammle die IDs aller Töpfe, die zu dieser Konfliktgruppe gehören
        const topfIdsInGruppe = new Set(
            gruppe.konflikteInGruppe.map(k => k.ausloesenderKapazitaetstopf?._id.toString())
        );

        // 2. Filtere die beteiligten Anfragen
        return gruppe.beteiligteAnfragen.filter(anfrage => {
            // Eine Anfrage ist ein Kandidat, wenn sie mindestens eine Slot-Zuweisung hat, die:
            // a) zu einem der Töpfe in dieser Gruppe gehört UND
            // b) den Status 'wartet_hoechstpreis_topf' hat.
            return anfrage.ZugewieseneSlots.some(zuweisung => {
                const hatWartestatus = zuweisung.statusEinzelzuweisung === 'wartet_hoechstpreis_topf';
                const gehoertZuGruppe = zuweisung.slot && zuweisung.slot.VerweisAufTopf && topfIdsInGruppe.has(zuweisung.slot.VerweisAufTopf.toString());
                
                return hatWartestatus && gehoertZuGruppe;
            });
        });
    }, [gruppe]); // Wird nur neu berechnet, wenn sich das `gruppe`-Objekt ändert



    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!gruppe) return <Alert variant="warning">Keine Gruppendaten gefunden.</Alert>;

    // Repräsentatives Konfliktdokument für die Anzeige der Reihung
    const repraesentativerKonflikt = gruppe.konflikteInGruppe[0];

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
            <Accordion defaultActiveKey={
                ['offen', 'in_bearbeitung_verzicht'].includes(gruppe.status) ? '0' :
                gruppe.status === 'in_bearbeitung_entgelt' ? '1' :
                gruppe.status === 'in_bearbeitung_hoechstpreis' ? '2' : '0'
            }>
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
                        <p>
                            Dieser Bereich wird aktiv, wenn nach der Verzicht-Phase weiterhin ein Konflikt besteht. 
                            Das System ermittelt automatisch eine Reihung basierend auf den Entgelten der verbleibenden Anfragen.
                            Wenn ein EVU mehr Anfragen im Konflikt hat als sein Marktanteil-Limit erlaubt,
                            legen Sie bitte nach dessen Rückmeldung die Priorisierung durch Sortieren fest.
                        </p>
                        {evusDieReihungBenötigen.length > 0 && (
                            <Card className="my-3">
                                <Card.Header className="bg-warning text-dark">Manuelle EVU-Reihung erforderlich</Card.Header>
                                <ListGroup variant="flush">
                                {evusDieReihungBenötigen.map(({ evu, limit }) => (
                                    <ListGroup.Item key={evu}>
                                        <strong>{evu}</strong> (Limit: {limit})
                                        <Table hover size="sm" className="mt-2">
                                            <tbody>
                                            {(evuReihungen[evu] || []).map((anfrageId, index) => {
                                                const anfrage = gruppe.beteiligteAnfragen.find(a => a._id === anfrageId);
                                                if (!anfrage) return null;
                                                // Zeilen über dem Limit werden visuell markiert
                                                const isOverLimit = index >= limit;
                                                return (
                                                    <tr key={anfrage._id} className={isOverLimit ? 'table-danger' : ''}>
                                                        <td>#{index + 1}</td>
                                                        <td><code>{anfrage.AnfrageID_Sprechend}</code></td>
                                                        <td>{(anfrage.Entgelt || 0).toFixed(2)} €</td>
                                                        <td className="text-end">
                                                            <Button variant="light" size="sm" onClick={() => handleMoveAnfrage(evu, index, 'up')} disabled={gruppe.status !== 'in_bearbeitung_entgelt' || index === 0}>
                                                                <i className="bi bi-arrow-up"></i>
                                                            </Button>
                                                            <Button variant="light" size="sm" onClick={() => handleMoveAnfrage(evu, index, 'down')} disabled={gruppe.status !== 'in_bearbeitung_entgelt' || index === evuReihungen[evu].length - 1} className="ms-1">
                                                                <i className="bi bi-arrow-down"></i>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </Table>
                                    </ListGroup.Item>
                                ))}
                                </ListGroup>
                            </Card>
                        )}

                        <div className="d-grid">
                            <Button 
                                onClick={handleEntgeltvergleichSubmit}
                                disabled={gruppe.status !== 'in_bearbeitung_entgelt' || actionInProgress}
                                variant="primary"
                            >
                                {actionInProgress ? <Spinner size="sm" /> : 'Entgeltvergleich jetzt durchführen'}
                            </Button>
                        </div>

                        {/* ANZEIGE DER ERGEBNIS-TABELLE */}
                        {repraesentativerKonflikt && repraesentativerKonflikt.ReihungEntgelt && repraesentativerKonflikt.ReihungEntgelt.length > 0 && (
                            <div className="mt-4">
                                <h5>Ergebnis der Reihung:</h5>
                                <Table striped bordered size="sm">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Rang</th>
                                            <th>Anfrage ID</th>
                                            <th>EVU</th>
                                            <th>Entgelt (€)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {repraesentativerKonflikt.ReihungEntgelt.map(item => (
                                            <tr key={item.rang}>
                                                <td><h4><Badge bg="dark">{item.rang}</Badge></h4></td>
                                                <td><code>{item.anfrage.AnfrageID_Sprechend}</code></td>
                                                <td>{item.anfrage.EVU}</td>
                                                <td className="text-end">{item.entgelt.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Accordion.Body>
                </Accordion.Item>

                {/* --- PHASE 3: HÖCHSTPREISVERFAHREN --- */}
                <Accordion.Item eventKey="2">
                    <Accordion.Header>Phase 3: Höchstpreisverfahren</Accordion.Header>
                    <Accordion.Body>
                        <p>
                            Dieser Bereich wird aktiv, wenn ein Gleichstand beim Entgeltvergleich aufgetreten ist.
                            Bitte tragen Sie die neuen Gebote für die folgenden Anfragen ein.
                        </p>
                        
                        {gruppe.status === 'in_bearbeitung_hoechstpreis' ? (
                            <Form onSubmit={(e) => { e.preventDefault(); handleHoechstpreisSubmit(); }}>
                                <Table bordered size="sm" className="mt-3">
                                    <thead>
                                        <tr>
                                            <th>Anfrage ID</th>
                                            <th>EVU</th>
                                            <th>Urspr. Entgelt (€)</th>
                                            <th style={{width: '200px'}}>Neues Gebot (€)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hoechstpreisKandidaten.map(kandidat => {
                                            const aktuellesGebot = gebote[kandidat._id] || '';
                                            const istGebotUngueltig = aktuellesGebot !== '' && parseFloat(aktuellesGebot) <= (kandidat.Entgelt || 0);

                                            return (
                                                <tr key={kandidat._id}>
                                                    <td><code>{kandidat.AnfrageID_Sprechend}</code></td>
                                                    <td>{kandidat.EVU}</td>
                                                    <td>{(kandidat.Entgelt || 0).toFixed(2)}</td>
                                                    <td>
                                                        <Form.Control 
                                                            type="number"
                                                            value={aktuellesGebot}
                                                            onChange={(e) => handleGebotChange(kandidat._id, e.target.value)}
                                                            placeholder="Gebot eingeben"
                                                            isInvalid={istGebotUngueltig} // Visuelles Feedback
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                        <Form.Control.Feedback type="invalid">
                                                            Gebot sollte höher als ursprüngliches Entgelt sein. Bitte genau prüfen.
                                                        </Form.Control.Feedback>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                                <div className="d-grid mt-3">
                                    <Button type="submit" variant="primary" disabled={actionInProgress}>
                                        {actionInProgress ? <Spinner size="sm"/> : 'Höchstpreis-Gebote verarbeiten & Konflikt lösen'}
                                    </Button>
                                </div>
                            </Form>
                        ) : (
                            <Alert variant="secondary">Der Konflikt befindet sich nicht im Höchstpreisverfahren.</Alert>
                        )}
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>

            <h4 className="mt-4">Zugeordnete Kapazitätstöpfe </h4>
            <ListGroup>
                {gruppe.konflikteInGruppe.map(k => (
                    <ListGroup.Item 
                        key={k.ausloesenderKapazitaetstopf._id} 
                        className="d-flex justify-content-between align-items-center"
                        >
                        <code>{k.ausloesenderKapazitaetstopf.TopfID}</code>
                                    
                        Max. Kapazität {k.ausloesenderKapazitaetstopf.maxKapazitaet}
                    </ListGroup.Item>
                ))}
            </ListGroup>
            
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