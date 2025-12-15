import React, { useEffect, useRef } from 'react';

interface AlertModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    buttonText?: string;
    onClose: () => void;
    variant?: 'info' | 'success' | 'warning' | 'error';
}

const AlertModal: React.FC<AlertModalProps> = ({
    isOpen,
    title,
    message,
    buttonText = 'OK',
    onClose,
    variant = 'info'
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            buttonRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Escape' || e.key === 'Enter') && isOpen) {
                e.preventDefault();
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getVariantClass = () => {
        switch (variant) {
            case 'success': return 'alert-success';
            case 'warning': return 'alert-warning';
            case 'error': return 'alert-error';
            default: return 'alert-info';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-dialog alert-modal ${getVariantClass()}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                </div>

                <div className="modal-content">
                    <p className="alert-message">{message}</p>
                </div>

                <div className="modal-footer">
                    <button
                        ref={buttonRef}
                        className="btn-primary"
                        onClick={onClose}
                        type="button"
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;