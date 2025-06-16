// src/pages/AnfrageOverviewPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/apiClient';
import { Table, Spinner, Alert, Pagination, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns'; // Für Datumsformatierung

// Helferfunktion für die Anfrage-Status-Farben (könnte in eine Util-Datei ausgelagert werden)
const getAnfrageStatusBadgeVariant = (status) => {
    if (!status) return 'secondary';
    if (status.startsWith('bestaetigt')) return 'success';
    if (status.startsWith('abgelehnt')) return 'danger';
    if (status.startsWith('wartet')) return 'warning';
    if (status.startsWith('in_konflikt')) return 'info';
    return 'secondary';
};

const verkehrsartColorMap = {
  SPFV: 'danger',   // rot
  SPNV: 'success',  // grün
  SGV: 'primary',   // blau
  ALLE: 'dark'      // dunkelgrau
};


function AnfrageOverviewPage() {
    const [anfragen, setAnfragen] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [limitPerPage] = useState(15);

    useEffect(() => {
        const fetchAnfragen = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get(`/anfragen?page=${currentPage}&limit=${limitPerPage}`);
                setAnfragen(response.data.data);
                setTotalPages(response.data.totalPages);
                setError(null);
            } catch (err) {
                console.error("Fehler beim Laden der Anfragen:", err);
                setError("Fehler beim Laden der Anfragen.");
            } finally {
                setLoading(false);
            }
        };
        fetchAnfragen();
    }, [currentPage, limitPerPage]);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
            setCurrentPage(pageNumber);
        }
    };

    // Die intelligente Paginierungslogik (identisch zur Slot-Seite)
    const paginationItems = useMemo(() => {
        const siblingCount = 2;
        const totalPageNumbers = siblingCount + 5;
        if (totalPages <= totalPageNumbers) {
            const items = []; for (let i = 1; i <= totalPages; i++) items.push(i); return items;
        }
        const shouldShowLeftEllipsis = currentPage - siblingCount > 2;
        const shouldShowRightEllipsis = currentPage + siblingCount < totalPages - 1;
        if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
            const items = []; for (let i = 1; i <= 3 + 2 * siblingCount; i++) items.push(i); return [...items, '...', totalPages];
        }
        if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
            const items = []; for (let i = totalPages - (2 + 2 * siblingCount); i <= totalPages; i++) items.push(i); return [1, '...', ...items];
        }
        if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
            const items = []; for (let i = currentPage - siblingCount; i <= currentPage + siblingCount; i++) items.push(i); return [1, '...', ...items, '...', totalPages];
        }
        return [];
    }, [currentPage, totalPages]);

    if (loading) { return <div className="text-center mt-5"><Spinner animation="border" /></div>; }
    if (error) { return <Alert variant="danger">{error}</Alert>; }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1><i className="bi bi-card-list me-3"></i>Anfragen-Übersicht</h1>
                <div> 
                    <Link to="/anfragen/summary" className="me-2">
                        <Button variant="info">
                            <i className="bi bi-bar-chart-line-fill me-2"></i>Zusammenfassung anzeigen
                        </Button>
                    </Link>
                    <Link to="/anfragen/neu">
                        <Button variant="success">
                            <i className="bi bi-plus-lg me-2"></i>Neue Anfrage erstellen
                        </Button>
                    </Link>
                </div>
            </div>
            
            {anfragen.length === 0 ? (
                <Alert variant="info">Keine Anfragen gefunden.</Alert>
            ) : (
                <>
                    <Table striped bordered hover responsive size="sm" className="shadow-sm">
                        <thead className="table-dark">
                            <tr>
                                <th>Anfrage-ID</th>
                                <th>VA</th>
                                <th>VT</th>
                                <th>Zeitraum</th>
                                <th>Entgelt (€)</th>
                                <th>Gesamtstatus</th>
                                <th>Konflikt-Töpfe</th>
                                <th>Konflikt-Slots</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {anfragen.map(anfrage => (
                                <tr key={anfrage._id}>
                                    <td><code>{anfrage.AnfrageID_Sprechend}</code></td>
                                    <td><Badge bg={verkehrsartColorMap[anfrage.Verkehrsart] || 'secondary'}>{anfrage.Verkehrsart}</Badge></td>
                                    <td>{anfrage.Verkehrstag}</td>
                                    <td>
                                        {format(parseISO(anfrage.Zeitraum.start), 'dd.MM.yyyy')} - 
                                        {format(parseISO(anfrage.Zeitraum.ende), 'dd.MM.yyyy')}
                                    </td>
                                    <td className="text-end">{anfrage.Entgelt ? anfrage.Entgelt.toFixed(2) : '0.00'}</td>
                                    <td>
                                        <Badge bg={getAnfrageStatusBadgeVariant(anfrage.Status)} pill>
                                            {anfrage.Status}
                                        </Badge>
                                    </td>
                                    <td className={anfrage.statistik.anzahlKonfliktToepfe > 0 ? 'text-danger fw-bold' : ''}>
                                        {anfrage.statistik.anzahlKonfliktToepfe} / {anfrage.statistik.anzahlZugewiesenerToepfe}
                                    </td>
                                    <td className={anfrage.statistik.anzahlKonfliktSlots > 0 ? 'text-danger fw-bold' : ''}>
                                        {anfrage.statistik.anzahlKonfliktSlots} / {anfrage.statistik.anzahlZugewiesenerSlots}
                                    </td>
                                    <td>
                                        <Link to={`/anfragen/${anfrage._id}`}>
                                            <Button variant="outline-primary" size="sm" title="Details anzeigen">
                                                <i className="bi bi-search"></i>
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {/* Paginierungs-Komponente wie zuvor hier einfügen */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <Pagination>
                                <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                                <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                                {paginationItems.map((item, index) =>
                                    typeof item === 'string' ? (
                                        <Pagination.Ellipsis key={`ellipsis-${index}`} disabled />
                                    ) : (
                                        <Pagination.Item key={item} active={item === currentPage} onClick={() => handlePageChange(item)}>
                                            {item}
                                        </Pagination.Item>
                                    )
                                )}
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

export default AnfrageOverviewPage;