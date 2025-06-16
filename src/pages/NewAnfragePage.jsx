import React, { useState } from 'react';
//import axios from 'axios';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
//import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

function NewAnfragePage() {
    //const navigate = useNavigate();
    const [formData, setFormData] = useState({
        Zugnummer: '',
        EVU: '',
        Verkehrsart: 'SPFV',
        Verkehrstag: 'täglich',
        zeitraumStart: '',
        zeitraumEnde: '',
        Email: '',
        // Starte mit einem leeren Abschnitt, den der Benutzer ausfüllen kann
        gewuenschteSlots: [
            { von: '', bis: '', AbfahrtStunde: '08', AbfahrtMinute: '00', AnkunftStunde: '09', AnkunftMinute: '00' }
        ]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Allgemeiner Handler für die Haupt-Formularfelder
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Spezieller Handler für Änderungen innerhalb eines gewünschten Slot-Abschnitts
    const handleSlotChange = (index, e) => {
        const updatedSlots = formData.gewuenschteSlots.map((slot, i) => {
            if (i === index) {
                return { ...slot, [e.target.name]: e.target.value };
            }
            return slot;
        });
        setFormData({ ...formData, gewuenschteSlots: updatedSlots });
    };

    // Fügt einen neuen, leeren Slot-Abschnitt zur Liste hinzu
    const handleAddSlot = () => {
        setFormData({
            ...formData,
            gewuenschteSlots: [
                ...formData.gewuenschteSlots,
                { von: '', bis: '', AbfahrtStunde: '10', AbfahrtMinute: '00', AnkunftStunde: '11', AnkunftMinute: '00' }
            ]
        });
    };

    // Entfernt einen Slot-Abschnitt aus der Liste anhand seines Index
    const handleRemoveSlot = (index) => {
        if (formData.gewuenschteSlots.length <= 1) return; // Verhindere das Löschen des letzten Abschnitts
        const updatedSlots = formData.gewuenschteSlots.filter((_, i) => i !== index);
        setFormData({ ...formData, gewuenschteSlots: updatedSlots });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Transformiere die Formulardaten in das vom Backend erwartete Payload-Format
        const payload = {
            Zugnummer: formData.Zugnummer,
            EVU: formData.EVU,
            Verkehrsart: formData.Verkehrsart,
            Verkehrstag: formData.Verkehrstag,
            Zeitraum: { start: formData.zeitraumStart, ende: formData.zeitraumEnde },
            Email: formData.Email,
            ListeGewuenschterSlotAbschnitte: formData.gewuenschteSlots.map(slot => ({
                von: slot.von,
                bis: slot.bis,
                Abfahrtszeit: { stunde: parseInt(slot.AbfahrtStunde), minute: parseInt(slot.AbfahrtMinute) },
                Ankunftszeit: { stunde: parseInt(slot.AnkunftStunde), minute: parseInt(slot.AnkunftMinute) }
            }))
        };

        try {
            const response = await apiClient.post('/anfragen', payload);
            setSuccess(`Anfrage "${response.data.data.AnfrageID_Sprechend}" erfolgreich erstellt und wird nun geprüft.`);
            // Nach Erfolg Formular zurücksetzen
            setFormData({ Zugnummer: '', EVU: '', Verkehrsart: 'SPFV', Verkehrstag: 'täglich', zeitraumStart: '', zeitraumEnde: '', Email: '', gewuenschteSlots: [{ von: '', bis: '', AbfahrtStunde: '08', AbfahrtMinute: '00', AnkunftStunde: '09', AnkunftMinute: '00' }] });
            // Optional: Nach 3 Sekunden zur Übersichtsseite weiterleiten
            //setTimeout(() => navigate('/anfragen'), 3000);
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Ein Fehler ist aufgetreten.';
            const errorDetails = err.response?.data?.errors?.join(', ') || '';
            setError(`${errorMsg} ${errorDetails}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <div>
                <Link to="/" className="btn btn-secondary mb-4">
                    <i className="bi bi-arrow-left me-2"></i>Zurück zur Startseite
                </Link>
            </div>
            <h1 className="mb-4"><i className="bi bi-file-earmark-plus me-3"></i>Neue Anfrage für RV stellen</h1>
            <Card className="p-4 shadow-sm">
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>EVU</Form.Label><Form.Control type="text" name="EVU" value={formData.EVU} onChange={handleChange} required /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Zugnummer</Form.Label><Form.Control type="text" name="Zugnummer" value={formData.Zugnummer} onChange={handleChange} required /></Form.Group></Col>
                    </Row>
                    <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Verkehrsart</Form.Label><Form.Select name="Verkehrsart" value={formData.Verkehrsart} onChange={handleChange}><option value="SPFV">SPFV</option><option value="SPNV">SPNV</option><option value="SGV">SGV</option></Form.Select></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Verkehrstag</Form.Label><Form.Select name="Verkehrstag" value={formData.Verkehrstag} onChange={handleChange}><option value="täglich">Täglich</option><option value="Mo-Fr">Mo-Fr</option><option value="Sa+So">Sa+So</option></Form.Select></Form.Group></Col>
                    </Row>
                    <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Startdatum des Zeitraums</Form.Label><Form.Control type="date" name="zeitraumStart" value={formData.zeitraumStart} onChange={handleChange} required /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Enddatum des Zeitraums</Form.Label><Form.Control type="date" name="zeitraumEnde" value={formData.zeitraumEnde} onChange={handleChange} required /></Form.Group></Col>
                    </Row>
                    <Form.Group className="mb-4"><Form.Label>Kontakt E-Mail</Form.Label><Form.Control type="email" name="Email" value={formData.Email} onChange={handleChange} required /></Form.Group>
                    
                    <hr />
                    <h4 className="mb-3">Gewünschte Slot-Abschnitte</h4>
                    {formData.gewuenschteSlots.map((slot, index) => (
                        <Card key={index} className="mb-3 p-3 bg-light">
                            <Row>
                                <Col xs={11}><h5>Abschnitt {index + 1}</h5></Col>
                                <Col xs={1} className="text-end">
                                    {formData.gewuenschteSlots.length > 1 && (
                                        <Button variant="outline-danger" size="sm" onClick={() => handleRemoveSlot(index)} title="Abschnitt entfernen">
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    )}
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}><Form.Group className="mb-2"><Form.Label>Von</Form.Label><Form.Control type="text" name="von" value={slot.von} onChange={(e) => handleSlotChange(index, e)} required /></Form.Group></Col>
                                <Col md={6}><Form.Group className="mb-2"><Form.Label>Bis</Form.Label><Form.Control type="text" name="bis" value={slot.bis} onChange={(e) => handleSlotChange(index, e)} required /></Form.Group></Col>
                            </Row>
                            <Row>
                                <Col>
                                    <Form.Label>Abfahrt (HH:MM)</Form.Label>
                                    <InputGroup>
                                        <Form.Control type="number" name="AbfahrtStunde" value={slot.AbfahrtStunde} onChange={(e) => handleSlotChange(index, e)} min="0" max="23" />
                                        <InputGroup.Text>:</InputGroup.Text>
                                        <Form.Control type="number" name="AbfahrtMinute" value={slot.AbfahrtMinute} onChange={(e) => handleSlotChange(index, e)} min="0" max="59" />
                                    </InputGroup>
                                </Col>
                                <Col>
                                    <Form.Label>Ankunft (HH:MM)</Form.Label>
                                    <InputGroup>
                                        <Form.Control type="number" name="AnkunftStunde" value={slot.AnkunftStunde} onChange={(e) => handleSlotChange(index, e)} min="0" max="23" />
                                        <InputGroup.Text>:</InputGroup.Text>
                                        <Form.Control type="number" name="AnkunftMinute" value={slot.AnkunftMinute} onChange={(e) => handleSlotChange(index, e)} min="0" max="59" />
                                    </InputGroup>
                                </Col>
                            </Row>
                        </Card>
                    ))}
                    <Button variant="outline-success" onClick={handleAddSlot} className="w-100 mb-4">
                        <i className="bi bi-plus-circle-dotted me-2"></i>Weiteren Abschnitt hinzufügen
                    </Button>
                    
                    <Button variant="primary" type="submit" disabled={loading} className="w-100 btn-lg">
                        {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Anfrage einreichen'}
                    </Button>
                </Form>
                {success && <Alert variant="success" className="mt-4">{success}</Alert>}
                {error && <Alert variant="danger" className="mt-4">{error}</Alert>}
            </Card>
        </Container>
    );
}

export default NewAnfragePage;