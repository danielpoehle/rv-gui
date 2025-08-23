// src/pages/NewSlotPage.jsx
import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
//import { useNavigate } from 'react-router-dom';

function NewSlotPage() {
    //const navigate = useNavigate(); // Hook zur Weiterleitung nach Erfolg
    const [isNachtSlot, setIsNachtSlot] = useState(false); 
    const [formData, setFormData] = useState({
        Linienbezeichnung: '',
        von: '',
        bis: '',
        Abschnitt: '',        
        Verkehrstag: 'täglich',
        Grundentgelt: 100,        
        zeitraumStart: '',
        zeitraumEnde: '',
        // Felder für Tag-Slots
        AbfahrtStunde: '08',
        AbfahrtMinute: '00',
        AnkunftStunde: '09',
        AnkunftMinute: '00',
        Verkehrsart: 'SPFV',
        // Felder für Nacht-Slots
        Zeitfenster: '23-01',
        Mindestfahrzeit: 30,
        Maximalfahrzeit: 120,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Leite den `slotTyp` aus dem `isNachtSlot`-State ab
        const slotTyp = isNachtSlot ? 'NACHT' : 'TAG';

        const basePayload = {
            slotTyp: slotTyp,
            von: formData.von,
            bis: formData.bis,
            Abschnitt: formData.Abschnitt,
            Verkehrstag: formData.Verkehrstag,
            Grundentgelt: parseFloat(formData.Grundentgelt),
            Linienbezeichnung: formData.Linienbezeichnung,
            zeitraumStart: formData.zeitraumStart,
            zeitraumEnde: formData.zeitraumEnde
        };

        const finalPayload = slotTyp === 'NACHT'
            ? { ...basePayload, Zeitfenster: formData.Zeitfenster, Mindestfahrzeit: formData.Mindestfahrzeit, Maximalfahrzeit: formData.Maximalfahrzeit }
            : { ...basePayload, 
                Abfahrt: { stunde: parseInt(formData.AbfahrtStunde), minute: parseInt(formData.AbfahrtMinute) }, 
                Ankunft: { stunde: parseInt(formData.AnkunftStunde), minute: parseInt(formData.AnkunftMinute) }, 
                Verkehrsart: formData.Verkehrsart };        

        try {
            const response = await apiClient.post('/slots/massen-erstellung', finalPayload);
            setSuccess(`Erfolg! ${response.data.erstellteSlots.length} Slots wurden erstellt. Fehler: ${response.data.fehler.length}.`);
            // Optional: Nach Erfolg weiterleiten
            // setTimeout(() => navigate('/slots'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Ein Fehler ist aufgetreten.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid>
            <div>
                <Link to="/" className="btn btn-secondary mb-4">
                    <i className="bi bi-arrow-left me-2"></i>Zurück zur Startseite
                </Link>
            </div>
            <h1 className="mb-4"><i className="bi bi-calendar-plus me-3"></i>Slots in Serie anlegen</h1>
            <Card className="p-4 shadow-sm">
                <Form.Group className="mb-4">
                    <Form.Label>Erstellung Slot für Tag oder Nacht</Form.Label>                    
                    <Row>
                        <Col md={5} className={!isNachtSlot && 'bg-warning'}><i className="bi bi-sun-fill me-1"></i> Tag-Slot (05:00-22:59)</Col>
                        <Col md={1} className="me-2">
                            <Form.Check 
                            type="switch"
                            id="slot-typ-switch"
                            label=""
                            checked={isNachtSlot}
                            onChange={(e) => setIsNachtSlot(e.target.checked)}
                            />   
                        </Col>
                        <Col md={5} className={isNachtSlot && 'bg-primary text-white'}><i className="bi bi-moon-stars-fill me-1"></i> Nacht-Slot (23:00-04:59)</Col>
                    </Row>
                    
                                     
                </Form.Group>
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={12}>
                            <Form.Group className="mb-3">
                                <Form.Label>Linienbezeichnung (optional)</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    name="Linienbezeichnung" 
                                    value={formData.Linienbezeichnung} 
                                    onChange={handleChange} 
                                    placeholder="z.B. Li.10.2"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Von</Form.Label><Form.Control type="text" name="von" value={formData.von} onChange={handleChange} required /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Bis</Form.Label><Form.Control type="text" name="bis" value={formData.bis} onChange={handleChange} required /></Form.Group></Col>
                    </Row>
                    <Form.Group className="mb-3"><Form.Label>Abschnitt</Form.Label><Form.Control type="text" name="Abschnitt" value={formData.Abschnitt} onChange={handleChange} required /></Form.Group>
                    <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Verkehrstag</Form.Label><Form.Select name="Verkehrstag" value={formData.Verkehrstag} onChange={handleChange} required><option value="täglich">täglich</option><option value="Mo-Fr">Mo-Fr</option><option value="Sa+So">Sa+So</option></Form.Select></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Grundentgelt (€)</Form.Label><Form.Control type="number" name="Grundentgelt" value={formData.Grundentgelt} onChange={handleChange} min="0" step="0.01" required /></Form.Group></Col>
                    </Row>
                    {!isNachtSlot && (
                        <>
                            <Row>
                                <Col><Form.Group className="mb-3"><Form.Label>Abfahrt (Std)</Form.Label><Form.Control type="number" name="AbfahrtStunde" value={formData.AbfahrtStunde} onChange={handleChange} min="0" max="23" required /></Form.Group></Col>
                                <Col><Form.Group className="mb-3"><Form.Label>Abfahrt (Min)</Form.Label><Form.Control type="number" name="AbfahrtMinute" value={formData.AbfahrtMinute} onChange={handleChange} min="0" max="59" step="1" required /></Form.Group></Col>
                                <Col><Form.Group className="mb-3"><Form.Label>Ankunft (Std)</Form.Label><Form.Control type="number" name="AnkunftStunde" value={formData.AnkunftStunde} onChange={handleChange} min="0" max="23" required /></Form.Group></Col>
                                <Col><Form.Group className="mb-3"><Form.Label>Ankunft (Min)</Form.Label><Form.Control type="number" name="AnkunftMinute" value={formData.AnkunftMinute} onChange={handleChange} min="0" max="59" step="1" required /></Form.Group></Col>
                            </Row>
                            <Row> 
                                <Col md={4}><Form.Group className="mb-3"><Form.Label>Verkehrsart</Form.Label><Form.Select name="Verkehrsart" value={formData.Verkehrsart} onChange={handleChange} required><option value="SPFV">SPFV</option><option value="SPNV">SPNV</option><option value="SGV">SGV</option></Form.Select></Form.Group></Col> 
                            </Row>
                        </>
                    )}
                    {isNachtSlot && (
                        <>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Zeitfenster</Form.Label><Form.Select name="Zeitfenster" value={formData.Zeitfenster} onChange={handleChange}><option value="23-01">23-01</option><option value="01-03">01-03</option><option value="03-05">03-05</option></Form.Select></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Min. Fahrzeit (min)</Form.Label><Form.Control type="number" name="Mindestfahrzeit" value={formData.Mindestfahrzeit} onChange={handleChange} /></Form.Group></Col>
                            <Col md={6}><Form.Group className="mb-3"><Form.Label>Max. Fahrzeit (min)</Form.Label><Form.Control type="number" name="Maximalfahrzeit" value={formData.Maximalfahrzeit} onChange={handleChange} /></Form.Group></Col>
                        </Row>
                        </>  
                    )}                 
                     
                    <hr className="my-4"/>
                    <h4 className="mb-3">Zeitraum für Serienerstellung</h4>
                    <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Startdatum</Form.Label><Form.Control type="date" name="zeitraumStart" value={formData.zeitraumStart} onChange={handleChange} required /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Enddatum</Form.Label><Form.Control type="date" name="zeitraumEnde" value={formData.zeitraumEnde} onChange={handleChange} required /></Form.Group></Col>
                    </Row>
                    
                    <Button variant="primary" type="submit" disabled={loading} className="w-100 mt-3">
                        {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Slots erstellen'}
                    </Button>
                </Form>
                {success && <Alert variant="success" className="mt-4">{success}</Alert>}
                {error && <Alert variant="danger" className="mt-4">{error}</Alert>}
            </Card>            
        </Container>
    );
}

export default NewSlotPage;