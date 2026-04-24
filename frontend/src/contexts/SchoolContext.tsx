import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { schoolService } from '@/services/api';
import type { SchoolSettings } from '@/types';

interface SchoolContextType {
    settings: SchoolSettings;
    loading: boolean;
    refreshSettings: () => Promise<void>;
    updateSettings: (data: Partial<SchoolSettings> | FormData) => Promise<void>;
}

const defaultSettings: SchoolSettings = {
    name: 'XSCHOOL',
    email: 'contact@ecole.cm',
    phone: '+237 699 00 11 22',
    address: 'Bastos, Yaoundé, Cameroun',
    website: 'https://vanda-studio.tech',
    slogan: 'EXCELLENCE & DISCIPLINE',
    logo: null,
    enable_email_alerts: true,
    enable_sms_alerts: false,
    payment_reminder_days: 3,
    low_grade_threshold: 10.00,
    currency_symbol: 'FCFA',
    currency_code: 'XAF',
    tranche_1_deadline: '2026-10-14',
    tranche_2_deadline: '2026-11-01',
    tranche_3_deadline: '2027-01-01',
    exam_fee_amount: 10000,
    enable_cash_payment: true,
    enable_mobile_payment: true,
    enable_bank_transfer: false,
    bank_details: '',
    receipt_footer: '',
    session_timeout: 30,
    min_password_length: 8,
    max_login_attempts: 5,
    require_strong_password: true,
    maintenance_mode: false,
    two_factor_enforcement: false,
    selected_types: [],
    owner_id: null,
};

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SchoolSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    const refreshSettings = useCallback(async () => {
        try {
            const response = await schoolService.getSettings();
            const data = response.data;
            if (data.logo && !data.logo.startsWith('http')) {
                // Use the same hostname as the current page, but point to backend port (8000)
                const backendHost = window.location.hostname;
                data.logo = `http://${backendHost}:8000${data.logo}`;
            }
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch school settings', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateSettings = async (data: Partial<SchoolSettings> | FormData) => {
        try {
            const response = await schoolService.updateSettings(data);
            const resData = response.data;
            if (resData.logo && !resData.logo.startsWith('http')) {
                const backendHost = window.location.hostname;
                resData.logo = `http://${backendHost}:8000${resData.logo}`;
            }
            setSettings(resData);
        } catch (error) {
            console.error('Failed to update school settings', error);
            throw error;
        }
    };

    useEffect(() => {
        refreshSettings();
    }, [refreshSettings]);

    return (
        <SchoolContext.Provider value={{ settings, loading, refreshSettings, updateSettings }}>
            {children}
        </SchoolContext.Provider>
    );
};

export const useSchool = () => {
    const context = useContext(SchoolContext);
    if (context === undefined) {
        throw new Error('useSchool must be used within a SchoolProvider');
    }
    return context;
};
