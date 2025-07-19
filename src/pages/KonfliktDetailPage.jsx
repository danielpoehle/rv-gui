import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Container, Card, Row, Col, Spinner, Alert, Badge, ListGroup, Table } from 'react-bootstrap';



const DetailRow = ({ label, value }) => (
    <ListGroup.Item className="d-flex justify-content-between align-items-start">
        <div className="ms-2 me-auto">
            <div className="fw-bold">{label}</div>
            <div className="text-muted">{value}</div>
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
    if (status.startsWith('teilweise_final_bestaetigt')) return 'success';
    if (status.startsWith('vollstaendig_final_bestaetigt')) return 'success';
    if (status.startsWith('abgelehnt')) return 'danger';
    if (status.startsWith('final_abgelehnt')) return 'danger';
    if (status.startsWith('fehlende_Plausi')) return 'danger';
    if (status.startsWith('ungueltig')) return 'warning';
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

    // NEUE HELFERFUNKTION
    const getErgebnisFuerAnfrage = (anfrage, konflikt) => {
        if (!anfrage || !konflikt) return { text: '-', variant: 'secondary' };
        
        const anfrageIdStr = anfrage._id.toString();

        // Prüfe die Ergebnislisten in einer logischen Reihenfolge
        // Wichtig: Die Listen enthalten populierte Objekte, wir müssen auf ._id zugreifen
        if (konflikt.zugewieseneAnfragen?.some(a => a._id.toString() === anfrageIdStr)) {
            return { text: 'Anfrage gewinnt', variant: 'success' };
        }
        if (konflikt.ListeAnfragenMitVerzicht?.some(a => a._id.toString() === anfrageIdStr)) {
            return { text: 'hat verzichtet', variant: 'dark' };
        }
        if (konflikt.ListeAnfragenVerschubKoordination?.some(item => item.anfrage._id.toString() === anfrageIdStr)) {
            return { text: 'wurde verschoben', variant: 'info' };
        }
        if (konflikt.abgelehnteAnfragenEntgeltvergleich?.some(a => a._id.toString() === anfrageIdStr)) {
            return { text: 'unterlegen im Entgeltvergleich', variant: 'danger' };
        }
        if (konflikt.abgelehnteAnfragenHoechstpreis?.some(a => a._id.toString() === anfrageIdStr)) {
            return { text: 'unterlegen im Höchstpreisverfahren', variant: 'danger' };
        }
        if (konflikt.abgelehnteAnfragenMarktanteil?.some(a => a._id.toString() === anfrageIdStr)) {
            return { text: 'abgelehnt wegen Marktanteil', variant: 'danger' };
        }

        // Fallback, wenn in keiner Ergebnisliste (z.B. Konflikt noch 'offen')
        return { text: 'Entscheidung ausstehend', variant: 'secondary' };
    };

    if (loading) { return <div className="text-center mt-5"><Spinner animation="border" /></div>; }
    if (error) { return <Alert variant="danger">{error}</Alert>; }
    if (!konfliktData) { return <Alert variant="warning">Keine Konfliktdaten gefunden.</Alert>; }

    const { konflikt, gruppenId } = konfliktData;

    // --- NEUE LOGIK: Bestimme die Details basierend auf dem Konflikttyp ---
    const istTopfKonflikt = konflikt.konfliktTyp === 'KAPAZITAETSTOPF';
    
    // Das auslösende Objekt (entweder Topf oder Slot)
    const ausloeser = istTopfKonflikt ? konflikt.ausloesenderKapazitaetstopf : konflikt.ausloesenderSlot;
    
    // Die sprechende ID des Auslösers
    const ausloeserIdSprechend = istTopfKonflikt ? ausloeser?.TopfID : ausloeser?.SlotID_Sprechend;

    // Die maximale Kapazität (variabel für Topf, immer 1 für Slot)
    const maxKap = istTopfKonflikt ? ausloeser?.maxKapazitaet : 1;

    // Die Liste der Slots, die wir anzeigen wollen
    const slotsAnzeigen = istTopfKonflikt ? ausloeser?.ListeDerSlots || [] : (ausloeser ? [ausloeser] : []);
    const slotListenHeader = istTopfKonflikt ? `Slots im auslösenden Kapazitätstopf (${slotsAnzeigen.length})` : "Konflikt-Slot";
    // -------------------------------------------------------------------
    

    return (
        <Container>
            <Link to="/konflikte" className="btn btn-secondary mb-4">
                <i className="bi bi-arrow-left me-2"></i>Zur Konflikt-Übersicht
            </Link>

            {/* --- HAUPTDETAILS DES KONFLIKTS (ANGEPASST) --- */}
            <Card className="mb-4 shadow-sm">
                <Card.Header as="h3">Konflikt-Details</Card.Header>
                <Card.Body>
                     <ListGroup variant="flush">
                        <DetailRow label="Konflikt-ID" value={<code>{konflikt._id}</code>} />
                        {gruppenId && (
                            <DetailRow label="Zugehörige Konfliktgruppe" value={<Link to={`/konflikte/gruppen/${gruppenId}/bearbeiten`}><code>{gruppenId}</code></Link>} />
                        )}
                        <DetailRow label="Konflikt-Typ" value={<Badge bg="info">{konflikt.konfliktTyp}</Badge>} />
                        <DetailRow label="Status" value={<Badge bg={getKonfliktStatusBadgeVariant(konflikt.status)} pill>{konflikt.status}</Badge>} />
                        <DetailRow 
                            label={`Auslösender ${istTopfKonflikt ? 'Kapazitätstopf' : 'Slot'}`} 
                            value={<code>{ausloeserIdSprechend || 'N/A'}</code>}
                        />
                        <DetailRow 
                            label="Initiale Anfragen vs. maximale Kapazität" 
                            value={`${konflikt.beteiligteAnfragen.length} / ${maxKap ?? 'N/A'}`} 
                        />
                     </ListGroup>
                </Card.Body>
            </Card>

            {/* --- VERLAUF & NOTIZEN (unverändert) --- */}
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

            {/* --- BETEILIGTE ANFRAGEN (unverändert) --- */}
            <Card className="mb-4 shadow-sm">
                <Card.Header as="h4">Beteiligte Anfragen ({konflikt.beteiligteAnfragen.length})</Card.Header>
                <Table striped hover size="sm" className="mb-0">
                    <thead><tr><th>Verkehrsart</th><th>Anmeldung</th><th>EVU</th><th>Entgelt</th><th>Status Anfrage</th><th>Ergebnis Konflikt</th></tr></thead>
                    <tbody>
                        {[...konflikt.beteiligteAnfragen].sort((a, b) => {
                                return (a.AnfrageID_Sprechend || '').localeCompare(b.AnfrageID_Sprechend || '');
                        })
                        .map(anfrage => {
                            // Rufe die neue Hilfsfunktion für jede Anfrage auf
                            const ergebnis = getErgebnisFuerAnfrage(anfrage, konflikt);
                            
                            return(
                            <tr key={anfrage._id}>
                                <td><Badge bg={verkehrsartColorMap[anfrage.Verkehrsart] || 'secondary'}>{anfrage.Verkehrsart}</Badge></td>
                                <td><code>{anfrage.AnfrageID_Sprechend}</code></td>
                                <td>{anfrage.EVU}</td>
                                <td>{(anfrage.Entgelt || 0).toFixed(2)} €</td>
                                <td><Badge bg={getAnfrageStatusBadgeVariant(anfrage.Status)} pill>{anfrage.Status}</Badge></td>
                                <td><Badge bg={ergebnis.variant} text={ergebnis.text_color || null}>{ergebnis.text}</Badge></td>
                            </tr>
                        )})}
                    </tbody>
                </Table>                
            </Card>
            
            {/* --- BETEILIGTE SLOTS (ANGEPASST) --- */}
            <Card className="mb-4 shadow-sm">
                 <Card.Header as="h4">{slotListenHeader}</Card.Header>
                 <Table striped hover size="sm" className="mb-0">
                    <thead><tr><th>Slot ID</th><th>Linie</th><th>Abschnitt</th><th>initiale Belegung</th></tr></thead>
                    <tbody>
                        {slotsAnzeigen.length > 0 ? slotsAnzeigen.map(slot => (
                            <tr key={slot._id}>
                                <td><code>{slot.SlotID_Sprechend}</code></td>
                                <td>{slot.Linienbezeichnung || '-'}</td>
                                <td>{slot.Abschnitt}</td>
                                <td>{getSlotBelegungBadge(slot)}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="text-center text-muted">Keine Slots zuzuordnen.</td></tr>
                        )}
                    </tbody>
                 </Table>
            </Card>

        </Container>
    );
}

    
export default KonfliktDetailPage;