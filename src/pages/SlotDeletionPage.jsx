import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Table, Spinner, Alert, Button, Form, Card } from 'react-bootstrap';

function SlotDeletionPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSlots, setSelectedSlots] = useState(new Set());

    useEffect(() => {
        const fetchSlots = async () => {
            setLoading(true);
            try {
                // Sende die Query-Parameter an den neuen Endpunkt
                const response = await apiClient.get(`/slots/by-muster?${queryParams.toString()}`);
                const fetchedSlots = response.data.data;
                setSlots(fetchedSlots);

                // Filtere zuerst die Slots, die gelöscht werden können (0 Anfragen),
                // und wähle nur diese initial aus.
                const deletableSlotIds = fetchedSlots
                    .filter(slot => slot.zugewieseneAnfragen.length === 0)
                    .map(slot => slot._id);
                setSelectedSlots(new Set(deletableSlotIds));
            } catch (err) {
                setError("Slots konnten nicht geladen werden.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSlots();
    }, [queryParams]);

    const handleCheckboxChange = (slotId) => {
        const newSelection = new Set(selectedSlots);
        if (newSelection.has(slotId)) {
            newSelection.delete(slotId);
        } else {
            newSelection.add(slotId);
        }
        setSelectedSlots(newSelection);
    };

    const isDeleteDisabled = useMemo(() => {
        if (selectedSlots.size === 0) return true;
        // Prüfe, ob einer der ausgewählten Slots belegt ist
        for (const slotId of selectedSlots) {
            const slot = slots.find(s => s._id === slotId);
            if (slot && slot.zugewieseneAnfragen.length > 0) {
                return true; // Deaktiviere, wenn ein belegter Slot ausgewählt ist
            }
        }
        return false;
    }, [selectedSlots, slots]);
    
    const handleDelete = async () => {
        if (!window.confirm(`${selectedSlots.size} Slot(s) wirklich löschen?`)) return;
        setLoading(true);
        try {
            const payload = { slotIdsToDelete: Array.from(selectedSlots) };
            const response = await apiClient.post('/slots/bulk-delete', payload);
            alert(response.data.message);
            navigate('/slots/counter'); // Zurück zur Übersicht
        } catch (err) {
            setError(err.response?.data?.message || 'Löschen fehlgeschlagen.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    if (loading && slots.length === 0) { return <Spinner animation="border" />; }
    if (error) { return <Alert variant="danger">{error}</Alert>; }

    return (
        <div>
            <Link to="/slots/counter" className="btn btn-secondary mb-3">
                <i className="bi bi-arrow-left me-2"></i>Zurück zum Slot-Inventar
            </Link>
        <Card>
            <Card.Header as="h3">Slot-Serie löschen</Card.Header>
            <Card.Body>
                <Card.Title>Slot-Muster</Card.Title>
                <p>{queryParams.get('von')} <i className="bi bi-arrow-right-short"></i> {queryParams.get('bis')} (Abschnitt <strong>{queryParams.get('Abschnitt')}</strong>, Verkehrsart <strong>{queryParams.get('Verkehrsart')}</strong>)</p>
                <p>Abfahrt: {String(queryParams.get('abfahrtStunde')).padStart(2, '0')}:{String(queryParams.get('abfahrtMinute')).padStart(2, '0')} Ankunft: {String(queryParams.get('ankunftStunde')).padStart(2, '0')}:{String(queryParams.get('ankunftMinute')).padStart(2, '0')}</p>
                <hr/>
                <p>Wählen Sie die zu löschenden Instanzen aus. Es können nur Slots gelöscht werden, denen keine Anfragen zugeordnet sind.</p>
                <Table striped hover size="sm">
                    <thead>
                        <tr>
                            <th>Löschen?</th>
                            <th>Slot ID</th>
                            <th>KW (rel.)</th>
                            <th>Verkehrstag</th>
                            <th>Anzahl Anfragen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {slots.map(slot => {
                            const isBelegt = slot.zugewieseneAnfragen.length > 0;
                            return (
                                <tr key={slot._id} className={isBelegt ? 'table-secondary' : ''}>
                                    <td>
                                        <Form.Check 
                                            type="checkbox"
                                            id={`check-${slot._id}`}
                                            checked={selectedSlots.has(slot._id)}
                                            onChange={() => handleCheckboxChange(slot._id)}
                                            
                                        />
                                    </td>
                                    <td><code>{slot.SlotID_Sprechend}</code></td>
                                    <td>{slot.Kalenderwoche}</td>
                                    <td>{slot.Verkehrstag}</td>
                                    <td className={isBelegt ? 'fw-bold text-danger' : ''}>{slot.zugewieseneAnfragen.length}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
                <div className="d-grid">
                    <Button variant="danger" onClick={handleDelete} disabled={isDeleteDisabled || loading}>
                        {loading ? <Spinner size="sm"/> : `${selectedSlots.size} ausgewählte Slots löschen`}
                    </Button>
                </div>
                {isDeleteDisabled && selectedSlots.size > 0 && 
                    <Alert variant="warning" className="mt-3">
                        Mindestens ein ausgewählter Slot ist noch belegt und kann nicht gelöscht werden. Bitte entfernen Sie die Markierung für belegte Slots.
                    </Alert>
                }
            </Card.Body>
        </Card>
        </div>
    );
}

export default SlotDeletionPage;