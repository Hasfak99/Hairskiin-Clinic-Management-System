import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select...",
    label,
    required = false,
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    // Get selected option label
    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="input-group" ref={wrapperRef}>
            {label && <label className="input-label">{label} {required && '*'}</label>}

            <div style={{ position: 'relative' }}>
                <div
                    className={`input ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    style={{
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: disabled ? 'var(--surface-muted)' : 'var(--surface)',
                    }}
                >
                    <span style={{
                        color: selectedOption ? 'var(--text-main)' : 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                </div>

                {isOpen && !disabled && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        transform: 'translateY(4px)',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 50,
                        maxHeight: '300px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'var(--surface-muted)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '4px 8px'
                            }}>
                                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search..."
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        outline: 'none',
                                        width: '100%',
                                        marginLeft: '8px',
                                        fontSize: '14px'
                                    }}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {searchTerm && (
                                    <X
                                        size={14}
                                        style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSearchTerm('');
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(option => (
                                    <div
                                        key={option.value}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                            setSearchTerm('');
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background: option.value === value ? 'var(--primary-50)' : 'transparent',
                                            color: option.value === value ? 'var(--primary-700)' : 'var(--text-main)',
                                            fontSize: '14px',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (option.value !== value) e.currentTarget.style.background = 'var(--surface-muted)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (option.value !== value) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        {option.label}
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                                    No results found
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
