// src/pages/DashboardPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';

// Kleine Helfer-Komponente für die Navigations-Kacheln
function NavCard({ to, iconClass, title, text }) {
    return (
        <Col md={6} lg={4} className="mb-4">
            <Card className="h-100 text-center shadow-sm">
                <Card.Body className="d-flex flex-column justify-content-between">
                    <div>
                        <i className={`${iconClass} display-4 mb-3`}></i>
                        <Card.Title as="h4">{title}</Card.Title>
                        <Card.Text>{text}</Card.Text>
                    </div>
                    <Link to={to} className="mt-3">
                        <Button variant="primary">Öffnen</Button>
                    </Link>
                </Card.Body>
            </Card>
        </Col>
    );
}


function DashboardPage() {
    return (
        <Container>
            <div className="text-center mb-5">
                <h1 className="display-5">Slot- & Konfliktmanagement für Rahmenverträge</h1>
                <p className="lead">Willkommen! Bitte wähle einen Bereich zur Bearbeitung aus.</p>
            </div>
            
            <Row>
                <NavCard 
                    to="/slots"
                    iconClass="bi bi-calendar3-range"
                    title="Slot-Übersicht"
                    text="Alle verfügbaren Infrastruktur-Slots anzeigen und verwalten."
                />
                <NavCard 
                    to="/slots/neu" // Pfad für neue Seite
                    iconClass="bi bi-calendar-plus"
                    title="Neuen Slot anlegen"
                    text="Einen neuen, buchbaren Infrastruktur-Slot definieren."
                />
                 <NavCard 
                    to="/anfragen" // Pfad für neue Seite
                    iconClass="bi bi-list-columns-reverse"
                    title="Anfragen-Übersicht"
                    text="Alle eingegangenen Trassen-Anfragen und ihren Status einsehen."
                />
                 <NavCard 
                    to="/anfragen/neu" // Pfad für neue Seite
                    iconClass="bi bi-envelope-arrow-down"
                    title="Neue Anfrage für RV stellen"
                    text="Eine neue Trassen-Anfrage mit gewünschten Slot-Abschnitten einreichen."
                />
                 <NavCard 
                    to="/kapazitaetstoepfe" // Pfad für neue Seite
                    iconClass="bbi bi-beaker-fill"
                    title="Kapazitätstöpfe"
                    text="Alle Kapazitätstöpfe und ihre Auslastung anzeigen und verwalten."
                />
                <NavCard 
                    to="/gruppen" // Pfad für neue Seite
                    iconClass="bi bi-kanban"
                    title="Übersicht Konflikt-Gruppen"
                    text="Eine Liste aller offenen und bearbeiteten Gruppen gleichartiger Kapazitätskonflikte anzeigen."
                />
                <NavCard 
                    to="/konflikte" // Pfad für neue Seite
                    iconClass="bi bi-exclamation-triangle-fill"
                    title="Konflikt-Übersicht"
                    text="Eine Liste aller offenen und bearbeiteten einzelnen Kapazitätskonflikte anzeigen."
                />
                 <NavCard 
                    to="/konflikte/bearbeiten" // Pfad für neue Seite
                    iconClass="bi bi-tools"
                    title="Konflikte bearbeiten"
                    text="Offene Konfliktgruppen für die Koordination und Lösung aufrufen."
                />
            </Row>
        </Container>
    );
}

export default DashboardPage;