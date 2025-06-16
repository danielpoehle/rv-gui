// src/pages/KonfliktOverviewPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/apiClient';
import { Table, Spinner, Alert, Pagination, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Helfer für Status-Farben
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

// Farb-Mapping für die Verkehrsart-Badges
const verkehrsartColorMap = {
    SPFV: 'danger', SPNV: 'success', SGV: 'primary', ALLE: 'dark'
};

function KonfliktOverviewPage() {
    const [konflikte, setKonflikte] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [limitPerPage] = useState(15);

    useEffect(() => {
        const fetchKonflikte = async () => {
            setLoading(true);
            try {
                // Lade initial nur die offenen Konflikte für eine bessere Übersicht
                const response = await apiClient.get(`/konflikte?page=${currentPage}&limit=${limitPerPage}&status=offen`);
                setKonflikte(response.data.data);
                setTotalPages(response.data.totalPages);
                setError(null);
            } catch (err) {
                setError("Fehler beim Laden der Konflikte.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchKonflikte();
    }, [currentPage, limitPerPage]);

    // Paginierungslogik (handlePageChange, paginationItems) wie auf den anderen Seiten...
    // LOGIK ZUR GENERIERUNG DER SEITENZAHLEN
    // useMemo sorgt dafür, dass diese Berechnung nur neu ausgeführt wird, wenn sich
    // currentPage oder totalPages ändern, was die Performance verbessert.

    // Handler-Funktion, die aufgerufen wird, wenn eine neue Seite angeklickt wird
    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return; // Ungültige Seiten verhindern
        setCurrentPage(pageNumber);
    };


    const paginationItems = useMemo(() => {
        const siblingCount = 2; // Wie viele Nachbarn links und rechts von der aktuellen Seite
        const totalPageNumbers = siblingCount + 5; // current + 2*siblings + first + last + 2*ellipsis

        // Fall 1: Weniger Seiten als wir anzeigen wollen -> zeige alle
        if (totalPages <= totalPageNumbers) {
            const items = [];
            for (let i = 1; i <= totalPages; i++) items.push(i);
            return items;
        }

        const shouldShowLeftEllipsis = currentPage - siblingCount > 2;
        const shouldShowRightEllipsis = currentPage + siblingCount < totalPages - 1;

        // Fall 2: Nur rechte Ellipse anzeigen (wir sind am Anfang)
        if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
            const items = [];
            for (let i = 1; i <= 3 + 2 * siblingCount; i++) items.push(i);
            return [...items, '...', totalPages];
        }
        
        // Fall 3: Nur linke Ellipse anzeigen (wir sind am Ende)
        if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
            const items = [];
            for (let i = totalPages - (2 + 2 * siblingCount); i <= totalPages; i++) items.push(i);
            return [1, '...', ...items];
        }

        // Fall 4: Beide Ellipsen anzeigen (wir sind in der Mitte)
        if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
            const items = [];
            for (let i = currentPage - siblingCount; i <= currentPage + siblingCount; i++) items.push(i);
            return [1, '...', ...items, '...', totalPages];
        }

        return []; // Fallback
    }, [currentPage, totalPages]);

    // Rendere einen Lade-Spinner, während die Daten geholt werden
    if (loading) {
        return (
            <div className="text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Lade Konflikte...</span>
                </Spinner>
                <p>Lade Konflikte...</p>
            </div>
        );
    }

    // Rendere eine Fehlermeldung, falls ein Fehler aufgetreten ist
    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }


    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1><i className="bi bi-exclamation-triangle-fill me-3"></i>Konflikt-Übersicht</h1>
                {/* Hier könnten später die Buttons zum Anstoßen der Erkennung hin */}
            </div>
            
            {konflikte.length === 0 ? (
                <Alert variant="info">Aktuell keine offenen Konflikte gefunden.</Alert>
            ) : (
                <>
                    <Table striped bordered hover responsive size="sm" className="shadow-sm">
                        <thead className="table-dark">
                            <tr>
                                <th>Kapazitätstopf</th>
                                <th>VA</th>
                                <th>Max. Kap.</th>
                                <th>Beteiligte Anfr.</th>
                                <th>Zugewiesene Anfr.</th>
                                <th>Abgelehnt/Verzicht</th>
                                <th>Konflikt-Status</th>
                                <th>Details</th>
                                <th>Aktion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {konflikte.map(konflikt => (
                                <tr key={konflikt._id}>
                                    <td><code>{konflikt.ausloesenderKapazitaetstopf?.TopfID || 'N/A'}</code></td>
                                    <td>
                                        <Badge bg={verkehrsartColorMap[konflikt.ausloesenderKapazitaetstopf?.Verkehrsart] || 'secondary'}>
                                            {konflikt.ausloesenderKapazitaetstopf?.Verkehrsart || 'N/A'}
                                        </Badge>
                                    </td>
                                    <td>{konflikt.ausloesenderKapazitaetstopf?.maxKapazitaet ?? 'N/A'}</td>
                                    <td className="fw-bold">{konflikt.statistik.anzahlBeteiligter}</td>
                                    <td>{konflikt.statistik.anzahlZugewiesener}</td>
                                    <td>{konflikt.statistik.anzahlAbgelehnter}</td>
                                    <td>
                                        <Badge bg={getKonfliktStatusBadgeVariant(konflikt.status)} pill>
                                            {konflikt.status}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Link to={`/konflikte/${konflikt._id}`}>
                                            <Button variant="outline-primary" size="sm" title="Details anzeigen">
                                                <i className="bi bi-search"></i>
                                            </Button>
                                        </Link>
                                    </td>
                                    <td>
                                        {konflikt.gruppenId ? (
                                            <Link to={`/konflikte/gruppen/${konflikt.gruppenId}/bearbeiten`}>
                                                <Button variant="outline-primary" size="sm" title="Gruppe bearbeiten">
                                                    <i className="bi bi-tools"></i> Gruppe bearbeiten
                                                </Button>
                                            </Link>
                                        ) : (
                                            // Fallback, falls es ein Einzelkonflikt ohne Gruppe ist
                                            <Button variant="secondary" size="sm" disabled>Einzel</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {/* Paginierungs-Steuerung, wird nur angezeigt, wenn es mehr als eine Seite gibt */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <Pagination>
                                <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                                <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                                
                                {/* NEUES RENDERING DER SEITENZAHLEN */}
                                {paginationItems.map((item, index) => {
                                    if (typeof item === 'string') {
                                        // item ist '...'
                                        return <Pagination.Ellipsis key={`ellipsis-${index}`} disabled />;
                                    }
                                    return (
                                        <Pagination.Item 
                                            key={item} 
                                            active={item === currentPage} 
                                            onClick={() => handlePageChange(item)}
                                        >
                                            {item}
                                        </Pagination.Item>
                                    );
                                })}

                                <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                                <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                            </Pagination>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default KonfliktOverviewPage;