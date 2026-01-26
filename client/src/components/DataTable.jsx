import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

export default function DataTable({
    columns,
    data,
    loading = false,
    searchable = true,
    onRowClick,
    emptyMessage = 'No data found',
    actions,
}) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');

    // Handle sorting
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Filter and sort data
    const processedData = useMemo(() => {
        let result = [...data];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(row =>
                columns.some(col => {
                    const value = row[col.key];
                    return value?.toString().toLowerCase().includes(term);
                })
            );
        }

        // Sort
        if (sortConfig.key) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, searchTerm, sortConfig, columns]);

    if (loading) {
        return (
            <div className="data-table-container">
                <div style={{ padding: 'var(--spacing-6)' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="skeleton skeleton-text" style={{ marginBottom: 'var(--spacing-3)' }}></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Search Bar */}
            {searchable && (
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <div className="input-with-icon">
                        <Search className="icon" size={20} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search in table..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    onClick={() => col.sortable !== false && handleSort(col.key)}
                                    style={{
                                        cursor: col.sortable !== false ? 'pointer' : 'default',
                                        userSelect: 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                                        {col.label}
                                        {col.sortable !== false && sortConfig.key === col.key && (
                                            sortConfig.direction === 'asc'
                                                ? <ChevronUp size={16} />
                                                : <ChevronDown size={16} />
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions && <th style={{ width: 100 }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {processedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)}>
                                    <div className="empty-state" style={{ padding: 'var(--spacing-8)' }}>
                                        <p className="empty-state-description">{emptyMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            processedData.map((row, index) => (
                                <tr
                                    key={row.id || index}
                                    onClick={() => onRowClick?.(row)}
                                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                                >
                                    {columns.map(col => (
                                        <td key={col.key}>
                                            {col.render ? col.render(row[col.key], row) : row[col.key]}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td onClick={e => e.stopPropagation()}>
                                            {actions(row)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
